import React, { useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    AMap: any;
  }
}


type RoutePlace = { name: string; desc?: string; day?: number };

interface MapViewProps {
  destination: string;
  routePlaces?: RoutePlace[];
}

import { Modal, Image, Spin, Tag } from 'antd';

// 通用：带 TTL 的结果缓存 + 并发去重 + 超时与重试（最小改动：无需改调用方）
function makeCachedRequester<T>(ttlMs: number) {
  const cache = new Map<string, { value: T; ts: number }>();
  const inflight = new Map<string, Promise<T>>();

  // 内部工具：sleep、退避时间
  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
  const timeoutMs = 3000;     // JSONP 可能不回调，提供兜底超时
  const retries = 2;          // 共尝试 3 次（0、1、2）
  const baseDelay = 400;      // 退避基数
  const jitter = true;        // 抖动，避免齐刷刷重试
  const backoff = (i: number) => {
    let d = baseDelay * (i + 1);
    if (jitter) d = Math.round(d * (0.7 + Math.random() * 0.6));
    return sleep(d);
  };

  return (key: string, fetcher: () => Promise<T>): Promise<T> => {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts <= ttlMs) return Promise.resolve(hit.value);

    const pending = inflight.get(key);
    if (pending) return pending;

    const p = (async () => {
      let lastVal: any = null;
      for (let i = 0; i <= retries; i++) {
        try {
          // 为 fetcher 增加超时兜底，避免 JSONP 无回调时悬挂
          const val = await Promise.race<T>([
            fetcher(),
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
          ]);
          lastVal = val;
          const isNullish = val === null || val === undefined;
          // 将 null/undefined 视为失败以便重试，成功才缓存
          if (isNullish) {
            if (i < retries) { await backoff(i); continue; }
            return lastVal as T; // 最终失败：返回 null，不缓存
          }
          cache.set(key, { value: val, ts: Date.now() });
          return val;
        } catch {
          if (i < retries) { await backoff(i); continue; }
          // 最终失败：返回最后一次值（通常为 null），不缓存
          return lastVal as T;
        }
      }
      return lastVal as T;
    })().finally(() => {
      inflight.delete(key);
    });

    inflight.set(key, p);
    return p;
  };
}

const ONE_DAY = 24 * 60 * 60 * 1000;
const requestOnceGeo = makeCachedRequester<any | null>(ONE_DAY);
const requestOncePlace = makeCachedRequester<any | null>(ONE_DAY);

// 复用单例 PlaceSearch 实例
let placeSearchInstance: any | null = null;
function ensurePlaceSearch(): Promise<any> {
  if (placeSearchInstance) return Promise.resolve(placeSearchInstance);
  return new Promise((resolve) => {
    window.AMap.plugin('AMap.PlaceSearch', function () {
      // 使用 extensions: 'all' 以获取包含 photos 在内的更丰富字段
      placeSearchInstance = new window.AMap.PlaceSearch({ pageSize: 1, extensions: 'all' });
      resolve(placeSearchInstance);
    });
  });
}

// 注意：PlaceSearch 请求也通过通用缓存 requestOncePlace 去重与缓存
const MapView: React.FC<MapViewProps> = ({ destination, routePlaces }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  const [modal, setModal] = useState<{visible: boolean, place?: RoutePlace & { lnglat?: any }, detail?: any, loading?: boolean}>({visible: false});
  const [mapLoading, setMapLoading] = useState<boolean>(false);

  // 为不同天数提供区分颜色（若无 day，使用默认主题色）
  const dayColors = useMemo(() => {
    const palette = ['#1677ff', '#13c2c2', '#fa1616', '#722ed1', '#eb2f96', '#52c41a'];
    const map = new Map<number, string>();
    let idx = 0;
    (routePlaces || []).forEach(p => {
      if (typeof p.day === 'number' && !map.has(p.day)) {
        map.set(p.day, palette[idx % palette.length]);
        idx += 1;
      }
    });
    return map;
  }, [routePlaces]);

  useEffect(() => {
    if (!window.AMap || !mapRef.current) {
      console.warn('[MapView] AMap SDK 未加载，请在 index.html 中引入 AMap 脚本并配置有效 Key');
      return;
    }
    const map = new window.AMap.Map(mapRef.current, { zoom: 12 });
    setMapLoading(true);
    window.AMap.plugin(['AMap.Geocoder', 'AMap.Driving'], function () {
      const geocoder = new window.AMap.Geocoder();
      // 1. 绘制路线
      if (routePlaces && routePlaces.length > 0) {
        // geocode
        Promise.all(
          routePlaces.map(async (p, idx) => {
            // 错峰请求，降低 QPS 峰值
            await new Promise(r => setTimeout(r, 400 * idx));
            const key = `geo|${(p.name || '').trim()}`;
            const loc = await requestOnceGeo(key, () => new Promise<any | null>((resolve) => {
              geocoder.getLocation(p.name, (status: string, result: any) => {
                let l: any = null;
                if (status === 'complete' && result?.geocodes?.length) {
                  l = result.geocodes[0].location;
                }
                resolve(l);
              });
            }));
            return { ...p, lnglat: loc || undefined };
          })
        ).then((places: any[]) => {
          const overlays: any[] = [];
          const markers: any[] = [];
          // 绘制 Marker（使用首张图片作为图标，若暂无图片则使用默认图钉）
          places.forEach((p, idx) => {
            if (p.lnglat) {
              const marker = new window.AMap.Marker({
                position: p.lnglat,
                map,
                title: p.name,
                anchor: 'bottom-center',
                offset: new window.AMap.Pixel(0, 0),
              });
              overlays.push(marker);
              markers.push(marker);
              marker.on('click', () => {
                setModal({ visible: true, place: p, loading: true });
                const key = `place|${(p.name || '').trim()}`;
                requestOncePlace(key, async () => {
                  const ps = await ensurePlaceSearch();
                  return new Promise<any | null>((resolve) => {
                    ps.search(p.name, (status: string, result: any) => {
                      let detail: any = null;
                      if (status === 'complete' && result?.poiList?.pois?.length) {
                        const poi = result.poiList.pois[0];
                        detail = {
                          name: poi.name,
                          address: poi.address,
                          photos: poi.photos || [],
                          intro: poi.type || '',
                        };
                      }
                      resolve(detail);
                    });
                  });
                }).then((detail: any) => {
                  setModal(m => ({ ...m, detail: detail || null, loading: false }));
                });
              });
            } else {
              markers.push(null);
            }
          });

          // 预取每个点的首张图片，并将其设置为 Marker 图标（带圆角与阴影），串行以降低 QPS 峰值
          (async () => {
            for (let i = 0; i < places.length; i++) {
              const p = places[i];
              const mk = markers[i];
              if (!p?.lnglat || !mk) continue;
              const key = `place|${(p.name || '').trim()}`;
              const detail: any = await requestOncePlace(key, async () => {
                const ps = await ensurePlaceSearch();
                return new Promise<any | null>((resolve) => {
                  ps.search(p.name, (status: string, result: any) => {
                    let det: any = null;
                    if (status === 'complete' && result?.poiList?.pois?.length) {
                      const poi = result.poiList.pois[0];
                      det = { name: poi.name, address: poi.address, photos: poi.photos || [], intro: poi.type || '' };
                    }
                    resolve(det);
                  });
                });
              });
              const url = detail?.photos?.[0]?.url;
              if (url) {
                const borderColor = dayColors.get(Number(p.day)) || '#1677ff';
                const html = `
                  <div style="display:flex;flex-direction:column;align-items:center;">
                    <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid ${borderColor};background:#fff;">
                      <img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block" />
                    </div>
                    <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid ${borderColor};filter: drop-shadow(0 2px 2px rgba(0,0,0,.15))"></div>
                  </div>`;
                mk.setContent(html);
              }
              // 间隔一点点，减少瞬时并发
              await new Promise(r => setTimeout(r, 120));
            }
          })();
          // 使用高德路线规划（Driving）；按 day 分组，每组调用一次，失败则仅保留标记
          const groups: Record<string, any[]> = {};
          console.log(places)
          places.forEach(p => {
            if (!p.lnglat) return;
            console.log(typeof p.day === 'number')
            const key = typeof p.day === 'number' ? String(p.day) : 'default';
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
          });

          const drivingTasks = Object.entries(groups).map(([k, arr]) => {
            const coords = (arr as any[]).filter(x => x.lnglat).map(x => x.lnglat);
            if (coords.length < 2) return Promise.resolve(null);
            const start = coords[0];
            const end = coords[coords.length - 1];
            const waypoints = coords.slice(1, -1);
            const color = dayColors.get(Number(k)) || '#1677ff';
            return new Promise((resolve) => {
              const driving = new window.AMap.Driving({
                hideMarkers: true,
                showTraffic: false,
              });
              const opts = waypoints.length ? { waypoints } : undefined;
              // v2: (start, end, opts, cb)
              driving.search(start, end, opts, (status: string, result: any) => {
                if (status === 'complete' && result?.routes?.length) {
                  try {
                    const steps = result.routes[0].steps || [];
                    const path: any[] = [];
                    steps.forEach((s: any) => {
                      if (s.path && s.path.length) path.push(...s.path);
                    });
                    if (path.length > 1) {
                      const pl = new window.AMap.Polyline({
                        path,
                        strokeColor: color,
                        strokeWeight: 6,
                        lineJoin: 'round',
                        lineCap: 'round',
                        map,
                      });
                      overlays.push(pl);
                    }
                  } catch {}
                }
                resolve(null);
              });
            });
          });

          Promise.all(drivingTasks).finally(() => {
            if (overlays.length) map.setFitView(overlays);
            setMapLoading(false);
          });
        }).catch(() => setMapLoading(false));
      } else if (destination) {
        // 仅目的地
        requestOnceGeo(`geo|${(destination || '').trim()}`, () => new Promise<any | null>((resolve) => {
          geocoder.getLocation(destination, (status: string, result: any) => {
            let l: any = null;
            if (status === 'complete' && result?.geocodes?.length) {
              l = result.geocodes[0].location;
            }
            resolve(l);
          });
        })).then((loc: any) => {
          if (loc) {
            const marker = new window.AMap.Marker({ position: loc, map });
            // 传入数组以确保 setFitView 生效
            map.setFitView([marker]);
            // 兜底设置中心点，避免个别环境未触发布局
            map.setCenter(loc);
          }
          setMapLoading(false);
        });
      }
    });
    return () => map?.destroy();
  }, [destination, JSON.stringify(routePlaces)]);

  return <>
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: 360, margin: '24px 0', borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }} />
      {mapLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin tip="正在加载路线..."/>
        </div>
      )}
    </div>
    <Modal
      open={modal.visible}
      title={<div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>{modal.place?.name}</div>}
      footer={null}
      onCancel={() => setModal({ visible: false })}
      width={700}
      centered
      style={{ maxWidth: '92vw' }}
    >
      {modal.loading ? <Spin /> : modal.detail ? (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Tag color="blue" style={{ marginRight: 8 }}>简介</Tag>
            <span style={{ color: '#555', fontSize: 15 }}>{modal.detail.intro || modal.place?.desc}</span>
          </div>
          <div style={{ marginTop: 4, marginBottom: 12 }}>
            <Tag color="geekblue" style={{ marginRight: 8 }}>地址</Tag>
            <span style={{ color: '#666', fontSize: 14 }}>{modal.detail.address}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            {modal.detail.photos && modal.detail.photos.length > 0 ? (
              <Image.PreviewGroup>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  {modal.detail.photos.map((ph: any, i: number) => (
                    <Image key={i} src={ph.url} width={180} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }} />
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : <div style={{ color: '#888' }}>暂无图片</div>}
          </div>
        </div>
      ) : <div style={{ color: '#888' }}>未获取到详情</div>}
    </Modal>
  </>;
};

export default MapView;
