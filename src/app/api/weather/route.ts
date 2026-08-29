import { NextResponse } from "next/server";
import {
  BRANSON_LAT,
  BRANSON_LNG,
  weekdayShort,
  wxIcon,
  wxLabel,
  type WeatherDay,
  type WeatherNow,
} from "@/lib/weather";

const OPEN_METEO =
  `https://api.open-meteo.com/v1/forecast?latitude=${BRANSON_LAT}&longitude=${BRANSON_LNG}` +
  `&current=temperature_2m,apparent_temperature,weather_code` +
  `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
  `&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=7`;

export async function GET() {
  try {
    const res = await fetch(OPEN_METEO, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        apparent_temperature?: number;
        weather_code?: number;
      };
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
    };

    const cur = data.current || {};
    const code = Number(cur.weather_code ?? 0);
    const now: WeatherNow = {
      temp: Math.round(Number(cur.temperature_2m ?? 0)),
      feels: Math.round(Number(cur.apparent_temperature ?? cur.temperature_2m ?? 0)),
      code,
      icon: wxIcon(code),
      label: wxLabel(code),
    };

    const daily = data.daily || {};
    const times = daily.time || [];
    const days: WeatherDay[] = times.map((date, i) => {
      const dCode = Number(daily.weather_code?.[i] ?? 0);
      return {
        date,
        weekday: weekdayShort(date),
        high: Math.round(Number(daily.temperature_2m_max?.[i] ?? 0)),
        low: Math.round(Number(daily.temperature_2m_min?.[i] ?? 0)),
        rain: Math.round(Number(daily.precipitation_probability_max?.[i] ?? 0)),
        code: dCode,
        icon: wxIcon(dCode),
        label: wxLabel(dCode),
      };
    });

    if (!days.length) throw new Error("no daily forecast");

    return NextResponse.json(
      { ok: true, now, days },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Weather unavailable" },
      { status: 502 }
    );
  }
}
