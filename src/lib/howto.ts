import { getAllGuidebookSlugs, getGuidebook } from "@/data/guidebooks";

export type HowToVideo = { title: string; url: string; id: string };
export type HowToUnit = { slug: string; name: string; shortName: string; count: number };

const HAVEN_SKIP = new Set(["laundry room", "playground", "private lake trail"]);

export function youtubeId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace(/^\//, "").split("/")[0] || "";
    const v = u.searchParams.get("v");
    if (v) return v;
    const m = u.pathname.match(/\/(?:embed|shorts|v)\/([^/?]+)/);
    return m?.[1] || "";
  } catch {
    return "";
  }
}

export function videosForUnit(slug: string): HowToVideo[] {
  const gb = getGuidebook(slug);
  if (!gb) return [];
  const seen = new Set<string>();
  const out: HowToVideo[] = [];
  const add = (title: string, url?: string) => {
    if (!url) return;
    const id = youtubeId(url);
    if (!id || seen.has(id)) return;
    if (slug === "branson-family-haven" && HAVEN_SKIP.has(title.trim().toLowerCase())) return;
    seen.add(id);
    out.push({ title, url: `https://www.youtube.com/watch?v=${id}`, id });
  };

  for (const v of gb.videos || []) add(v.title, v.url);
  const a = gb.appliances;
  add(a.coffeeMaker.type || "Coffee maker", a.coffeeMaker.youtube);
  add(a.hvac.type || "Thermostat", a.hvac.youtube);
  add("Washer / laundry", a.washer.youtube);
  add(a.fireplace?.type || "Fireplace", a.fireplace?.youtube);
  add("Water filter", a.waterFilter?.youtube);
  add("Aroma 360", a.aroma360?.youtube);
  add("Electric candles", a.candles?.youtube);
  return out;
}

export function howtoUnits(): HowToUnit[] {
  return getAllGuidebookSlugs().map((slug) => {
    const gb = getGuidebook(slug);
    return {
      slug,
      name: gb?.name || slug,
      shortName: gb?.shortName || slug,
      count: videosForUnit(slug).length,
    };
  });
}
