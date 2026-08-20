import { useEffect, useState } from "react";
import type { WidgetConfig } from "../../types";
import { actions } from "../../store/appStore";

/**
 * Open-Meteo needs no API key, so nothing secret ends up in the bundle.
 * Coordinates default to Seoul and are editable per widget.
 */
const CODES: Record<number, string> = {
  0: "맑음", 1: "대체로 맑음", 2: "구름 조금", 3: "흐림",
  45: "안개", 48: "안개", 51: "이슬비", 53: "이슬비", 55: "이슬비",
  61: "비", 63: "비", 65: "강한 비", 71: "눈", 73: "눈", 75: "강한 눈",
  80: "소나기", 81: "소나기", 82: "강한 소나기", 95: "뇌우",
};

interface Reading {
  temp: number;
  code: number;
}

export function WeatherWidget({ config }: { config: WidgetConfig }) {
  const lat = typeof config.options.lat === "number" ? config.options.lat : 37.5665;
  const lon = typeof config.options.lon === "number" ? config.options.lon : 126.978;
  const place = typeof config.options.place === "string" ? config.options.place : "Seoul";

  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
      { signal: controller.signal }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad response"))))
      .then((json) => {
        const current = json?.current;
        if (typeof current?.temperature_2m !== "number") throw new Error("no data");
        setReading({ temp: current.temperature_2m, code: Number(current.weather_code) || 0 });
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setError("날씨를 불러오지 못했습니다.");
      });

    return () => controller.abort();
  }, [lat, lon]);

  return (
    <>
      {reading && (
        <>
          <div className="clock-time">{Math.round(reading.temp)}°</div>
          <div className="muted">{place} · {CODES[reading.code] ?? "—"}</div>
        </>
      )}
      {!reading && !error && <div className="empty">불러오는 중</div>}
      {error && <div className="error">{error}</div>}
      <div className="row">
        <input value={place} placeholder="지역 이름" aria-label="지역 이름" onChange={(e) => actions.setWidgetOption(config.id, "place", e.target.value)} />
        <input type="number" step="0.0001" value={lat} aria-label="위도" onChange={(e) => actions.setWidgetOption(config.id, "lat", Number(e.target.value))} style={{ maxWidth: 92 }} />
        <input type="number" step="0.0001" value={lon} aria-label="경도" onChange={(e) => actions.setWidgetOption(config.id, "lon", Number(e.target.value))} style={{ maxWidth: 92 }} />
      </div>
    </>
  );
}
