/**
 * Single source of truth for Leaflet basemap tiles.
 * Override in Vercel (Production + Preview) only if needed:
 *   NEXT_PUBLIC_MAP_TILE_URL
 *   NEXT_PUBLIC_MAP_TILE_ATTRIBUTION
 *
 * Default: Esri World Street Map (keyless raster, works in browsers/kiosks).
 * CARTO free Voyager was retired behind an API-key watermark (2049-byte
 * "API KEY REQUIRED" PNG) — do not restore cartocdn URLs here.
 * Do not hardcode provider URLs in BransonMap or generator scripts.
 */
export const DEFAULT_MAP_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

export const DEFAULT_MAP_TILE_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom';

export type MapTileConfig = {
  url: string;
  attribution: string;
  maxZoom: number;
};

export function getMapTileConfig(): MapTileConfig {
  const url =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_MAP_TILE_URL?.trim()) ||
    DEFAULT_MAP_TILE_URL;
  const attribution =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION?.trim()) ||
    DEFAULT_MAP_TILE_ATTRIBUTION;
  return {
    url,
    attribution,
    maxZoom: 19,
  };
}
