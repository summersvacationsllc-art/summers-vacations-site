import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Branson Fall Guide 2026 | Summers Vacations",
  description:
    "Pumpkins, corn mazes, farmers markets, fall festivals and the best leaf-peeping drives around Branson, MO — October & November 2026.",
  openGraph: {
    title: "Branson Fall Guide 2026 | Summers Vacations",
    description: "Pumpkins, corn mazes, festivals and fall color around Branson, MO.",
    images: ["/property-photos/penthouse/aaa-fall-porch.jpg"],
    type: "article",
  },
};

const IMG = "/guides/fall-2026";

type Spot = {
  kicker: string;
  title: string;
  when: string;
  img: string;
  alt: string;
  credit?: string;
  text: string;
  link: { href: string; label: string };
};

const SPOTS: Spot[] = [
  {
    kicker: "The big one",
    title: "Harvest Festival at Silver Dollar City",
    when: "Through Sat, Oct 31 · park open select days",
    img: `${IMG}/silver-dollar-city.jpg`,
    alt: "Silver Dollar City streets",
    credit: "Photo: Jeremy Thompson, CC BY 2.0, via Wikimedia Commons",
    text: "20,000+ pumpkins, visiting craftsmen by day and Pumpkins In The City glowing after dark — night rides and pumpkin dance parties in The Plaza. Grab a Tasting Ticket for the fall menu.",
    link: { href: "https://www.silverdollarcity.com/theme-park/festivals/harvest-festival/", label: "Harvest Festival + calendar" },
  },
  {
    kicker: "Pumpkins + hayrides",
    title: "Shepherd’s PumpkinFest",
    when: "Through Oct 31 · Fri–Sun + select weekdays",
    img: `${IMG}/pumpkins.jpg`,
    alt: "Pumpkins in a patch",
    credit: "Illustrative photo: Ruff tuff cream puff, CC0, via Wikimedia Commons",
    text: "30+ activities at Shepherd of the Hills: hayride, barn maze, pumpkin painting, scarecrow building and Inspiration Tower. Pumpkins Aglow night walk starts at dusk; Sleepy Hollow spooky hayride runs evenings through Oct 24.",
    link: { href: "https://theshepherdofthehills.com/shepherds-pumpkinfest/", label: "PumpkinFest tickets" },
  },
  {
    kicker: "Corn maze",
    title: "Fall Roundup at Sycamore Creek",
    when: "Sat & Sun through Nov 1 · 2:30–8:30 PM",
    img: `${IMG}/corn-maze.jpg`,
    alt: "Path through a corn maze",
    credit: "Illustrative photo: Hugho226, CC0, via Wikimedia Commons",
    text: "A 6-acre corn maze, hayrides, barnyard animals, fire pits, s’mores, cider slushies and pumpkins to take home. Live music on Saturdays.",
    link: { href: "https://www.sycamorecreekfamilyranch.com/community-events/fall-roundup", label: "Fall Roundup info" },
  },
  {
    kicker: "Farm day",
    title: "McKenna Family Farm",
    when: "Wed–Thu 10–6 · Fri–Sat 10–7 · Sun 11–7",
    img: `${IMG}/pumpkins.jpg`,
    alt: "Pumpkins",
    text: "Local family farm on Hwy F with fresh produce at the barn. Fall activities have included a corn maze and hayrides — call (417) 593-9890 to confirm what’s running this season.",
    link: { href: "https://www.mckennafamilyfarm.com/", label: "McKenna Family Farm" },
  },
  {
    kicker: "Tuesdays",
    title: "Branson Farmers Market",
    when: "Tuesdays 2:30–6:30 PM · last market Oct 27",
    img: `${IMG}/branson-landing.jpg`,
    alt: "Branson Landing on Lake Taneycomo",
    credit: "Photo: Cal Wolfe, CC BY-SA 3.0, via Wikimedia Commons",
    text: "Local produce and handmade goods in Branson Landing’s south lot by Bass Pro. Two left: Oct 20 and Oct 27. Pick up dinner fixings for the condo kitchen.",
    link: { href: "https://bransonlanding.com/events/branson-landing-branson-farmers-market-at-branson-landing", label: "Market details" },
  },
  {
    kicker: "Leaf peeping",
    title: "Highway 165 & Table Rock Dam overlooks",
    when: "Color usually peaks mid-Oct to early Nov",
    img: `${IMG}/table-rock-dam-oct.jpg`,
    alt: "Aerial view of Table Rock Dam and lake in October",
    credit: "Photo: KTrimble, CC BY-SA 3.0, via Wikimedia Commons",
    text: "Take Hwy 165 south toward the dam, stop at the Hwy 165 Scenic Overlook, then the Table Rock Dam Overlook. Add the easy Table Rock Lakeshore Trail by Dewey Short Visitor Center. Track color on MDC’s fall color page.",
    link: { href: "https://mdc.mo.gov/trees-plants/fall-color", label: "MDC fall color report" },
  },
  {
    kicker: "Misty mornings",
    title: "Ruth & Paul Henning Conservation Area",
    when: "Gates 8 AM–5:30 PM (Oct 15–Mar 15)",
    img: `${IMG}/taneycomo-fog.jpg`,
    alt: "Fog over Lake Taneycomo",
    credit: "Photo: Luke Wisley, CC BY 2.0, via Wikimedia Commons",
    text: "1,500+ acres of trails off Hwy 76 with a scenic lookout over the Ozark hills — one of the best spots for fall color near the strip.",
    link: { href: "https://mdc.mo.gov/discover-nature/places/ruth-paul-henning-conservation-area", label: "Henning Conservation Area" },
  },
];

const HALLOWEEN = [
  { when: "Fri, Oct 30 · 6–8 PM", what: "Halloween BOOnanza — free trick-or-treat trail, games and costume contest at the Branson RecPlex ballfields", href: "https://www.bransonmo.gov/734/Halloween-BOOnanza" },
  { when: "Sat, Oct 31", what: "Safe Street Trick-or-Treating on The Promenade at Branson Landing (20th year) — check times before you go", href: "https://bransonlanding.com/" },
  { when: "Fri & Sat nights through Oct 31", what: "Haunted Copperhead Mountain Coaster nights at Shepherd of the Hills", href: "https://theshepherdofthehills.com/shepherds-pumpkinfest/" },
  { when: "Starts Sat, Nov 7", what: "An Old Time Christmas begins at Silver Dollar City (through Jan 2)", href: "https://www.silverdollarcity.com/theme-park/festivals/an-old-time-christmas/" },
];

const STAYS = [
  { name: "The Penthouse", slug: "the-penthouse", sleeps: "Sleeps 6", img: "/property-photos/penthouse/aaa-fall-porch.jpg", line: "Top-floor deck with mountain views, dressed for fall." },
  { name: "Rustic Ozark Retreat", slug: "rustic-ozark-retreat", sleeps: "Sleeps 6", img: "/property-photos/rustic-ozark-retreat/aaa-fall-porch.jpg", line: "Porch coffee, fireplace evenings." },
  { name: "Woodland Retreat", slug: "woodland-retreat", sleeps: "Sleeps 6", img: "/property-photos/woodland-retreat/aaa-fall-living.jpg", line: "Bunk room for the kids, open living for everyone." },
  { name: "Double Condo", slug: "double-condo", sleeps: "Sleeps 12", img: "/property-photos/double-condo/aaa-doublecondo.jpg", line: "Two units, two kitchens — big-family fall trips." },
  { name: "Branson Family Haven", slug: "branson-family-haven", sleeps: "Sleeps 16", img: "/property-photos/branson-family-haven/aaa-house.jpg", line: "Whole house at Indian Point with yard and fire pit." },
];

const CSS = `
.fg{--ink:#0c4a6e;--sky:#0ea5e9;--soft:#f0f9ff;--line:#bae6fd;--amber:#d97706;background:radial-gradient(1200px 420px at 10% -10%,#fde68a55 0%,transparent 55%),var(--soft);color:var(--ink);min-height:100vh;font-family:"DM Sans",system-ui,sans-serif;line-height:1.55}
.fg .wrap{max-width:980px;margin:0 auto;padding:20px 16px 56px}
.fg .mast{position:relative;overflow:hidden;border-radius:28px;color:#fff;min-height:340px;display:flex;align-items:flex-end;background:#7c2d12 center/cover;box-shadow:0 24px 50px -24px rgba(124,45,18,.6)}
.fg .mast .in{position:relative;padding:28px;background:linear-gradient(0deg,rgba(67,20,7,.85),rgba(67,20,7,0));width:100%}
.fg .kicker{display:inline-block;font-size:.72rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:.3rem .75rem}
.fg h1{font-family:"DM Serif Display",Georgia,serif;font-weight:400;font-size:clamp(2.2rem,8vw,3.6rem);line-height:.95;margin:.6rem 0 .4rem}
.fg h1 em{color:#fcd34d}
.fg h2{font-family:"DM Serif Display",Georgia,serif;font-weight:400;font-size:1.9rem;margin:2.2rem 0 .8rem}
.fg .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.fg .card{background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 10px 24px -18px rgba(2,132,199,.5);display:flex;flex-direction:column}
.fg .card img{width:100%;height:210px;object-fit:cover;display:block}
.fg .card .b{padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px;flex:1}
.fg .tag{font-size:.7rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--amber)}
.fg .card h3{margin:0;font-size:1.15rem}
.fg .when{font-weight:700;font-size:.88rem;color:#9a3412}
.fg .card p{margin:0;font-size:.95rem}
.fg .credit{font-size:.68rem;color:#64748b}
.fg a.go{margin-top:auto;font-weight:800;color:#0369a1;text-decoration:none}
.fg .list{background:#fff;border:1px solid var(--line);border-radius:20px;padding:6px 16px}
.fg .list div{padding:10px 0;border-bottom:1px solid #e0f2fe}.fg .list div:last-child{border:0}
.fg .list b{display:block;color:#9a3412}
.fg .strip{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}
.fg .strip img{width:100%;height:150px;object-fit:cover;border-radius:14px}
.fg .note{font-size:.8rem;color:#475569;margin-top:2rem}
`;

export default function FallGuidePage() {
  return (
    <main className="fg">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <p style={{ margin: "0 0 12px" }}>
          <Link href="/" style={{ fontWeight: 800, color: "#0369a1", textDecoration: "none" }}>← Summers Vacations</Link>
        </p>
        <header className="mast" style={{ backgroundImage: "url(/property-photos/penthouse/aaa-fall-deck.jpg)" }}>
          <div className="in">
            <span className="kicker">Branson Fall Guide · 2026</span>
            <h1>Pumpkins, mazes &amp; <em>Ozark color</em></h1>
            <p style={{ margin: 0, maxWidth: 560 }}>The best fall things to do around Branson this October and November — with dates checked and links to every spot.</p>
          </div>
        </header>

        <div className="strip">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/property-photos/rustic-ozark-retreat/aaa-fall-deck.jpg" alt="Covered deck with fall garland" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/property-photos/penthouse/aaa-fall-coffee.jpg" alt="Coffee nook with fall garland" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/property-photos/woodland-retreat/aaa-fall-kitchen.jpg" alt="Kitchen dressed for fall" loading="lazy" />
        </div>

        <h2>Where to go this fall</h2>
        <div className="grid">
          {SPOTS.map((s) => (
            <article className="card" key={s.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img} alt={s.alt} loading="lazy" />
              <div className="b">
                <span className="tag">{s.kicker}</span>
                <h3>{s.title}</h3>
                <span className="when">{s.when}</span>
                <p>{s.text}</p>
                {s.credit && <span className="credit">{s.credit}</span>}
                <a className="go" href={s.link.href} target="_blank" rel="noopener">{s.link.label} →</a>
              </div>
            </article>
          ))}
        </div>

        <h2>Halloween weekend &amp; what’s next</h2>
        <div className="list">
          {HALLOWEEN.map((h) => (
            <div key={h.what}>
              <b>{h.when}</b>
              <a href={h.href} target="_blank" rel="noopener" style={{ color: "#0c4a6e" }}>{h.what}</a>
            </div>
          ))}
        </div>

        <h2>Come home to a cozy place</h2>
        <p style={{ marginTop: -6 }}>Our homes are dressed for fall and minutes from Silver Dollar City, Table Rock Lake and the shows.</p>
        <div className="grid">
          {STAYS.map((p) => (
            <Link className="card" key={p.slug} href={`/property/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt={p.name} loading="lazy" />
              <div className="b">
                <span className="tag">{p.sleeps}</span>
                <h3>{p.name}</h3>
                <p>{p.line}</p>
                <span className="go">See the home →</span>
              </div>
            </Link>
          ))}
        </div>

        <p className="note">
          Dates and hours were checked against each venue’s official site on Oct 13, 2026 and can change — confirm before you go.
          Pumpkin and corn-maze photos are illustrative. Wikimedia Commons photos are used under the licenses noted (CC BY 2.0 / CC BY-SA 3.0 / CC0).
          Home photos © Summers Vacations LLC.
        </p>
      </div>
    </main>
  );
}
