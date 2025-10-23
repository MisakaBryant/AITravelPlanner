import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    AMap: any;
  }
}

type ItineraryItem = { day: number; activities: string[] };

interface MapViewProps {
  destination: string;
  itinerary?: ItineraryItem[];
}

const MapView: React.FC<MapViewProps> = ({ destination, itinerary }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[MapView] : ', window.AMap);
    if (!window.AMap || !mapRef.current) {
      console.warn('[MapView] AMap SDK 未加载，请在 index.html 中引入 AMap 脚本并配置有效 Key');
      return;
    }
    const map = new window.AMap.Map(mapRef.current, {
      zoom: 12
    });

    window.AMap.plugin('AMap.Geocoder', function () {
      const geocoder = new window.AMap.Geocoder();
      if (!destination) return;
      geocoder.getLocation(destination, function(status: string, result: any) {
        console.log('[MapView] 目的地解析结果：', status, result);
        if (status === 'complete' && result?.geocodes?.length) {
          const loc = result.geocodes[0].location;
          var marker = new window.AMap.Marker({ position: loc, map });
          map.setFitView(marker);
        } else {
          console.warn('[MapView] 无法解析目的地位置：', destination);
        }
      });
    });

    return () => map?.destroy();
  }, [destination]);

  return <div ref={mapRef} style={{ width: '100%', height: 360, margin: '24px 0' }} />;
};

export default MapView;
