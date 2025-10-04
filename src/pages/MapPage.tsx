import { useMemo, useState, useCallback } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";

type Point = {
  id: string;
  lat: number;
  lng: number;
};

function generateRandomPoints(count: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const lat = (Math.random() - 0.5) * 180; // -90 .. +90
    const lng = (Math.random() - 0.5) * 360; // -180 .. +180
    points.push({
      id: `pt-${i}-${Math.floor(Math.random() * 1e6)}`,
      lat,
      lng,
    });
  }
  return points;
}

function yellowCircleSvgDataUrl(radius = 10) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${radius * 2}' height='${radius * 2}' viewBox='0 0 ${radius * 2} ${radius * 2}'>` +
    `<circle cx='${radius}' cy='${radius}' r='${radius - 1}' fill='yellow' stroke='orange' stroke-width='1'/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function MapPage() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);

  const randomPoints = useMemo(() => generateRandomPoints(20), []);

  const onLoad = useCallback((map: google.maps.Map) => {
    // ставим центр только один раз
    map.setCenter({ lat: 51.1605, lng: 71.4704 });
    map.setZoom(2);
  }, []);

  if (loadError) return <div>Ошибка загрузки карты: {String(loadError)}</div>;
  if (!isLoaded) return <div>Загружаю карту...</div>;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        onLoad={onLoad}
        options={{
          disableDefaultUI: false,
        }}
      >
        {randomPoints.map((pt) => (
          <Marker
            key={pt.id}
            position={{ lat: pt.lat, lng: pt.lng }}
            icon={{ url: yellowCircleSvgDataUrl(8) }}
            onMouseOver={() => setHoveredPoint(pt)}
          />
        ))}

        {hoveredPoint && (
          <InfoWindow
            position={{ lat: hoveredPoint.lat, lng: hoveredPoint.lng }}
            options={{
              pixelOffset: new google.maps.Size(0, -10),
              disableAutoPan: true,
            }}
            onCloseClick={() => setHoveredPoint(null)}
          >
            <div
              style={{
                background: "white",
                padding: "8px 12px",
                borderRadius: "8px",
                minWidth: "100px",
                textAlign: "center",
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              Точка {hoveredPoint.id}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
