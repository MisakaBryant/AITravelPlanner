import React, { useEffect, useRef } from 'react';

// 高德地图API需在index.html中引入<script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_AMAP_KEY"></script>
// 这里仅做演示，实际项目请将key配置到.env并动态注入

declare global {
  interface Window {
    AMap: any;
  }
}

type ItineraryItem = { day: number; activities: string[] };
const MapView: React.FC<{ destination: string; itinerary?: ItineraryItem[] }> = ({ destination, itinerary }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;
    const map = new window.AMap.Map(mapRef.current, { zoom: 12 });

    // 优先使用 “目的地 + 第一个行程活动” 进行地理编码，失败回退到仅目的地
    const firstActivity = itinerary?.[0]?.activities?.[0];
    const keyword = firstActivity ? `${destination} ${firstActivity}` : destination;

    if (keyword) {
      window.AMap.plugin('AMap.Geocoder', function () {
        const geocoder = new window.AMap.Geocoder({ city: '全国' });
        geocoder.getLocation(keyword, (status: string, result: any) => {
          let target = null;
          if (status === 'complete' && result?.geocodes?.length) {
            target = result.geocodes[0].location;
          }
          // 若“目的地+活动”解析失败，尝试仅目的地
          const fallback = () => {
            if (!firstActivity && target) return; // 已经是目的地
            if (!destination) return;
            geocoder.getLocation(destination, (s2: string, r2: any) => {
              if (s2 === 'complete' && r2?.geocodes?.length) {
                const loc2 = r2.geocodes[0].location;
                map.setZoomAndCenter(12, loc2);
                new window.AMap.Marker({ position: loc2, map });
              }
            });
          };

          if (target) {
            map.setZoomAndCenter(12, target);
            new window.AMap.Marker({ position: target, map });
          } else {
            fallback();
          }
        });
      });
    }
    return () => map?.destroy();
  }, [destination, itinerary]);

  return <div ref={mapRef} style={{ width: '100%', height: 360, margin: '24px 0' }} />;
};

export default MapView;
