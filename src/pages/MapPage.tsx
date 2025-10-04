import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { getAirQualityKazakhstan } from "../api"; // импорт из api.ts
import type { AQIData } from "../api";

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

// Кастомная иконка для маркеров
function yellowCircleSvgDataUrl(aqi: number): string {
  let color = "yellow";
  if (aqi >= 0 && aqi <= 50) {
    color = "green"; // зеленый
  } else if (aqi > 50 && aqi <= 100) {
    color = "yellow"; // желтый
  } else if (aqi > 100 && aqi <= 150) {
    color = "orange"; // оранжевый
  } else if (aqi > 150 && aqi <= 200) {
    color = "red"; // красный
  } else if (aqi > 200 && aqi <= 300) {
    color = "purple"; // фиолетовый
  } else if (aqi > 300) {
    color = "maroon"; // бордовый
  }
  const radius = 10; // фиксированный радиус
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${radius * 2}' height='${radius * 2}' viewBox='0 0 ${radius * 2} ${radius * 2}'>` +
    `<circle cx='${radius}' cy='${radius}' r='${radius - 1}' fill='${color}' stroke='orange' stroke-width='1'/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function MapPage() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [points, setPoints] = useState<AQIData[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<AQIData | null>(null);
  const navigate = useNavigate();

  // Загружаем данные из API Казахстана
  useEffect(() => {
    getAirQualityKazakhstan()
      .then((res) => setPoints(res.data))
      .catch((err) => console.error("Ошибка при загрузке AQI:", err));
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    map.setCenter({ lat: 15.0000, lng: 100.0000}); // центр Казахстана
    map.setZoom(5);
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
          styles: darkMapStyle, 
        }}
      >
        {points.map((pt, idx) => (
          <Marker
            key={`${pt.latitude}-${pt.longitude}-${idx}`}
            position={{ lat: pt.latitude, lng: pt.longitude }}
            icon={{ url: yellowCircleSvgDataUrl(pt.aqi) }}
            onMouseOver={() => setHoveredPoint(pt)}
          />
        ))}

        {hoveredPoint && (
            <InfoWindow
            position={{ lat: hoveredPoint.latitude, lng: hoveredPoint.longitude }}
            options={{
              pixelOffset: new google.maps.Size(0, -10),
              disableAutoPan: true,
        
            }}
            
            onCloseClick={() => setHoveredPoint(null)}
            >
            <div
              style={{
              background: "black",
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              minWidth: "160px",
              cursor: "pointer",
              alignContent: "center",
              justifyContent: "center",
              }}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => {
              // Example: navigate to details page for this point
              navigate(`/dashboard/${hoveredPoint.latitude}/${hoveredPoint.longitude}`);
              }}
            >
              <div><b>AQI:</b> {hoveredPoint.aqi}</div>
              <div><b>Status:</b> {hoveredPoint.status}</div>
              {hoveredPoint.pm10 !== null && <div><b>PM10:</b> {hoveredPoint.pm10}</div>}
              {hoveredPoint.pm2_5 !== null && <div><b>PM2.5:</b> {hoveredPoint.pm2_5}</div>}
              {hoveredPoint.co !== null && <div><b>CO:</b> {hoveredPoint.co}</div>}
              {hoveredPoint.no2 !== null && <div><b>NO₂:</b> {hoveredPoint.no2}</div>}
              {hoveredPoint.so2 !== null && <div><b>SO₂:</b> {hoveredPoint.so2}</div>}
            </div>
            </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
