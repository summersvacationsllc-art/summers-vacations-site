"use client";

import { useState, useEffect, useRef } from "react";
import { getGuidebook, SEASONS, type PropertyGuidebook, type SeasonalTheme } from "@/data/guidebooks";

const season = (): SeasonalTheme => {
  const now = new Date();
  const md = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  return SEASONS.find(s => s.endDate >= md && s.startDate <= md) || SEASONS[0];
};

const T = season();
const S = (light = '', dark = '') => ({ backgroundColor: T.primaryColor, backgroundImage: T.gradient, ...(light ? { color: light } : {}), ...(dark ? { color: dark } : {}) });

export default function GuidebookPage({ params, searchParams: spPromise }: {
  params: Promise<{ property: string }>;
  searchParams: Promise<{ code?: string; name?: string }>;
}) {
  const [prop, setProp] = useState<PropertyGuidebook | null>(null);
  const [tab, setTab] = useState('home');
  const [mode, setMode] = useState<'guest'|'branson'>('guest');
  const [guestCode, setGuestCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await params;
      const sp = await spPromise;
      const gb = getGuidebook(p.property.replace(/-/g, '-'));
      if (!gb) return;
      setProp(gb);
      if (sp.code) setGuestCode(sp.code);
      if (sp.name) setGuestName(sp.name);
    })();
  }, [params, spPromise]);

  if (!prop) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><p className="text-stone-400">Loading...</p></div>;

  const T = season();
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const styles = {
    bar: { background: T.gradient },
    tabActive: { color: T.accentColor },
    tabBar: { background: '#2c1810' },
  };

  const tabBtn = (id: string, svg: string, label: string) => (
    <button key={id} onClick={() => { setTab(id); contentRef.current?.scrollTo(0,0); }}
      className={`flex-shrink-0 w-16 flex flex-col items-center justify-center gap-1 border-none font-inherit cursor-pointer transition-colors`}
      style={{ color: tab === id ? T.accentColor : '#8b7355', fontFamily: 'inherit' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">{svg.includes('<') ? <g dangerouslySetInnerHTML={{ __html: svg }} /> : <path d={svg} />}</svg>
      <span className="text-[9px] font-semibold tracking-wider whitespace-nowrap">{label}</span>
    </button>
  );

  const sectionTitle = (emoji: string, text: string) => (
    <h2 className="font-serif text-lg text-stone-800 px-3.5 pt-4 pb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
      <span className="mr-1">{emoji}</span>{text}
    </h2>
  );

  const card = (icon: string, title: string, meta: string, tag?: [string, string], desc?: string) => (
    <div className="bg-white rounded-lg px-3.5 py-3 mx-3.5 mb-1 border border-stone-100">
      <div className="flex items-center gap-2">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-stone-800">{title}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">{meta}</div>
        </div>
        {tag && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${tag[0] === 'r' ? 'bg-amber-50 text-amber-800' : tag[0] === 'b' ? 'bg-blue-50 text-blue-800' : tag[0] === 'g' ? 'bg-green-50 text-green-800' : 'bg-stone-100 text-stone-600'}`}>{tag[1]}</span>}
      </div>
      {desc && <div className="text-[11px] text-stone-400 mt-1.5 ml-9 leading-relaxed">{desc}</div>}
    </div>
  );

  const linkCard = (href: string, icon: string, title: string, meta: string, tag?: [string, string], desc?: string) => (
    <a href={href} target="_blank" rel="noopener" className="block bg-white rounded-lg px-3.5 py-3 mx-3.5 mb-1 border border-stone-100 hover:shadow-sm transition-shadow no-underline text-inherit">
      <div className="flex items-center gap-2">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-stone-800">{title}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">{meta}</div>
        </div>
        {tag && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${tag[0] === 'r' ? 'bg-red-50 text-red-800' : tag[0] === 'b' ? 'bg-blue-50 text-blue-800' : tag[0] === 'g' ? 'bg-green-50 text-green-800' : tag[0] === 'p' ? 'bg-purple-50 text-purple-800' : 'bg-amber-50 text-amber-800'}`}>{tag[1]}</span>}
      </div>
      {desc && <div className="text-[11px] text-stone-400 mt-1.5 ml-9 leading-relaxed">{desc}</div>}
    </a>
  );

  const guideItem = (iconBg: string, icon: string, title: string, desc: string, body?: string) => (
    <div className="bg-white rounded-lg mb-1 border border-stone-100 overflow-hidden">
      <details className="group">
        <summary className="flex items-center gap-2 px-3.5 py-3 cursor-pointer list-none">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: iconBg }}>{icon}</div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-stone-800">{title}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">{desc}</div>
          </div>
          <span className="text-stone-300 text-sm transition-transform group-open:rotate-90">›</span>
        </summary>
        {body && <div className="px-3 pb-2.5 ml-9 text-[12px] text-stone-600 leading-relaxed border-t border-stone-50 pt-2"><div dangerouslySetInnerHTML={{ __html: body }} /></div>}
      </details>
    </div>
  );

  const btn = (href: string, label: string, style: string) => (
    <a href={href} target="_blank" rel="noopener" className={`text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline inline-block ${style}`}>{label}</a>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col max-w-md mx-auto relative" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      {/* Notch spacer */}
      <div className="h-[34px]" />

      {/* Brand Bar */}
      <div className="flex items-center gap-2 px-3.5 pb-2.5 flex-shrink-0" style={{ background: '#2c1810', paddingTop: '8px' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-extrabold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
        <div className="flex-1 text-center">
          <div className="text-base font-bold tracking-wider" style={{ color: '#f5c842' }}>Summers Vacations</div>
          <div className="text-[10px]" style={{ color: '#8b7355' }}>Branson, Missouri</div>
        </div>
        <div className="text-[10px] text-right" style={{ color: '#8b7355' }}>{mode === 'guest' ? todayFormatted : 'Checked out'}</div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 px-3.5 py-1 flex-shrink-0 justify-center" style={{ background: '#3d2b1f' }}>
        <button onClick={() => setMode('guest')} className={`text-[10px] font-semibold px-3 py-1 rounded-full border-none cursor-pointer font-inherit transition-colors ${mode === 'guest' ? 'text-stone-900' : 'text-stone-400'}`}
          style={{ background: mode === 'guest' ? T.accentColor : 'rgba(255,255,255,.1)' }}>🏠 Guest Mode</button>
        <button onClick={() => setMode('branson')} className={`text-[10px] font-semibold px-3 py-1 rounded-full border-none cursor-pointer font-inherit transition-colors ${mode === 'branson' ? 'text-stone-900' : 'text-stone-400'}`}
          style={{ background: mode === 'branson' ? T.accentColor : 'rgba(255,255,255,.1)' }}>🌲 Branson Mode</button>
      </div>

      {/* Seasonal Banner */}
      <div className="px-3.5 py-1.5 flex items-center gap-2 flex-shrink-0" style={styles.bar}>
        <span className="text-lg">{T.emoji}</span>
        <span className="text-[12px] font-semibold text-white flex-1">{T.name}</span>
        <a href={T.featuredLink} target="_blank" rel="noopener" className="text-[10px] font-semibold px-2 py-0.5 rounded-full no-underline" style={{ background: T.accentColor, color: '#2c1810' }}>See Event</a>
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none' }}
        onScroll={(e) => setIsScrolled((e.target as HTMLDivElement).scrollTop > 10)}>

        {/* ═══ HOME ═══ */}
        {tab === 'home' && (
          <>
            {mode === 'guest' ? (
              <>
                <div className="px-4 pt-3 pb-4" style={styles.bar}>
                  <h1 className="font-serif text-2xl" style={{ fontFamily: "'DM Serif Display', serif", color: '#f5c842' }}>
                    {guestName ? `Welcome, ${guestName}!` : `Welcome to ${prop.name}!`} 🤠
                  </h1>
                  <div className="text-[13px] mt-0.5" style={{ color: '#c4b5a0' }}>{prop.name} • Check-in at {prop.checkIn.time}</div>
                </div>
                <div className="mx-3.5 mt-[-10px] relative z-10 rounded-xl px-3.5 py-3 flex items-center gap-2.5 shadow-lg" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)' }}>
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: '#5c3d1e' }}>Your Door Code</div>
                    <div className="text-3xl font-extrabold tracking-[4px]" style={{ color: '#2c1810' }}>{guestCode || prop.checkIn.doorCode}</div>
                  </div>
                  <span className="ml-auto text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(44,24,16,.15)', color: '#5c3d1e' }}>✦ Ready</span>
                </div>
              </>
            ) : (
              <div className="px-4 pt-3 pb-4" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2d5a8e)' }}>
                <h1 className="font-serif text-2xl text-amber-300" style={{ fontFamily: "'DM Serif Display', serif" }}>Welcome back to Branson! 🎣</h1>
                <div className="text-[13px] mt-0.5 text-blue-200">{T.tagline}</div>
              </div>
            )}

            {/* Weather & Quick Info */}
            <div className="mx-3.5 mt-2.5 bg-white rounded-xl px-3.5 py-3 border border-stone-100 flex items-center gap-2">
              <span className="text-3xl font-bold text-stone-800">87°</span>
              <div className="flex-1"><div className="text-[12px] font-semibold text-stone-800">Branson, MO</div><div className="text-[11px] text-stone-400">☀️ Sunny</div></div>
              <div className="flex gap-2"><div className="text-center text-[11px] text-stone-400"><div className="font-semibold text-stone-600">Wed</div>☀️ 89°</div><div className="text-center text-[11px] text-stone-400"><div className="font-semibold text-stone-600">Thu</div>⛅ 86°</div></div>
            </div>

            <div className="flex gap-2 px-3.5 pt-1.5">
              <div className="flex-1 bg-white rounded-lg px-3 py-2.5 text-center border border-stone-100"><div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">WiFi</div><div className="text-[12px] font-bold text-stone-800 mt-0.5">{prop.wifi.network}</div></div>
              <div className="flex-1 bg-white rounded-lg px-3 py-2.5 text-center border border-stone-100"><div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">Check-out</div><div className="text-[13px] font-bold text-stone-800 mt-0.5">10 AM</div></div>
              <div className="flex-1 bg-white rounded-lg px-3 py-2.5 text-center border border-stone-100"><div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">Pool</div><div className="text-[13px] font-bold text-stone-800 mt-0.5">8–10PM</div></div>
            </div>

            {mode === 'branson' && (
              <div className="mx-3.5 mt-2 bg-green-50 rounded-lg px-3.5 py-3 border border-green-200">
                <div className="flex items-center gap-2"><span className="text-xl">🌲</span><div><div className="text-[13px] font-bold text-green-700">Your stay has ended</div><div className="text-[11px] text-green-600">But Branson is still here! Check shows, fishing, golf, and dining below.</div></div></div>
              </div>
            )}

            {/* Seasonal Feature */}
            <div className="mx-3.5 mt-2 rounded-xl px-3.5 py-3" style={styles.bar}>
              <div className="flex items-center gap-2"><span className="text-xl">{T.emoji}</span><h3 className="text-base font-bold text-white flex-1">{T.featuredEvent}</h3></div>
              <div className="flex gap-2 mt-2">
                <a href={T.featuredLink} target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline" style={{ background: T.accentColor, color: '#2c1810' }}>🎫 Learn More</a>
                <span className="text-[11px] text-white/70 self-center">{T.sdcEvent}</span>
              </div>
            </div>

            {/* Push Message */}
            <div className="mx-3.5 mt-1.5 mb-1 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
              <div className="text-[11px] text-amber-800 font-semibold">💡 {T.pushMessage}</div>
            </div>

            {/* Daily Branson Report */}
            <a href="/reports/2026-07-09.html" target="_blank" rel="noopener" className="block mx-3.5 mt-2 rounded-xl px-3.5 py-3 no-underline border border-amber-300 flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }}>
              <span className="text-3xl">📰</span>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-amber-900">Today's Branson Report</div>
                <div className="text-[11px] text-amber-700">Fishing • Shows • Golf • Events — fresh every morning</div>
              </div>
              <span className="text-xl text-amber-600">→</span>
            </a>

            {/* Today's Highlights */}
            {sectionTitle('🎯', "Today's Highlights")}
            <div className="grid grid-cols-2 gap-2 px-3.5">
              {[{e:'🎆',t:'Fireworks',d:'SDC Night Sky',l:'https://www.silverdollarcity.com/'},{e:'🎸',t:'Bohemian Queen',d:'Freddie Tribute',l:'https://www.claycooper.com/'},{e:'🎬',t:'Free Movies',d:'Last 2 weeks!',l:'https://www.bransonimax.com/'},{e:'⛳',t:'Golf Camp',d:'Ozarks National',l:'https://bigcedar.com/golf/ozarks-national/'}].map((x,i) => (
                <a key={i} href={x.l} target="_blank" rel="noopener" className="block bg-white rounded-lg px-3 py-2.5 border border-stone-100 no-underline text-inherit"><div className="text-xl">{x.e}</div><div className="text-[13px] font-bold text-stone-800 mt-0.5">{x.t}</div><div className="text-[11px] text-stone-400">{x.d}</div></a>
              ))}
            </div>

            {/* Tonight's Shows */}
            {sectionTitle('🎭', "Tonight's Shows")}
            {[{t:'7PM',n:'Grand Jubilee',v:'Grand Country',l:'https://www.grandcountrymusichall.com/'},{t:'8PM',n:'Bohemian Queen',v:'Clay Cooper',l:'https://www.claycooper.com/'},{t:'8PM',n:'The Haygoods',v:'Haygood Theater',l:'https://www.haygoodshow.com/'}].map((x,i) => (
              <a key={i} href={x.l} target="_blank" rel="noopener" className="flex items-center gap-2 mx-3.5 mb-1 bg-white rounded-lg px-3 py-2.5 border border-stone-100 no-underline text-inherit">
                <span className="text-[12px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: '#2c1810', color: '#f5c842' }}>{x.t}</span>
                <span className="text-[12px] font-semibold flex-1 text-stone-800">{x.n}</span>
                <span className="text-[10px] text-stone-400">{x.v}</span>
              </a>
            ))}

            {/* Book Again */}
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener" className="block mx-3.5 my-2 rounded-xl px-3.5 py-3 flex items-center gap-2 no-underline" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)' }}>
              <span className="text-3xl">🏠</span>
              <div className="flex-1"><div className="text-sm font-bold text-stone-800">Book Your Next Stay</div><div className="text-[11px] text-amber-800">Direct booking • Best rates • Summers Vacations</div></div>
              <span className="text-xl text-amber-800">›</span>
            </a>
          </>
        )}

        {/* ═══ GUIDE ═══ */}
        {tab === 'guide' && (
          <>
            {mode === 'guest' ? (
              <>
                <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#3d2b1f,#5c4033)', color: 'white', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 10, bottom: -8, fontSize: 60, opacity: 0.08 }}>📖</div>
                  <h1 className="font-serif text-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{prop.name} Guidebook</h1>
                  <p className="text-[12px] mt-0.5" style={{ color: '#c4b5a0' }}>Your complete house manual</p>
                </div>
                <div className="px-3.5 pt-3">
                  {guideItem('#fef3c7','🔑','Check-in & Access','Door code, keyless entry','<strong>Check-in:</strong> Anytime after 4:00 PM<br><br><strong>Door Code:</strong> '+(guestCode||prop.checkIn.doorCode)+'<br><br><strong>Keyless entry</strong> — code activates at 4PM on check-in day.')}
                  {guideItem('#dbeafe','📶','WiFi & Entertainment','Network, password, streaming','<strong>Network:</strong> '+prop.wifi.network+'<br><strong>Password:</strong> '+prop.wifi.password+'<br><br>Smart TV with Roku. Netflix, Hulu, Disney+, Prime Video.')}
                  {guideItem('#d1fae5','☕','Coffee Bar','Keurig K-Duo Plus','Keurig K-Duo Plus. Fill reservoir from top. ⏯️ <a href="https://www.youtube.com/watch?v=s8OHxzMKVd8" target="_blank" style="color:#166534;">Video guide</a>')}
                  {guideItem('#fef9c3','🍳','Kitchen & Supplies','Appliances, cookware & provided items','<strong>🧊 Fridge/Freezer:</strong> You shouldn&apos;t need to adjust any settings. There is an icemaker in the freezer.<br><br><strong>🔥 Stovetop & Oven:</strong> Both the stovetop and oven are electric.<br><br><strong>📦 Supplies Provided:</strong><br>• Roll of paper towels<br>• Dish soap<br>• One dish sponge<br>• A couple trash bags<br>• Dish cloths<br>• Drying towel<br>• Pots, pans & skillet<br>• Casserole dish<br>• Pizza pan & pizza cutter<br>• Cookie sheet, cake pan & muffin pan<br>• Crockpot<br>• Coffee pot<br>• Strainers<br>• Tupperware<br>• Blender<br>• Toaster<br>• Electric can opener<br>• Measuring cups<br>• Spatula & whisk<br>• Grilling tools<br>• Large serving utensils<br>• Silverware<br>• Dinner plates<br>• Salad plates<br>• Cereal bowls<br>• Wine glasses<br>• Coffee cups<br>• Juice glasses & tumblers<br>• Mixing bowls<br>• Cutting board<br>• Knife set<br>• Wine opener<br>• Bottle opener<br>• Potholders')}
                  {guideItem('#e0f2fe','🧺','Washer & Dryer','In-unit laundry, iron & cleaning','<strong>📍 Location:</strong> Washer and separate dryer located in the hallway by the front door.<br><br><strong>🧼 Detergent:</strong> A starter supply of detergent pods is provided. For more washes, you&apos;ll need to pick up additional pods at the store.<br><br><strong>🧹 Cleaning Supplies:</strong> Broom located next to the washer/dryer. Iron, ironing board, and vacuum cleaner are in the bedroom closets.')}
                  {guideItem('#fce7f3','🌸','Aroma 360','Essential oil diffuser','Aroma 360 diffuser pre-loaded. Plug in and enjoy. ⏯️ <a href="https://www.youtube.com/watch?v=Th_8nI2pdjM" target="_blank" style="color:#166534;">Demo</a>')}
                  {guideItem('#fee2e2','🔥','Fireplace & Ambiance','Electric fireplace & candles','Electric fireplace with remote. Flame without heat in summer. ⏯️ <a href="https://www.youtube.com/watch?v=lcq7bG2Mh8E" target="_blank" style="color:#166534;">Demo</a>')}
                  {guideItem('#fef3c7','📋','House Rules','Community guidelines & policies','<strong>🏘️ Our Community:</strong> We are located in a private community, and although this is a vacation destination, it&apos;s home to many people. Please respect their privacy and the right to a peaceful existence. Noise kept to a minimum between 10 PM and 8 AM.<br><br><strong>🔨 Breakages:</strong> Accidents happen! Please let us know immediately if something breaks. Minor issues are usually no charge. Larger issues (like a TV screen) we&apos;ll agree on cost before you leave.<br><br><strong>🚭 Smoking Policy:</strong> No smoking tobacco, marijuana, or vaping inside the buildings/units, on decks (front or rear), walkways, pool areas, or playgrounds. Smoking tobacco (no marijuana) and vaping are permitted in the parking lot and street only.<br><br><strong>📜 All Rules:</strong><br>• Use only plastic utensils on cookware (prevents scratching)<br>• No smoking or vaping inside or on the deck — parking lot only (per HOA rules)<br>• No pets<br>• No events, parties, or loud music<br>• No open flame or candles<br>• Discard all cooking oil in trash, not down drains<br>• Take trash out to dumpster as needed<br>• Quiet hours: 10 PM – 8 AM<br>• No unregistered guests<br>• No food or drink in bedrooms<br>• No rearranging furniture<br>• Please wash your dishes<br>• No illegal substances on premises<br>• All towels stay in the condo — do not take to pool')}
                  {guideItem('#ede9fe','🏊','Amenities','Pool, grill, lake, deck','Pool 8AM–10PM • Propane grill on deck • Private lake trail • Playground on-site')}
                  <div className="bg-white rounded-lg mb-1 border border-stone-100 overflow-hidden">
                    <details className="group">
                      <summary className="flex items-center gap-2 px-3.5 py-3 cursor-pointer list-none">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: '#dc2626' }}>🚨</div>
                        <div className="flex-1">
                          <div className="text-[13px] font-bold text-stone-800">Emergency Info</div>
                          <div className="text-[11px] text-stone-400 mt-0.5">911 • Hospital • Urgent Care</div>
                        </div>
                        <span className="text-stone-300 text-sm transition-transform group-open:rotate-90">›</span>
                      </summary>
                      <div className="px-3 pb-2.5 ml-9 text-[12px] text-stone-600 leading-relaxed border-t border-stone-50 pt-2">
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', marginBottom: 10, textAlign: 'center', fontWeight: 700, color: '#991b1b', fontSize: 15 }}>🚨 CALL 911 FOR EMERGENCIES</div>
                        <strong>Host:</strong> Brian Summers — <a href="tel:3145650589" style={{ color: '#dc2626' }}>314-565-0589</a><br />
                        <strong>Hospital:</strong> Cox Medical Center — 525 Branson Landing Blvd<br /><br />
                        <strong>🏥 Urgent Care &mdash; No appointment needed:</strong><br />
                        {prop.urgentCare?.map((uc, i) => (
                          <div key={i} style={{ margin: '6px 0' }}>
                            <a href={uc.mapsUrl} target="_blank" rel="noopener" style={{ fontWeight: 600, color: '#1d4ed8', textDecoration: 'none' }}>📍 {uc.name}</a><br />
                            <span style={{ color: '#6b7280', fontSize: 11 }}>{uc.address} &bull; <a href={`tel:${uc.phone.replace(/[^0-9]/g, '')}`} style={{ color: '#dc2626' }}>{uc.phone}</a> &bull; {uc.distance}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                  <div className="bg-green-50 rounded-lg mb-1 border border-green-200 overflow-hidden">
                    <details className="group">
                      <summary className="flex items-center gap-2 px-3.5 py-3 cursor-pointer list-none">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: '#bbf7d0' }}>🧹</div>
                        <div className="flex-1"><div className="text-[13px] font-bold text-green-700">Cleanliness Status</div><div className="text-[11px] text-green-600">✓ Inspected & ready!</div></div>
                        <span className="text-green-400 text-sm transition-transform group-open:rotate-90">›</span>
                      </summary>
                      <div className="px-3 pb-2.5 ml-9 text-[12px] text-green-700 leading-relaxed border-t border-green-100 pt-2">Unit cleaned, sanitized, and inspected. If anything needs attention, text Brian.</div>
                    </details>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 pt-3 pb-3" style={{ background: T.gradient, color: 'white', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 10, bottom: -8, fontSize: 60, opacity: 0.08 }}>🏡</div>
                  <h1 className="font-serif text-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Our Properties</h1>
                  <p className="text-[12px] mt-0.5" style={{ color: '#c4b5a0' }}>Browse all Summers Vacations rentals</p>
                </div>
                <div className="px-3.5 pt-3">
                  <div className="bg-green-50 rounded-lg px-3.5 py-3 mb-2 border border-green-200">
                    <div className="flex items-center gap-2"><span className="text-xl">🌲</span><div><div className="text-[13px] font-bold text-green-700">Your stay at {prop.name} has ended</div><div className="text-[11px] text-green-600">But there are 6 more properties to explore!</div></div></div>
                  </div>

                  {[
                    {icon:'🏠',name:'The Penthouse',meta:'🌟 You stayed here! • 2BR • Sleeps 6',desc:'Top-floor with fireplace, coffee bar, Aroma 360'},
                    {icon:'🌲',name:'Rustic Ozark Retreat',meta:'2BR • Sleeps 6 • Cozy mountain vibe',desc:'Keurig, Nest Thermostat, fireplace, deck'},
                    {icon:'🌳',name:'Woodland Retreat',meta:'2BR • Sleeps 6 • Bunk beds',desc:'Great for families! Mr. Coffee, bunk room'},
                    {icon:'✨',name:'Modern Charmer',meta:'1BR • Sleeps 4 • Sleek & stylish',desc:'Updated finishes, coffee bar, Pack \'n Play'},
                    {icon:'🦚',name:'Pretty Peacock',meta:'1BR • Sleeps 6 • No steps',desc:'Bottom floor, charging station, easy access'},
                    {icon:'🏡',name:'Branson Family Haven',meta:'3BR house • Sleeps 8 • Private yard',desc:'Standalone home, full kitchen, washer/dryer'},
                    {icon:'🏢',name:'Double Condo',meta:'Penthouse + Rustic • Sleeps 12+',desc:'🔥 Bundle & save! Two units, one booking'},
                  ].map((p,i) => (
                    <a key={i} href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener" className={`block bg-white rounded-lg px-3.5 py-3 mb-1 border no-underline text-inherit ${i===0?'border-l-4 border-amber-400':''}`}>
                      <div className="flex items-center gap-2"><span className="text-3xl">{p.icon}</span><div className="flex-1"><div className="text-[13px] font-bold text-stone-800">{p.name}</div><div className="text-[11px] text-stone-400">{p.meta}</div></div>
                        {i>0 && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-50 text-green-700 whitespace-nowrap">Book Now</span>}</div>
                      <div className="text-[10px] text-green-700 font-semibold mt-1 ml-9">{p.desc}</div>
                    </a>
                  ))}

                  <div className="bg-amber-50 rounded-lg px-3.5 py-3 my-2 border border-amber-200">
                    <div className="text-[12px] font-bold text-amber-800">💡 Bundle & Save</div>
                    <div className="text-[11px] text-amber-700 mt-1">Planning a family reunion or group trip? Book <strong>2+ units</strong> and save! All properties are in the same complex. Contact Brian for custom multi-unit pricing: <strong>314-565-0589</strong></div>
                  </div>
                </div>
              </>
            )}

            {/* Video Guides (show in guest mode) */}
            {mode === 'guest' && (
              <div className="px-3.5">
                <div className="font-serif text-base text-stone-800 pt-2 pb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>🎬 Video Guides</div>
                {[
                  ['Finding Your Building','https://youtu.be/qTRxLgEop-Q'],
                  ['Coffee Bar Tour','https://www.youtube.com/watch?v=s8OHxzMKVd8'],
                  ['Keurig K-Duo Plus','https://www.youtube.com/watch?v=9VvWwr4lEzg'],
                  ['Aroma 360 Diffuser','https://www.youtube.com/watch?v=Th_8nI2pdjM'],
                  ['Water Filter','https://www.youtube.com/watch?v=awyb9DSggcg'],
                  ['Electric Fireplace','https://www.youtube.com/watch?v=lcq7bG2Mh8E'],
                  ['Access Codes','https://www.youtube.com/watch?v=2DvVB7xTuNk'],
                  ['Laundry Room','https://www.youtube.com/watch?v=IlJQi1S0NRI'],
                  ['Lake Trail','https://www.youtube.com/watch?v=VGmH8k_656A'],
                  ['Boat Parking','https://www.youtube.com/watch?v=nCJsHxMO_Ok'],
                  ['Playground','https://www.youtube.com/watch?v=unj-zG9wtdU'],
                ].map(([t,u],i) => (
                  <a key={i} href={u} target="_blank" rel="noopener" className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 mb-0.5 border border-stone-100 no-underline text-inherit">
                    <span className="text-base">▶</span><span className="text-[12px] font-semibold text-stone-700">{t}</span>
                  </a>
                ))}
              </div>
            )}

            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener" className="block mx-3.5 my-2 rounded-xl px-3.5 py-3 flex items-center gap-2 no-underline" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)' }}>
              <span className="text-3xl">🏠</span><div className="flex-1"><div className="text-sm font-bold text-stone-800">Book Your Next Stay</div><div className="text-[11px] text-amber-800">Direct booking • Best rates</div></div><span className="text-xl text-amber-800">›</span>
            </a>
          </>
        )}

        {/* ═══ ADVENTURE ═══ */}
        {tab === 'adventure' && (
          <>
            <div className="px-4 pt-3 pb-3" style={styles.bar}><h1 className="font-serif text-2xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Branson Adventures</h1><p className="text-[12px] mt-0.5 text-amber-200">Thrills • Parks • Outdoors</p></div>
            {sectionTitle('⭐','Featured — Silver Dollar City')}
            <div className="mx-3.5 mb-1.5 rounded-xl px-3.5 py-3" style={styles.bar}>
              <div className="flex items-center gap-2"><span className="text-xl">🎢</span><h3 className="text-base font-bold text-white">Silver Dollar City</h3></div>
              <div className="text-[12px] mt-1 text-amber-200 leading-relaxed">America&apos;s #1 Theme Park! Outlaw Run, Time Traveler, Powder Keg, Mystic River Falls. 12 min drive.</div>
              <div className="flex gap-2 mt-2">
                <a href="https://www.silverdollarcity.com/" target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline" style={{ background: T.accentColor, color: '#2c1810' }}>🎫 Tickets</a>
                <a href="https://www.silverdollarcity.com/theme-park/attractions/rides/" target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline bg-white/20 text-white">🎢 Rides</a>
              </div>
            </div>
            {sectionTitle('🏔️','Mountain Coasters & Thrills')}
            {linkCard('https://theshepherdofthehills.com/coaster/','🎢','Copperhead Mountain Coaster','Longest in Branson! 3,350 ft',['a','3,350 ft'],'Control your speed down Branson\'s longest coaster. Zip lines & adventure course too.')}
            {linkCard('https://www.bransonalpinemountaincoaster.com/','⛰️','Runaway Mountain Coaster','Branson Mountain Adventure Park',['b','Thrilling'])}
            {linkCard('https://www.bransontrack.com/','🏎️','The Track Family Fun Parks','Go-karts, mini golf, bumper boats',['g','Family'])}
            {linkCard('https://www.fritzadventure.com/','🌀','Fritz\'s Adventure','Indoor ropes, climbing, 3-story slide',['p','Indoor'])}
            {linkCard('https://www.wonderworksbranson.com/','🧪','WonderWorks','100+ exhibits, 6D ride, laser tag',['b','All Ages'])}
            {sectionTitle('🌲','Nature & Outdoors')}
            {linkCard('https://dogwoodcanyon.org/','🌲','Dogwood Canyon Nature Park','10K acres • Waterfalls • Wildlife',['g','Must-See'])}
            {sectionTitle('🎡','Strip & Family Fun')}
            <div className="grid grid-cols-2 gap-2 px-3.5 pb-1.5">
              {[{e:'🎡',t:'Ferris Wheel',d:'The Boardwalk',l:'https://www.bransonferriswheel.com/'},{e:'⚡',t:'Xtreme Racing',d:'Indoor go-karts',l:'https://www.xtremeracingcenter.com/'},{e:'🌊',t:'White Water',d:'Water park',l:'https://www.whitewaterbranson.com/'},{e:'🚂',t:'Scenic Railway',d:'1-hour train ride',l:'https://www.bransonscenicrailway.com/'}].map((x,i)=>(
                <a key={i} href={x.l} target="_blank" rel="noopener" className="block bg-white rounded-lg px-3 py-2.5 border border-stone-100 no-underline text-inherit"><div className="text-xl">{x.e}</div><div className="text-[13px] font-bold text-stone-800 mt-0.5">{x.t}</div><div className="text-[11px] text-stone-400">{x.d}</div></a>
              ))}
            </div>
          </>
        )}

        {/* ═══ FISHING ═══ */}
        {tab === 'fishing' && (
          <>
            <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2d5a8e)' }}><h1 className="font-serif text-2xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Branson Fishing Guide</h1><p className="text-[12px] mt-0.5 text-blue-300">Spots • Guides • Tackle • Report</p>
              <span className="inline-block text-[11px] mt-1 px-2 py-0.5 rounded-full bg-white/20 text-white">🎣 {todayFormatted}</span>
            </div>
            {sectionTitle('📊',"Today's Fishing Report")}
            <div className="mx-3.5 mb-1.5 rounded-xl px-3.5 py-3" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2d5a8e)' }}>
              <div className="flex items-center gap-2"><span className="text-lg">🟢</span><h3 className="text-base font-bold text-white">Bite of the Day</h3></div>
              <div className="text-[12px] mt-1 text-blue-200 leading-relaxed">Taneycomo trout biting strong on pink worms below Fall Creek. Table Rock bass on topwater at dawn. Walleye excellent — 30-50 fish per trip.</div>
              <div className="flex gap-2 mt-1 flex-wrap"><span className="text-[11px]"><strong className="text-amber-300">Table Rock</strong> 77–80°F</span><span className="text-[11px]"><strong className="text-amber-300">Taneycomo</strong> 50–55°F</span></div>
            </div>
            {sectionTitle('🏞️','Table Rock — Bass, Crappie, Walleye')}
            {linkCard('https://www.branson.com/activities/boat-ramps','🏞️','Indian Point Public Use Area','Shore fishing • 4 min • Closest!',['g','Closest'])}
            {linkCard('https://rocklane.com/table-rock-lake-fishing/','🌊','Aunts Creek Access','Dock & shore • Bass/Crappie',['b','Dock'])}
            {sectionTitle('💧','Lake Taneycomo — Trout')}
            {linkCard('https://www.fallcreekrvcampground.com/','🎣','Fall Creek Marina & Trout Dock','500-ft dock • Trout • 8 min',['r','🔥 Hot'],'Your go-to for trout! Free dock, tackle, bait, rentals.')}
            {linkCard('https://mdc.mo.gov/discover-nature/places/cooper-creek-access','🤫','Cooper Creek Access','ADA dock • Quiet • 10 min',['a','🤫 Secret'])}
            {sectionTitle('🛶','Guide Services')}
            {linkCard('https://captainbguide.com/','🎣','Captain B Guide Service','Trout specialist • Brian\'s buddy!',['r','🔥 Pick'],'Your buddy Brian runs this — top-notch Taneycomo trout fishing. Tell him Summers Vacations sent you!')}
            {linkCard('https://bransonguidedfishingtrips.com/','🐟','Branson Guided Fishing Trips','USCG licensed • Bass & Trout',['b','Licensed'])}
            {sectionTitle('🪱','Bait & Tackle')}
            {linkCard('https://www.basspro.com/shop/en/bass-pro-shops-branson','🦌','Bass Pro Shops — Branson Landing','Full fishing dept • An experience!',['r','🔥 Must'],'Legendary outdoor store with aquarium, waterfall & arcade. Even if you don\'t need gear, it\'s worth a visit!')}
            {linkCard('https://www.fallcreekrvcampground.com/','🪱','Fall Creek Marina Tackle','Live bait • Licenses',['b','Shop'])}
            <div className="mx-3.5 my-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
              <div className="text-[11px] font-bold text-amber-800">🎫 Missouri fishing license required. Get one at any tackle shop or mdc.mo.gov</div>
            </div>
          </>
        )}

        {/* ═══ SHOWS ═══ */}
        {tab === 'shows' && (
          <>
            <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}><h1 className="font-serif text-2xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Branson Shows</h1><p className="text-[12px] mt-0.5 text-purple-300">Music • Comedy • Dinner • Family</p>
              <span className="inline-block text-[11px] mt-1 px-2 py-0.5 rounded-full bg-white/20 text-white">🎭 {todayFormatted}</span>
            </div>
            {sectionTitle('🎤','County & Variety')}
            {linkCard('https://www.grandcountrymusichall.com/','🎸','Grand Jubilee','7PM • Grand Country • $39+',['a','Classic'],'Branson\'s longest-running show! High-energy variety with comedy & live band.')}
            {linkCard('https://www.claycooper.com/','🎤','Bohemian Queen','8PM • Clay Cooper • $45+',['r','Tonight!'],'The ultimate Freddie Mercury tribute! Full costume changes & all the Queen hits.')}
            {linkCard('https://www.haygoodshow.com/','🎻','The Haygoods','8PM • Haygood • $42+',['p','Family'],'6 siblings, 20+ genres, high-energy music & dancing. A Branson powerhouse.')}
            {sectionTitle('🍽️','Dinner Shows')}
            {linkCard('https://www.dollypartonsstampede.com/branson/','🐴',"Dolly Parton's Stampede",'Dinner + show • $60+',['a','Iconic'],'Branson\'s most famous dinner show! 4-course feast with horse-riding stunts.')}
            {linkCard('https://www.sight-sound.com/','🎭','Sight & Sound Theatre','Live productions • $50+',['b','⭐ 4.8'],'Spectacular live theatre with massive sets, live animals & incredible production.')}
            <div className="mx-3.5 my-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
              <div className="text-[11px] text-amber-800 font-semibold">🏆 World Cup Watch Parties at Big Cedar Lodge — daily through Jul 19</div>
            </div>
          </>
        )}

        {/* ═══ GOLF ═══ */}
        {tab === 'golf' && (
          <>
            <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#2a5e3e,#1e4a30)' }}><h1 className="font-serif text-2xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Branson Golf Guide</h1><p className="text-[12px] mt-0.5 text-green-300">Spotlight • Rates • Tee times</p><span className="inline-block text-[11px] mt-1 px-2 py-0.5 rounded-full bg-white/20 text-white">⛳ {todayFormatted}</span></div>
            {sectionTitle('⛳','Spotlight — Branson Hills')}
            <div className="mx-3.5 rounded-xl px-3.5 py-3" style={{ background: 'linear-gradient(135deg,#166534,#15803d)' }}>
              <div className="flex items-center gap-2"><span className="text-xl">🏆</span><h3 className="text-base font-bold text-white">Branson Hills Golf Club</h3></div>
              <div className="text-[12px] mt-1 text-green-200 leading-relaxed">#1 Public in MO (Golfpass 2026). Ranked #10 Public in the U.S.! Dramatic 130-ft elevation changes. Missouri golf history museum.</div>
              <div className="text-[11px] mt-1 text-amber-300 px-2 py-1 rounded bg-black/20 leading-relaxed">🤯 Fun Fact: The first tee drops 130+ ft — that&apos;s a 13-story building!</div>
              <div className="flex gap-2 mt-1 flex-wrap"><span className="text-[11px]"><strong className="text-amber-300">Rates</strong> $235–$265</span><span className="text-[11px]"><strong className="text-amber-300">15 min</strong></span><span className="text-[11px]"><strong className="text-amber-300">Par 72</strong> 7,000 yds</span></div>
              <div className="flex gap-2 mt-2">
                <a href="https://bransonhillsgolfclub.com/" target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline" style={{ background: '#f5c842', color: '#2c1810' }}>📅 Book Tee Time</a>
                <a href="https://bransonhillsgolfclub.com/rates/" target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline bg-white/20 text-white">💰 Rates</a>
              </div>
            </div>
            {sectionTitle('🏌️','All Courses')}
            {linkCard('https://bigcedar.com/golf/paynes-valley/','⭐',"Payne's Valley — Big Cedar",'Tiger Woods • 12 min • $425+',['r','Premium'],'#1 USA TODAY 2026! Tiger\'s first public design. Bonus 19th island green.')}
            {linkCard('https://bigcedar.com/golf/ozarks-national/','🌲','Ozarks National — Big Cedar','Coore & Crenshaw • Top 100',['a','Top 100'])}
            {linkCard('https://bigcedar.com/golf/buffalo-ridge/','🏔️','Buffalo Ridge Springs','Tom Fazio • Top 100',['a','Top 100'])}
            {linkCard('https://www.ledstonegolf.com/','⛳','Ledgestone Country Club','Public • 5 min • $70–$160',['g','Closest'],'Award-winning mountain golf just 5 min from the condo!')}
            {linkCard('https://bransonhillsgolfclub.com/','🏆','Branson Hills Golf Club','#1 in MO • 15 min • $235+',['a','Top Rated'])}
            {linkCard('https://bigcedar.com/golf/top-of-the-rock/','⛰️','Top of the Rock — Big Cedar','Tom Watson par 3 • $135+',['b','⭐ 4.5'])}
            {linkCard('https://bigcedar.com/golf/cliffhangers/','🧗','Cliffhangers at Big Cedar','Jack Nicklaus par 3 • $225+',['p','Nicklaus'])}
            {linkCard('https://www.thousandhillsresorthotel.com/','🏙️','Thousand Hills Golf Resort','Resort course • $50–$90',['g','Budget'])}
            {linkCard('https://holidayhills.com/','🌄','Holiday Hills Golf Club','Public • $40–$70',['g','Great Value'])}
            {linkCard('https://bigcedar.com/golf/mountain-top/','🥾','Mountain Top — Big Cedar','Walking only • 13 holes • $100+',['p','Unique'])}
            <div className="mx-3.5 my-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
              <div className="text-[11px] text-amber-800 font-semibold">💡 Weekday tee times save $50-100+. Book 30 days ahead for Big Cedar courses.</div>
            </div>
          </>
        )}

        {/* ═══ DINING ═══ */}
        {tab === 'dining' && (
          <>
            <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#be123c,#e11d48)' }}><h1 className="font-serif text-2xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Branson Dining</h1><p className="text-[12px] mt-0.5 text-red-300">Restaurants • Bars • Waterfront</p></div>
            {sectionTitle('🍖',"Host's Top Picks")}
            {linkCard('https://www.whitefishhouse.com/','🥩','White River Fish House','Lakeside • American • $$',['a','Host Pick'],'Fresh fish with a view of Lake Taneycomo!')}
            {linkCard('https://www.bigdsbbq.com/','🍖',"Big D's BBQ",'BBQ • $',['a','Host Pick'],'Best ribs in Branson! Casual, affordable, delicious.')}
            {sectionTitle('🌲','Big Cedar Lodge Dining')}
            {linkCard('https://bigcedar.com/dining/','🏔️','Osage Restaurant — Top of the Rock','Fine dining • Lake views • $$$',['b','Scenic'])}
            {linkCard('https://bigcedar.com/dining/','🍔','Buffalo Bar & Grill','Casual • Golf course views • $$',['g','Casual'])}
            {linkCard('https://bigcedar.com/dining/tall-tales/','🎪','Tall Tales Bar & Grill','Outdoor • Live music • Fire pits',['g','Fun Vibe'])}
            {sectionTitle('🍺','Bars & Waterfront')}
            {linkCard('https://www.thelakehouseindianpoint.com/','🍹','The Lake House — Indian Point','Table Rock Lake • Live music • 4 min',['r','🔥 Closest!'],'Right down the road! Beautiful lake views, full bar, live entertainment.')}
            {linkCard('https://cheekymonkeybar.com/','🐒',"Crazy Craig's Cheeky Monkey Bar",'Lake views • Food • Fun • Open til 1AM',['a','Crazy Fun'],'Branson icon! Crazy decor, games, treehouse bar, dancing.')}
            {linkCard('https://rocklane.com/bars-table-rock-lake/','🏖️','Rock Lane Resort Tiki Bar','Swim-up bar on Table Rock Lake',['b','Tiki Bar'],'Order drinks right from the water! Courtesy docks — boat right up.')}
            {linkCard('https://www.flamingmargaritas.com/','🔥','Flaming Margaritas at the Landing','Landing • Waterfront • Margaritas',['r','Hot Spot'],'Famous margs, rooftop views, live music, fountain show views!')}
            {linkCard('https://tableagent.com/springfield-mo/laketime-bistro/','🌅','Laketime Bistro — Kimberling City','Lakeside • Seafood • Full bar • 20 min',['b','Worth the drive'],'Cozy lakeside hideaway! 4.5 ⭐ seafood & steak. Full bar.')}
            {sectionTitle('🍦','Sweet Treats')}
            <div className="grid grid-cols-2 gap-2 px-3.5 pb-1.5">
              {[{e:'🍦',t:"Billy Bob's Dairyland",d:'Old-school ice cream',l:'https://www.billybobsdairyland.com/'},{e:'🌳',t:"Crazy Craig's Treehouse",d:'Frozen custard',l:'https://cheekymonkeybar.com/'}].map((x,i)=>(
                <a key={i} href={x.l} target="_blank" rel="noopener" className="block bg-white rounded-lg px-3 py-2.5 border border-stone-100 no-underline text-inherit"><div className="text-xl">{x.e}</div><div className="text-[13px] font-bold text-stone-800 mt-0.5">{x.t}</div><div className="text-[11px] text-stone-400">{x.d}</div></a>
              ))}
            </div>
          </>
        )}

      </div>

      {/* Tab Bar */}
      <div className="overflow-x-auto flex-shrink-0" style={styles.tabBar}>
        <div className="flex h-[60px] pb-1" style={{ minWidth: 'fit-content' }}>
          {tabBtn('home','M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','Home')}
          {tabBtn('guide','M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z','Guide')}
          {tabBtn('adventure','M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z','Adventure')}
          {tabBtn('fishing','M18 12v-3M6 12v-3M3 9h18v3M8 18a4 4 0 0 0 8 0','Fishing')}
          {tabBtn('shows','M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z','Shows')}
          {tabBtn('golf','M14.5 2C15 3.5 15 5 14.5 6.5M9 16.8V20M9 4L20 7v8L9 10.5','Golf')}
          {tabBtn('dining','M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z','Dining')}
        </div>
      </div>
    </div>
  );
}