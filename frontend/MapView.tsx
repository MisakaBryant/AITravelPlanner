import React, { useEffect, useRef } from 'react';

// 高德地图API需在index.html中引入<script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_AMAP_KEY"></script>
// 这里仅做演示，实际项目请将key配置到.env并动态注入

declare global {
  interface Window {
    AMap: any;
  }
}

const MapView: React.FC<{ destination: string }> = ({ destination }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;
    const map = new window.AMap.Map(mapRef.current, {
      zoom: 12,
      center: [116.397428, 39.90923] // 默认北京
    });
    // 地点搜索
    if (destination) {
      window.AMap.plugin('AMap.PlaceSearch', function () {
        const placeSearch = new window.AMap.PlaceSearch({
          map,
          city: '全国'
        });
        placeSearch.search(destination);
      });
    }
    return () => map?.destroy();
  }, [destination]);

  return <div ref={mapRef} style={{ width: '100%', height: 360, margin: '24px 0' }} />;
};

export default MapView;
