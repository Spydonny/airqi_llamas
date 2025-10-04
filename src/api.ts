import axios from "axios";

// Базовый инстанс для API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000", // замени на продовый адрес
  headers: {
    "Content-Type": "application/json",
  },
});

// ====== Модели ======

// Для эндпоинта /air-quality (одна точка, списки значений)
export interface AQIDataHourly {
  latitude: number;
  longitude: number;
  aqi: number;
  status: string;
  aqi_hourly?: number[] | null;
  pm10?: number[] | null;
  pm2_5?: number[] | null;
  co?: number[] | null;
  no2?: number[] | null;
  so2?: number[] | null;
  o3?: number[] | null;
}

// Для остальных эндпоинтов (средние/агрегированные значения)
export interface AQIData {
  latitude: number;
  longitude: number;
  aqi: number;
  status: string;
  pm10?: number | null;
  pm2_5?: number | null;
  co?: number | null;
  no2?: number | null;
  so2?: number | null;
}

export interface AQIResponse {
  data: AQIData[];
}

// ====== API методы ======

// По одной точке
export const getAirQualitySingle = async (
  latitude: number,
  longitude: number
): Promise<AQIDataHourly> => {
  const res = await api.get<AQIDataHourly>("/air-quality", {
    params: { latitude, longitude },
  });
  return res.data;
};

// По сетке координат
export const getAirQualityAll = async (
  lat_start = 0,
  lat_end = 180,
  lon_start = 0,
  lon_end = 180,
  step = 0.25
): Promise<AQIResponse> => {
  const res = await api.get<AQIResponse>("/air-quality/all", {
    params: { lat_start, lat_end, lon_start, lon_end, step },
  });
  return res.data;
};

// Только Казахстан
export const getAirQualityKazakhstan = async (
  step = 0.25
): Promise<AQIResponse> => {
  const res = await api.get<AQIResponse>("/air-quality/kazakhstan", {
    params: { step },
  });
  return res.data;
};

export const getHealthImpact = async (
  aqi : number,
  pm10: number,
  pm2_5: number,
  co: number,
  no2: number,
  so2: number,
  o3: number
): Promise<string> => {
  const res = await api.get<string>("/health-impact", {
    params: { aqi, pm10, pm2_5, co, no2, so2, o3 },
  });
  return res.data;
};

export default {
  getAirQualitySingle,
  getAirQualityAll,
  getAirQualityKazakhstan,
  getHealthImpact,
};
