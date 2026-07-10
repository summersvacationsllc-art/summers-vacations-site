import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const path = join(process.cwd(), "public", "reports", "shows-data.json");
    const data = await readFile(path, "utf-8");
    return NextResponse.json({ ok: true, ...JSON.parse(data) });
  } catch {
    return NextResponse.json({
      ok: true,
      shows: [
        { name: "Grand Jubilee", time: "7:30 PM", venue: "Grand Country", type: "Variety", url: "https://www.grandcountrymusichall.com/" },
        { name: "Presleys' Country Jubilee", time: "8 PM", venue: "Presleys' Theatre", type: "Country", url: "https://presleys.com/" },
        { name: "Clay Cooper's Country Express", time: "7:30 PM", venue: "Clay Cooper Theatre", type: "Variety", url: "https://www.claycooper.com/" },
        { name: "The Haygoods", time: "8 PM", venue: "Clay Cooper Theatre", type: "Family", url: "https://www.haygoodshow.com/" },
        { name: "Dolly Parton's Stampede", time: "5:30 & 8 PM", venue: "Stampede Arena", type: "Dinner", url: "https://www.dollypartonsstampede.com/branson/" },
        { name: "Sight & Sound - DAVID", time: "3:30 & 7:30 PM", venue: "Sight & Sound", type: "Production", url: "https://www.sight-sound.com/" },
        { name: "Legends in Concert", time: "3 & 8 PM", venue: "Legends Theater", type: "Tribute", url: "https://www.legendsinconcert.com/branson/" },
        { name: "Bohemian Queen", time: "8 PM", venue: "Clay Cooper Theatre", type: "Tribute", url: "https://www.claycooper.com/" },
        { name: "Dean Z - Elvis", time: "2 PM", venue: "Clay Cooper", type: "Tribute", url: "https://www.claycooper.com/dean-z" },
        { name: "Showboat Branson Belle", time: "Cruise", venue: "Table Rock Lake", type: "Dinner", url: "https://showboatbransonbelle.com/" },
        { name: "Pierce Arrow", time: "8 PM", venue: "Reza Live Theatre", type: "Country", url: "https://piercearrow.com/" },
        { name: "Hughes Music Show", time: "8 PM", venue: "Hughes Brothers", type: "Family", url: "https://www.hughesbrotherstheatre.com/" },
      ],
      freeEvents: ["FREE Summer Concerts at Branson Landing"],
    });
  }
}
