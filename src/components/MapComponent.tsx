'use client';

import { useEffect, useRef } from 'react';

interface MapProps {
  stations: any[];
  center?: { lat: number; lng: number };
  selectedId?: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export function MapComponent({ stations, center = { lat: 37.566826, lng: 126.9786567 }, selectedId }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const options = {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: 7,
        };

        kakaoMap.current = new window.kakao.maps.Map(mapRef.current, options);
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!kakaoMap.current || !stations || !Array.isArray(stations)) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    stations.forEach((station) => {
      const isSelected = selectedId === `${station.statId}-${station.chgerId}`;
      const markerPosition = new window.kakao.maps.LatLng(station.lat, station.lng);

      const markerOptions: any = {
        position: markerPosition,
      };

      if (isSelected) {
        // Red marker image
        const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'; // Using star as a highlight
        const imageSize = new window.kakao.maps.Size(24, 35);
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);
        markerOptions.image = markerImage;
        markerOptions.zIndex = 3;
      }

      const marker = new window.kakao.maps.Marker(markerOptions);
      marker.setMap(kakaoMap.current);
      markersRef.current.push(marker);

      const getStatText = (stat: string) => {
        switch (stat) {
          case '1': return '<span class="text-red-500">통신이상</span>';
          case '2': return '<span class="text-green-500 font-bold">충전대기(가능)</span>';
          case '3': return '<span class="text-blue-500">충전중</span>';
          case '4': return '<span class="text-gray-500">운영중지</span>';
          case '5': return '<span class="text-orange-500">점검중</span>';
          default: return '<span class="text-gray-400">상태미확인</span>';
        }
      };

      const chargerStatus = station.chargers && station.chargers.length > 0
        ? getStatText(station.chargers[0].stat)
        : '<span class="text-gray-400">속보없음</span>';

      const iwContent = `
        <div style="padding:15px; min-width:250px; font-family: sans-serif; border-radius: 8px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="font-size:16px; font-weight:bold; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px; color:#111;">
            ${station.statNm}
          </div>
          <div style="font-size:13px; color:#444; margin-bottom:10px; line-height:1.4;">
            <p style="margin:2px 0;"><strong>📍 주소:</strong> ${station.addr}</p>
            <p style="margin:2px 0;"><strong>⚡ 상태:</strong> ${chargerStatus}</p>
            <p style="margin:2px 0;"><strong>⏰ 이용시간:</strong> ${station.useTime || '정보없음'}</p>
            <p style="margin:2px 0;"><strong>🅿️ 주차료:</strong> ${station.parkingFree === 'Y' ? '<span style="color:green; font-weight:bold;">무료</span>' : '<span style="color:#d97706;">유료</span>'}</p>
            ${station.note && station.note !== 'null' ? `<p style="margin:5px 0 0 0; padding-top:5px; border-top:1px dashed #eee; font-style:italic; color:#666;">📝 ${station.note}</p>` : ''}
          </div>
        </div>
      `;
      const infowindow = new window.kakao.maps.InfoWindow({
        content: iwContent,
        removable: true,
        zIndex: 10
      });

      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        infowindow.open(kakaoMap.current, marker);
      });

      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        infowindow.close();
      });
    });
  }, [stations, selectedId]);

  useEffect(() => {
    if (kakaoMap.current && center) {
      const moveLatLon = new window.kakao.maps.LatLng(center.lat, center.lng);
      kakaoMap.current.panTo(moveLatLon);
    }
  }, [center]);

  return (
    <div ref={mapRef} className="w-full h-full rounded-xl border shadow-inner" />
  );
}
