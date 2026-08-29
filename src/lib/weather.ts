/** Branson West — same pin the kiosk and Daily already use. */

export const BRANSON_LAT = 36.6509;
export const BRANSON_LNG = -93.3691;

export type WeatherNow = {
  temp: number;
  feels: number;
  code: number;
  icon: string;
  label: string;
};

export type WeatherDay = {
  date: string;
  weekday: string;
  high: number;
  low: number;
  rain: number;
  code: number;
  icon: string;
  label: string;
};

export type WeatherPayload = {
  ok: true;
  now: WeatherNow;
  days: WeatherDay[];
};

export function wxIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌦️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}

export function wxLabel(code: number): string {
  if (code === 0) return "Sunny";
  if (code === 1) return "Mostly sunny";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorms";
  return "Branson";
}

export function weekdayShort(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "America/Chicago",
  });
}
