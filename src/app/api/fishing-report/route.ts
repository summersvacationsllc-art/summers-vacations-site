import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const path = join(process.cwd(), "public", "reports", "fishing-data.json");
    const data = await readFile(path, "utf-8");
    return NextResponse.json({ ok: true, ...JSON.parse(data) });
  } catch {
    // Return fallback data if file doesn't exist yet
    return NextResponse.json({
      ok: true,
      date: new Date().toISOString().split("T")[0],
      biteOfDay: "Taneycomo trout biting on pink worms below Fall Creek. Table Rock bass on topwater at dawn.",
      conditions: {
        tableRock: { temp: "78°F", level: "916.9 ft", clarity: "Clear" },
        taneycomo: { temp: "50°F", clarity: "Very clear", generation: "Check SWPA schedule" },
      },
      species: [
        { name: "Bass", rating: "GOOD", depth: "10-25 ft", technique: "Topwater dawn, deep cranks, jigs" },
        { name: "Crappie", rating: "FAIR", depth: "15-25 ft", technique: "Standing timber, minnows or jigs" },
        { name: "Walleye", rating: "GOOD", depth: "Deep points", technique: "Trolling channel swings" },
        { name: "Trout", rating: "GOOD", depth: "Varies", technique: "Pink worms, 40+ fish days" },
        { name: "Bluegill", rating: "PEAK", depth: "10-20 ft", technique: "Live crickets, gravel areas" },
        { name: "Catfish", rating: "GOOD", depth: "River arms", technique: "Cut bait, stink bait" },
      ],
      weather: { high: "96°F", heatIndex: "105°F", dawn: "81°F", wind: "SW 6-9 mph" },
      tip: "Fish early mornings. Topwater at sunrise. Taneycomo no-gen windows until 1-2 PM.",
    });
  }
}
