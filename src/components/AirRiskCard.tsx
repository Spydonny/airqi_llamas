import { type AQIDataHourly } from "../api";

type Props = {
  data: AQIDataHourly;
  className?: string;
};

const THRESHOLDS = {
  pm2_5: 15,
  pm10: 45,
  no2: 25,
  o3: 100,
  so2: 40,
  co: 4,
};

const SYMPTOMS: Record<string, string> = {
  pm2_5:
    "Increased risk of cardio-respiratory diseases, asthma exacerbation, coughing, shortness of breath, higher mortality with long-term exposure",
  pm10:
    "Irritation of the respiratory tract, worsening of chronic lung diseases, increased hospital admissions",
  no2:
    "Respiratory tract irritation, worsening of asthma symptoms, reduced lung function, increased susceptibility to infections",
  o3:
    "Coughing, throat/chest pain, worsening of asthma, and reduced lung function during physical activity",
  so2:
    "Bronchospasm in asthmatics, coughing, irritation of the respiratory tract",
  co:
    "Reduced oxygen delivery (especially in people with heart disease) — dizziness, weakness; in high doses, risk of stroke or heart attack",
};

function getMax(arr?: number[] | null): number | null {
  if (!arr || arr.length === 0) return null;
  const valid = arr.filter((v) => typeof v === "number" && !isNaN(v));
  return valid.length ? Math.max(...valid) : null;
}

function formatVal(key: keyof typeof THRESHOLDS, value: number | null): string {
  if (value === null) return "—";
  if (key === "co") return `${value.toFixed(2)} mg/m³`;
  return `${value.toFixed(1)} µg/m³`;
}

export default function AirRiskCard({ data, className }: Props) {
  const vals = {
    pm2_5: getMax(data.pm2_5),
    pm10: getMax(data.pm10),
    no2: getMax(data.no2),
    o3: getMax(data.o3),
    so2: getMax(data.so2),
    co: getMax(data.co),
  };

  const issues: { key: string; label: string; value: number; threshold: number; symptoms: string }[] = [];

  (Object.keys(vals) as (keyof typeof vals)[]).forEach((k) => {
    const val = vals[k];
    const thr = THRESHOLDS[k];
    if (val !== null && val > thr) {
      issues.push({
        key: k,
        label: keyToLabel(k),
        value: val,
        threshold: thr,
        symptoms: SYMPTOMS[k] || "Возможны респираторные симптомы",
      });
    }
  });

  return (
    <div
      className={className}
      style={{
        borderRadius: 12,
        padding: "1rem 1.25rem",
        width: "min(980px, 100%)",
        margin: "0 auto",
      }}
    >
      <h3 className="text-center text-lg font-semibold mb-2">Air Quality — Quick Risk Check</h3>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Pollutant</th>
            <th style={{ textAlign: "right", padding: 8 }}>Peak value</th>
            <th style={{ textAlign: "right", padding: 8 }}>WHO short-term AQG</th>
            <th style={{ textAlign: "left", padding: 8 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {(["pm2_5", "pm10", "no2", "o3", "so2", "co"] as const).map((k) => {
            const val = vals[k];
            const thr = THRESHOLDS[k];
            const elevated = val !== null && val > thr;
            return (
              <tr key={k} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{keyToLabel(k)}</td>
                <td style={{ padding: 8, textAlign: "right", fontFamily: "monospace" }}>{formatVal(k, val)}</td>
                <td style={{ padding: 8, textAlign: "right", fontFamily: "monospace" }}>
                  {k === "co" ? `${thr} mg/m³` : `${thr} µg/m³`}
                </td>
                <td style={{ padding: 8 }}>
                  {elevated ? (
                    <span style={{ fontWeight: 600, color: "#b91d1dff" }}>Elevated</span>
                  ) : (
                    <span style={{ color: "#09aa5aff" }}>Within WHO short-term AQG</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 16 }}>
        <strong>Detected issues:</strong>
        {issues.length === 0 ? (
          <div style={{ marginTop: 6 }}>No pollutant peaks above WHO short-term AQGs.</div>
        ) : (
          <ul style={{ marginTop: 6 }}>
            {issues.map((it) => (
              <li key={it.key} style={{ marginBottom: 6 }}>
                <code style={{ fontFamily: "monospace" }}>
                  {it.label} &gt; {it.value.toFixed(1)}
                  {it.key === "co" ? " mg/m³" : " µg/m³"}
                </code>{" "}
                | {it.symptoms}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function keyToLabel(k: string) {
  switch (k) {
    case "pm2_5":
      return "PM2.5";
    case "pm10":
      return "PM10";
    case "no2":
      return "NO2";
    case "o3":
      return "O3";
    case "so2":
      return "SO2";
    case "co":
      return "CO";
    default:
      return k.toUpperCase();
  }
}
