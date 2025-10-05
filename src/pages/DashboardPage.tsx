import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  getAirQualitySingle,
  getHealthImpact,
  type AQIDataHourly,
} from "../api";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { motion } from "framer-motion";
import AirRiskCard from "../components/AirRiskCard";

// Регистрация компонентов Chart.js
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  zoomPlugin
);

const DashboardPage = () => {
  const { lat, lon } = useParams<{ lat: string; lon: string }>();
  const latNum = lat ? parseFloat(lat) : 0;
  const lonNum = lon ? parseFloat(lon) : 0;

  const [dataHourly, setDataHourly] = useState<AQIDataHourly | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [healthImpact, setHealthImpact] = useState<number | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  useEffect(() => {
    const fetchImpact = async () => {
      if (!dataHourly) return;
      setLoadingImpact(true);
      try {
        const res = await getHealthImpact(
          dataHourly.aqi_hourly?.at(-1) || 0,
          dataHourly.pm10?.at(-1) || 0,
          dataHourly.pm2_5?.at(-1) || 0,
          dataHourly.co?.at(-1) || 0,
          dataHourly.no2?.at(-1) || 0,
          dataHourly.so2?.at(-1) || 0,
          dataHourly.o3?.at(-1) || 0
        );
        // API возвращает { prediction: number }
        const value = typeof res === "object" ? (res as any).prediction : Number(res);
        setHealthImpact(value);
      } catch {
        setHealthImpact(null);
      } finally {
        setLoadingImpact(false);
      }
    };

    fetchImpact();
  }, [dataHourly]);

  // 🌈 Маппинг индекса на описание, цвет и фразу
  const impactLevels = [
    { label: "Good", color: "bg-green-100 text-green-800", desc: "Air quality is satisfactory and poses little or no risk." },
    { label: "Moderate", color: "bg-yellow-100 text-yellow-800", desc: "Air quality is acceptable; some pollutants may be a concern for a few sensitive people." },
    { label: "Unhealthy for Sensitive Groups", color: "bg-orange-100 text-orange-800", desc: "Sensitive groups may experience health effects; general public is unlikely to be affected." },
    { label: "Unhealthy", color: "bg-red-100 text-red-800", desc: "Everyone may begin to experience adverse health effects." },
    { label: "Very Unhealthy", color: "bg-purple-100 text-purple-800", desc: "Health alert: everyone may experience more serious effects." },
    { label: "Hazardous", color: "bg-rose-200 text-rose-900", desc: "Emergency conditions: serious health effects for entire population." },
  ];

  const level = healthImpact !== null ? impactLevels[Math.min(impactLevels.length - 1, healthImpact)] : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAirQualitySingle(latNum, lonNum);
        setDataHourly(data);
      } catch (err) {
        setError("Failed to fetch hourly data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [latNum, lonNum]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!dataHourly) return null;

  // Создаём временные метки, которые заканчиваются "сейчас"
  const now = new Date();
  const dataLength = dataHourly.pm10 ? dataHourly.pm10.length : 0;

  const labels = Array.from({ length: dataLength }, (_, i) => {
  const d = new Date(now.getTime() - (dataLength - 1 - i) * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
});

  // Универсальная функция для построения графика
  const makeChart = (label: string, datasets: any[]) => ({
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" as const },
        title: { display: true, text: label },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x"  as const,
          },
          pan: { enabled: true, mode: "x" as const},
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
      },
    },
  });


  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      {/* Левая колонна */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1rem", backgroundColor: "#f9f9f90b", borderRadius: "16px" }}>
        {/* Hourly AQI */}
        <Line
          {...makeChart("Hourly AQI", [
            {
              label: "AQI",
              data: dataHourly.aqi_hourly || [],
              borderColor: "rgba(255, 206, 86, 1)",
              fill: false,
            },
          ])}
        />

        {/* PM2.5 */}
        <Line
          {...makeChart("PM2.5 Levels", [
            {
              label: "PM2.5",
              data: dataHourly.pm2_5 || [],
              borderColor: "rgba(153, 102, 255, 1)",
              fill: false,
            },
          ])}
        />

        {/* PM10 */}
        <Line
          {...makeChart("PM10 Levels", [
            {
              label: "PM10",
              data: dataHourly.pm10 || [],
              borderColor: "rgba(75, 192, 192, 1)",
              fill: false,
            },
          ])}
        />

        {/* Остальные газы */}
        <Line
          {...makeChart("Other Gases (CO, NO₂, SO₂)", [
            {
              label: "CO",
              data: dataHourly.co || [],
              borderColor: "rgba(255, 159, 64, 1)",
              fill: false,
            },
            {
              label: "NO₂",
              data: dataHourly.no2 || [],
              borderColor: "rgba(255, 99, 132, 1)",
              fill: false,
            },
            {
              label: "SO₂",
              data: dataHourly.so2 || [],
              borderColor: "rgba(54, 162, 235, 1)",
              fill: false,
            },
            {
              label: "O₃",
              data: dataHourly.o3 || [],
              borderColor: "rgba(100, 149, 237, 1)",
              fill: false,
            },
          ])}
        />
      </div>
      
      {/* Правая колонна */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1rem" }} >
        <div
          style={{
            backgroundColor: "#eaeaea28",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          {loadingImpact ? (
            <p>Calculating health impact...</p>
          ) : level ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm"
            >
              <Card
                className={`shadow-xl border-none rounded-2xl p-6 bg-gradient-to-b from-gray-800 to-gray-900 text-white ${level.color}`}
              >
                <CardHeader className="flex items-center justify-center mb-2">
                  <CardTitle className="text-lg font-medium tracking-wide text-gray-300">
                    <h3>Health Impact</h3>
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-center space-y-3">
                  <h1 className="text-sm mt-3 text-gray-400 font-mono">
                    <span className="font-bold text-white 4xl">{healthImpact}</span><br/>
                    <span className="font-bold text-white xl">{level.label}</span>
                  </h1>
                  <p className="text-base text-gray-200 leading-snug max-w-xs mx-auto italic">
                    {level.desc}
                  </p>
                </CardContent>
              </Card>


            </motion.div>
          ) : (
            <p>Health impact data unavailable</p>
          )}
        </div>

        <div
          style={{
            backgroundColor: "#eaeaea34",
            borderRadius: "8px",
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          >
            <AirRiskCard data={dataHourly} className="" />
          </div>
      </div>
    </div>
  );
};

export default DashboardPage;
