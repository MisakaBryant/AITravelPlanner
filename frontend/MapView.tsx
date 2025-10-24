import React, { useEffect, useRef } from 'react';

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

import { Modal, Image, Spin } from 'antd';
import { useState } from 'react';

const MapView: React.FC<MapViewProps> = ({ destination, routePlaces }) => {
  const mapRef = useRef<HTMLDivElement>(null);


  const [modal, setModal] = useState<{visible: boolean, place?: RoutePlace, detail?: any, loading?: boolean}>({visible: false});

  useEffect(() => {
    if (!window.AMap || !mapRef.current) {
      console.warn('[MapView] AMap SDK 未加载，请在 index.html 中引入 AMap 脚本并配置有效 Key');
      return;
    }
    const map = new window.AMap.Map(mapRef.current, { zoom: 12 });
    window.AMap.plugin(['AMap.Geocoder'], function () {
      const geocoder = new window.AMap.Geocoder();
      // 1. 绘制路线
      if (routePlaces && routePlaces.length > 0) {
        // 依次 geocode
        Promise.all(routePlaces.map(p => new Promise((resolve) => {
          geocoder.getLocation(p.name, (status: string, result: any) => {
            if (status === 'complete' && result?.geocodes?.length) {
              resolve({ ...p, lnglat: result.geocodes[0].location });
            } else {
              resolve({ ...p });
            }
          });
        }))).then((places: any[]) => {
          const path = places.filter(p => p.lnglat).map(p => p.lnglat);
          // 绘制 Polyline
          if (path.length > 1) {
            new window.AMap.Polyline({
              path,
              strokeColor: '#1677ff',
              strokeWeight: 5,
              map
            });
          }
          // 绘制 Marker
          places.forEach((p, idx) => {
            if (p.lnglat) {
              const marker = new window.AMap.Marker({
                position: p.lnglat,
                map,
                label: { content: `<div style='color:#1677ff;font-weight:bold'>${idx+1}</div>`, offset: [0, -30] },
                title: p.name
              });
              marker.on('click', () => {
                setModal({ visible: true, place: p, loading: true });
                // 用高德 SDK 获取地点详情和图片
                window.AMap.plugin('AMap.PlaceSearch', function () {
                  const placeSearch = new window.AMap.PlaceSearch({ pageSize: 1 });
                  placeSearch.search(p.name, function(status: string, result: any) {
                    if (status === 'complete' && result?.poiList?.pois?.length) {
                      const poi = result.poiList.pois[0];
                      setModal(m => ({ ...m, detail: {
                        name: poi.name,
                        address: poi.address,
                        photos: poi.photos || [],
                        intro: poi.type || '',
                      }, loading: false }));
                    } else {
                      setModal(m => ({ ...m, detail: null, loading: false }));
                    }
                  });
                });
              });
            }
          });
          if (path.length) map.setFitView();
        });
      } else if (destination) {
        // 仅目的地
        geocoder.getLocation(destination, function(status: string, result: any) {
          if (status === 'complete' && result?.geocodes?.length) {
            const loc = result.geocodes[0].location;
            var marker = new window.AMap.Marker({ position: loc, map });
            map.setFitView(marker);
          }
        });
      }
    });
    return () => map?.destroy();
  }, [destination, JSON.stringify(routePlaces)]);

  return <>
    <div ref={mapRef} style={{ width: '100%', height: 360, margin: '24px 0', borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }} />
    <Modal
      open={modal.visible}
      title={modal.place?.name}
      footer={null}
      onCancel={() => setModal({ visible: false })}
    >
      {modal.loading ? <Spin /> : modal.detail ? (
        <div>
          <div style={{ marginBottom: 8 }}>{modal.detail.intro || modal.place?.desc}</div>
          {modal.detail.photos && modal.detail.photos.length > 0 ? (
            <Image.PreviewGroup>
              {modal.detail.photos.map((ph: any, i: number) => (
                <Image key={i} src={ph.url} width={120} style={{ marginRight: 8, marginBottom: 8, borderRadius: 4 }} />
              ))}
            </Image.PreviewGroup>
          ) : <div style={{ color: '#888' }}>暂无图片</div>}
          <div style={{ color: '#888', marginTop: 8 }}>{modal.detail.address}</div>
        </div>
      ) : <div style={{ color: '#888' }}>未获取到详情</div>}
    </Modal>
  </>;
};

export default MapView;
