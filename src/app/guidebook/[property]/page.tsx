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

// Convert "4:00 PM" → "16:00:00" for Date constructor
function convertTime(t: string): string {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return '16:00:00';
  let h = parseInt(m[1]);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${min}:00`;
}

export default function GuidebookPage({ params, searchParams: spPromise }: {
  params: Promise<{ property: string }>;
  searchParams: Promise<{ code?: string; name?: string; checkin?: string; checkout?: string; checkintime?: string; listing?: string }>;
}) {
  const [prop, setProp] = useState<PropertyGuidebook | null>(null);
  const [tab, setTab] = useState('home');
  const [mode, setMode] = useState<'guest'|'branson'>('guest');
  const [guestCode, setGuestCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [checkinTime, setCheckinTime] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [fishingData, setFishingData] = useState<any>(null);
  const [showsData, setShowsData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const p = await params;
      const sp = await spPromise;
      // Accept both slug and Guesty listing name (decode URI encoding first)
      const raw = decodeURIComponent(p.property);
      const gb = getGuidebook(raw);
      if (!gb) return;
      setProp(gb);
      if (sp.code) setGuestCode(sp.code);
      if (sp.name) setGuestName(sp.name);
      if (sp.checkin) setCheckin(sp.checkin);
      if (sp.checkout) setCheckout(sp.checkout);
      if (sp.checkintime) setCheckinTime(sp.checkintime);
      // Auto-detect mode based on checkout date
      if (sp.checkout) { const co = new Date(sp.checkout + 'T11:00:00'); setMode(new Date() > co ? 'branson' : 'guest'); } else if (sp.checkin) { setMode('guest'); }
      // Fetch Guesty photos
      if (gb.guestyListingId) {
        try {
          const res = await fetch(`/api/photos?listingId=${gb.guestyListingId}`);
          const data = await res.json();
          if (data.ok && data.photos) {
            setPhotos(data.photos.map((p: {url:string}) => p.url).slice(0, 8));
          }
        } catch { /* silent */ }
      }
      // Fetch live data for Fishing & Shows tabs
      try { const r=await fetch('/api/fishing-report');const d=await r.json();if(d.ok)setFishingData(d); } catch {}
      try { const r=await fetch('/api/shows-report');const d=await r.json();if(d.ok)setShowsData(d); } catch {}
    })();
  }, [params, spPromise]);

  // Handle browser back button for tab navigation
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const prev = (e.state as {tab?:string})?.tab;
      if (prev) setTab(prev);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  if (!prop) return <div className="min-h-screen bg-sky-50 flex items-center justify-center"><p className="text-sky-700">Loading...</p></div>;

  const T = season();
  const isNotch = prop && prop.id !== 'branson-family-haven';
  const isPenthouse = prop && prop.id === 'the-penthouse';
  const isRustic = prop && prop.id === 'rustic-ozark-retreat';
  const isDouble = prop && prop.id === 'double-condo';
  const isHaven = prop && prop.id === 'branson-family-haven';
  const isWoodland = prop && prop.id === 'woodland-retreat';
  const isModern = prop && prop.id === 'modern-charmer';
  const isPeacock = prop && prop.id === 'pretty-peacock';
  const today = new Date();
  // ── Time-gated door code (all properties) ──────
  let doorState: 'before' | 'early' | 'ready' | 'after' = 'ready';
  let doorDisplay = guestCode || prop.checkIn.doorCode;
  let checkinLabel = '';
  let doorNote = '';
  if (checkin && checkout) {
    const ciDate = new Date(checkin + 'T07:00:00'); // 7AM — code visible
    const ciTime = checkinTime || '4:00 PM';
    const ciActive = new Date(checkin + 'T' + convertTime(ciTime)); // actual check-in
    const co = new Date(checkout + 'T11:00:00'); // 11AM checkout
    if (today < ciDate) {
      doorState = 'before';
      doorDisplay = 'Available at check-in';
      checkinLabel = ciDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (today < ciActive) {
      doorState = 'early';
      doorNote = 'Not active until ' + ciTime;
      checkinLabel = ciDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (today > co) {
      doorState = 'after';
      doorDisplay = 'Stay ended';
    }
  }
  const doorBg = doorState === 'ready'
    ? { background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }
    : doorState === 'early'
      ? { background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }
      : doorState === 'before'
        ? { background: 'linear-gradient(135deg,#93c5fd,#60a5fa)' }
        : { background: 'linear-gradient(135deg,#d1d5db,#9ca3af)' };
  const doorTag = doorState === 'ready' ? '✦ Ready'
    : doorState === 'early' ? '⏳ Waiting'
    : doorState === 'before' ? '🕐 Upcoming' : '🏁 Ended';
  const isActive = doorState === 'ready' || doorState === 'early';
  const wifiVisible = isActive ? prop.wifi.network : 'Available at check-in';
  const wifiNote = isActive ? '' : '🔒';
  const todayFormatted = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const styles = {
    bar: { background: T.gradient },
    tabActive: { color: T.accentColor },
    tabBar: { background: '#0c4a6e' },
  };

  const tabBtn = (id: string, svg: string, label: string) => (
    <button key={id} onClick={() => { setTab(id); contentRef.current?.scrollTo(0,0); window.history.pushState({tab:id}, '', ''); }}
      className={`flex-shrink-0 w-16 flex flex-col items-center justify-center gap-1 border-none font-inherit cursor-pointer transition-colors`}
      style={{ color: tab === id ? T.accentColor : '#8b7355', fontFamily: 'inherit' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">{svg.includes('<') ? <g dangerouslySetInnerHTML={{ __html: svg }} /> : <path d={svg} />}</svg>
      <span className="text-[9px] font-semibold tracking-wider whitespace-nowrap">{label}</span>
    </button>
  );

  const sectionTitle = (emoji: string, text: string) => (
    <h2 className="font-serif text-lg text-sky-900 px-3.5 pt-4 pb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
      <span className="mr-1">{emoji}</span>{text}
    </h2>
  );

  const card = (icon: string, title: string, meta: string, tag?: [string, string], desc?: string) => (
    <div className="bg-white rounded-lg px-3.5 py-3 mx-3.5 mb-1 border border-sky-100">
      <div className="flex items-center gap-2">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-sky-900">{title}</div>
          <div className="text-[11px] text-sky-200 mt-0.5">{meta}</div>
        </div>
        {tag && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${tag[0] === 'r' ? 'bg-teal-50 text-teal-800' : tag[0] === 'b' ? 'bg-blue-50 text-blue-800' : tag[0] === 'g' ? 'bg-green-50 text-green-800' : 'bg-sky-100 text-sky-700'}`}>{tag[1]}</span>}
      </div>
      {desc && <div className="text-[11px] text-sky-700 mt-1.5 ml-9 leading-relaxed">{desc}</div>}
    </div>
  );

  const linkCard = (href: string, icon: string, title: string, meta: string, tag?: [string, string], desc?: string) => (
    <a href={href} target="_blank" rel="noopener" className="block bg-white rounded-lg px-3.5 py-3 mx-3.5 mb-1 border border-sky-100 hover:shadow-sm transition-shadow no-underline text-inherit">
      <div className="flex items-center gap-2">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-sky-900">{title}</div>
          <div className="text-[11px] text-sky-700 mt-0.5">{meta}</div>
        </div>
        {tag && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${tag[0] === 'r' ? 'bg-red-50 text-red-800' : tag[0] === 'b' ? 'bg-blue-50 text-blue-800' : tag[0] === 'g' ? 'bg-green-50 text-green-800' : tag[0] === 'p' ? 'bg-purple-50 text-purple-800' : 'bg-teal-50 text-teal-800'}`}>{tag[1]}</span>}
      </div>
      {desc && <div className="text-[11px] text-sky-700 mt-1.5 ml-9 leading-relaxed">{desc}</div>}
    </a>
  );

  const guideItem = (iconBg: string, icon: string, title: string, desc: string, body?: string) => (
    <div className="bg-white rounded-lg mb-1 border border-sky-100 overflow-hidden">
      <details className="group">
        <summary className="flex items-center gap-2 px-3.5 py-3 cursor-pointer list-none">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: iconBg }}>{icon}</div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-sky-900">{title}</div>
            <div className="text-[11px] text-sky-700 mt-0.5">{desc}</div>
          </div>
          <span className="text-sky-200 text-sm transition-transform group-open:rotate-90">›</span>
        </summary>
        {body && <div className="px-3 pb-2.5 ml-9 text-[12px] text-sky-700 leading-relaxed border-t border-stone-50 pt-2"><div dangerouslySetInnerHTML={{ __html: body }} /></div>}
      </details>
    </div>
  );

  const btn = (href: string, label: string, style: string) => (
    <a href={href} target="_blank" rel="noopener" className={`text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline inline-block ${style}`}>{label}</a>
  );

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col max-w-md mx-auto relative" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      {/* Notch spacer */}
      <div className="h-[34px]" />

      {/* Brand Bar */}
      <div className="flex items-center gap-2 px-3.5 pb-2.5 flex-shrink-0" style={{ background: '#0c4a6e', paddingTop: '8px' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-extrabold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: '#ffffff' }}>SV</div>
        <div className="flex-1 text-center">
          <div className="text-base font-bold tracking-wider" style={{ color: '#ffffff' }}>Summers Vacations</div>
          <div className="text-[10px]" style={{ color: '#ffffff' }}>Branson, Missouri</div>
        </div>
        <div className="text-[10px] text-right" style={{ color: '#ffffff' }}>{mode === 'guest' ? todayFormatted : 'Checked out'}</div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 px-3.5 py-1 flex-shrink-0 justify-center" style={{ background: '#0c4a6e' }}>
        <div className="text-[10px] font-semibold px-3 py-1 rounded-full text-white"
          style={{ background: T.accentColor }}>{mode === 'guest' ? '🏠 Guest Mode' : '🌊 Branson Mode'}</div>
      </div>

      {/* Seasonal Banner */}
      <div className="px-3.5 py-1.5 flex items-center gap-2 flex-shrink-0" style={styles.bar}>
        <span className="text-lg">{T.emoji}</span>
        <span className="text-[12px] font-semibold text-white flex-1">{T.name}</span>
        <a href={T.featuredLink} target="_blank" rel="noopener" className="text-[10px] font-semibold px-2 py-0.5 rounded-full no-underline" style={{ background: T.accentColor, color: '#ffffff' }}>See Event</a>
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
                  <h1 className="font-serif text-2xl" style={{ fontFamily: "'DM Serif Display', serif", color: '#ffffff' }}>
                    {guestName ? `Welcome, ${guestName}!` : `Welcome to ${prop.name}!`} 🤠
                  </h1>
                  <div className="text-[13px] mt-0.5" style={{ color: '#ffffff' }}>{prop.name} • Check-in at {prop.checkIn.time}</div>
                </div>
                <div className="mx-3.5 mt-[-10px] relative z-10 rounded-xl px-3.5 py-3 flex items-center gap-2.5 shadow-lg" style={doorBg}>
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: doorState === 'ready' ? '#5c3d1e' : doorState === 'early' ? '#92400e' : doorState === 'before' ? '#1e40af' : '#6b7280' }}>Your Door Code</div>
                    <div className={`font-extrabold tracking-[4px] ${doorState === 'ready' || doorState === 'early' ? 'text-3xl' : 'text-lg'}`} style={{ color: doorState === 'ready' ? '#2c1810' : doorState === 'early' ? '#78350f' : doorState === 'before' ? '#1e3a5f' : '#4b5563' }}>{doorDisplay}</div>
                    {checkinLabel && <div className="text-[11px] mt-0.5" style={{ color: doorState === 'early' ? '#92400e' : doorState === 'before' ? '#1e40af' : '#6b7280' }}>Check-in: {checkinLabel} at 4PM</div>}
                    {doorNote && <div className="text-[10px] mt-0.5 font-semibold" style={{ color: '#b45309' }}>⏳ {doorNote}</div>}
                  </div>
                  <span className="ml-auto text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                    style={doorState === 'ready' ? { background: 'rgba(44,24,16,.15)', color: '#5c3d1e' }
                      : doorState === 'early' ? { background: 'rgba(180,83,9,.15)', color: '#92400e' }
                      : doorState === 'before' ? { background: 'rgba(30,64,175,.15)', color: '#1e40af' }
                      : { background: 'rgba(0,0,0,.08)', color: '#6b7280' }}>{doorTag}</span>
                </div>
              </>
            ) : (
              <div className="px-4 pt-3 pb-4" style={{ background: 'linear-gradient(135deg,#0c4a6e,#0ea5e9)' }}>
                <h1 className="font-serif text-2xl text-yellow-300" style={{ fontFamily: "'DM Serif Display', serif" }}>Welcome back to Branson! 🎣</h1>
                <div className="text-[13px] mt-0.5 text-white">{T.tagline}</div>
              </div>
            )}

            {/* Address — tap to open in maps */}
            <a href={`https://maps.google.com/?q=${encodeURIComponent(prop.address)}`} target="_blank" rel="noopener"
              className="block mx-3.5 mt-2 bg-white rounded-lg px-3.5 py-2.5 border border-sky-100 no-underline text-inherit">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <div className="flex-1">
                  <div className="text-[11px] font-semibold text-sky-900">{prop.address}</div>
                  <div className="text-[10px] text-sky-900 mt-0.5">Tap to open in maps</div>
                </div>
                <span className="text-sky-900 text-sm">›</span>
              </div>
            </a>

            {/* Photo Gallery — auto-syncs from Guesty */}
            {photos.length > 0 && (
              <div className="mt-2.5 px-3.5">
                <div className="overflow-x-auto flex gap-2 pb-1" style={{ scrollSnapType: 'x mandatory' }}>
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt={`${prop.name} photo ${i+1}`}
                      className="flex-shrink-0 w-[140px] h-[100px] object-cover rounded-lg border border-sky-200"
                      style={{ scrollSnapAlign: 'start' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Weather & Quick Info */}
            <div className="mx-3.5 mt-2.5 bg-white rounded-xl px-3.5 py-3 border border-sky-100 flex items-center gap-2">
              <span className="text-3xl font-bold text-sky-900">87°</span>
              <div className="flex-1"><div className="text-[12px] font-semibold text-sky-900">Branson, MO</div><div className="text-[11px] text-sky-900">☀️ Sunny</div></div>
              <div className="flex gap-2"><div className="text-center text-[11px] text-sky-900"><div className="font-semibold text-sky-900">Wed</div>☀️ 89°</div><div className="text-center text-[11px] text-sky-900"><div className="font-semibold text-sky-900">Thu</div>⛅ 86°</div></div>
            </div>

            <div className="flex gap-2 px-3.5 pt-1.5">
              <div className="flex-1 bg-white rounded-lg px-3 py-2.5 text-center border border-sky-100"><div className="text-[10px] uppercase tracking-wide text-sky-900 font-semibold">WiFi {wifiNote}</div><div className="text-[12px] font-bold text-sky-900 mt-0.5">{wifiVisible}</div></div>
              <div className="flex-1 bg-white rounded-lg px-3 py-2.5 text-center border border-sky-100"><div className="text-[10px] uppercase tracking-wide text-sky-900 font-semibold">Check-out</div><div className="text-[13px] font-bold text-sky-900 mt-0.5">10 AM</div></div>
              <div className="flex-1 bg-white rounded-lg px-3 py-2.5 text-center border border-sky-100"><div className="text-[10px] uppercase tracking-wide text-sky-900 font-semibold">Pool</div><div className="text-[13px] font-bold text-sky-900 mt-0.5">8–10PM</div></div>
            </div>

            {mode === 'branson' && (
              <div className="mx-3.5 mt-2 bg-green-50 rounded-lg px-3.5 py-3 border border-green-200">
                <div className="flex items-center gap-2"><span className="text-xl">🌊</span><div><div className="text-[13px] font-bold text-teal-700">Your stay has ended</div><div className="text-[11px] text-teal-600">But Branson is still here! Check shows, fishing, golf, and dining below.</div></div></div>
              </div>
            )}

            {/* Seasonal Feature */}
            <div className="mx-3.5 mt-2 rounded-xl px-3.5 py-3" style={styles.bar}>
              <div className="flex items-center gap-2"><span className="text-xl">{T.emoji}</span><h3 className="text-base font-bold text-white flex-1">{T.featuredEvent}</h3></div>
              <div className="flex gap-2 mt-2">
                <a href={T.featuredLink} target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline" style={{ background: T.accentColor, color: '#ffffff' }}>🎫 Learn More</a>
                <span className="text-[11px] text-white/70 self-center">{T.sdcEvent}</span>
              </div>
            </div>

            {/* Push Message */}
            <div className="mx-3.5 mt-1.5 mb-1 bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
              <div className="text-[11px] text-teal-800 font-semibold">💡 {T.pushMessage}</div>
            </div>

            {/* Daily Branson Report */}
            <a href={`/reports/${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}.html`} target="_blank" rel="noopener" className="block mx-3.5 mt-2 rounded-xl px-3.5 py-3 no-underline border border-blue-300 flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' }}>
              <span className="text-3xl">📰</span>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-blue-900">Today's Branson Report</div>
                <div className="text-[11px] text-teal-700">Fishing • Shows • Golf • Events — fresh every morning</div>
              </div>
              <span className="text-xl text-teal-600">→</span>
            </a>

            {/* Today's Highlights */}
            {sectionTitle('🎯', "Today's Highlights")}
            <div className="grid grid-cols-2 gap-2 px-3.5">
              {[{e:'🎆',t:'Fireworks',d:'SDC Night Sky',l:'https://www.silverdollarcity.com/theme-park/festivals/summer-celebration/'},{e:'🎸',t:'Bohemian Queen',d:'Freddie Tribute',l:'https://www.themansiontheatre.com/'},{e:'🎬',t:'Free Movies',d:'Last 2 weeks!',l:'https://www.bransonimax.com/'},{e:'⛳',t:'Golf Camp',d:'Ozarks National',l:'https://bigcedar.com/golf/ozarks-national/'}].map((x,i) => (
                <a key={i} href={x.l} target="_blank" rel="noopener" className="block bg-white rounded-lg px-3 py-2.5 border border-sky-100 no-underline text-inherit"><div className="text-xl">{x.e}</div><div className="text-[13px] font-bold text-sky-900 mt-0.5">{x.t}</div><div className="text-[11px] text-sky-700">{x.d}</div></a>
              ))}
            </div>

            {/* Tonight's Shows */}
            {sectionTitle('🎭', "Tonight's Shows")}
            {[{t:'7PM',n:'Grand Jubilee',v:'Grand Country',l:'https://www.grandcountrylivemusic.com/grand-jubilee'},{t:'8PM',n:'Bohemian Queen',v:'Clay Cooper',l:'https://www.themansiontheatre.com/'},{t:'8PM',n:'The Haygoods',v:'Haygood Theater',l:'https://thehaygoods.com/'}].map((x,i) => (
              <a key={i} href={x.l} target="_blank" rel="noopener" className="flex items-center gap-2 mx-3.5 mb-1 bg-white rounded-lg px-3 py-2.5 border border-sky-100 no-underline text-inherit">
                <span className="text-[12px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: '#2c1810', color: '#ffffff' }}>{x.t}</span>
                <span className="text-[12px] font-semibold flex-1 text-sky-900">{x.n}</span>
                <span className="text-[10px] text-sky-700">{x.v}</span>
              </a>
            ))}

            {/* Book Again */}
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener" className="block mx-3.5 my-2 rounded-xl px-3.5 py-3 flex items-center gap-2 no-underline" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
              <span className="text-3xl">🏠</span>
              <div className="flex-1"><div className="text-sm font-bold text-sky-900">Book Your Next Stay</div><div className="text-[11px] text-teal-800">Direct booking • Best rates • Summers Vacations</div></div>
              <span className="text-xl text-teal-800">›</span>
            </a>
          </>
        )}

        {/* ═══ GUIDE ═══ */}
        {tab === 'guide' && (
          <>
            {mode === 'guest' ? (
              <>
                <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#0c4a6e,#0ea5e9)', color: 'white', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 10, bottom: -8, fontSize: 60, opacity: 0.08 }}>📖</div>
                  <h1 className="font-serif text-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{prop.name} Guidebook</h1>
                  <p className="text-[12px] mt-0.5" style={{ color: '#ffffff' }}>Your complete house manual</p>
                </div>
                <div className="px-3.5 pt-3">
                  {isNotch && guideItem('#fce7f3','🎒','Things to Bring','Recommended packing list','🧴 Sunblock & bug spray<br>🩴 Pool/beach towels for the lake<br>🎣 Fishing gear if you plan to fish<br>🪵 Charcoal for the BBQ grills (not provided)<br>🧺 Cooler for lake days<br>🧼 Extra laundry detergent if doing multiple loads<br>🪙 Quarters for coin laundry<br>🥾 Sturdy shoes or hiking boots for the rocky trail<br><br>⏯️ <a href="https://www.youtube.com/watch?v=2DvVB7xTuNk" target="_blank" style="color:#166534;">Watch: Things to Bring video guide</a>')}
                  {guideItem('#fef3c7','🔑','Check-in & Access','Door code, keyless entry','<strong>Check-in:</strong> Anytime after 4:00 PM<br><br><strong>Door Code:</strong> '+(doorState === "ready" || doorState === "early" ? doorDisplay : "Revealed on your check-in day")+'<br><br><strong>Keyless entry</strong> — code activates at 4PM on check-in day.')}
                  {guideItem('#dbeafe','📶','WiFi & Entertainment','Network, password, streaming','<strong>Network:</strong> '+(isActive ? prop.wifi.network : 'Revealed on your check-in day')+'<br><strong>Password:</strong> '+(isActive ? prop.wifi.password : 'Revealed on your check-in day')+'<br><br>Smart TV with Roku. Netflix, Hulu, Disney+, Prime Video.')}
                  <div className="bg-white rounded-lg mb-1 border border-sky-100 overflow-hidden">
                    <details className="group">
                      <summary className="flex items-center gap-2 px-3.5 py-3 cursor-pointer list-none">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: '#dc2626' }}>🚨</div>
                        <div className="flex-1">
                          <div className="text-[13px] font-bold text-sky-900">Emergency Info</div>
                          <div className="text-[11px] text-sky-700 mt-0.5">911 • Hospital • Urgent Care</div>
                        </div>
                        <span className="text-sky-700 text-sm transition-transform group-open:rotate-90">›</span>
                      </summary>
                      <div className="px-3 pb-2.5 ml-9 text-[12px] text-sky-700 leading-relaxed border-t border-stone-50 pt-2">
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
                  {guideItem('#fef9c3','🍳','Kitchen & Supplies','Appliances, cookware & provided items','<strong>🧊 Fridge/Freezer:</strong> You shouldn&apos;t need to adjust any settings. {isModern || isPeacock ? "There are ice trays in the freezer." : "There is an icemaker in the freezer."}<br><br><strong>🔥 Stovetop & Oven:</strong> Both the stovetop and oven are electric.<br><br><strong>📦 Supplies Provided:</strong><br>• Roll of paper towels<br>• Dish soap<br>• One dish sponge<br>• A couple trash bags<br>• Dish cloths<br>• Drying towel<br>• Pots, pans & skillet<br>• Casserole dish<br>• Pizza pan & pizza cutter<br>• Cookie sheet, cake pan & muffin pan<br>• Crockpot<br>• Coffee pot<br>• Strainers<br>• Tupperware<br>• Blender<br>• Toaster<br>• Electric can opener<br>• Measuring cups<br>• Spatula & whisk<br>• Grilling tools<br>• Large serving utensils<br>• Silverware<br>• Dinner plates<br>• Salad plates<br>• Cereal bowls<br>• Wine glasses<br>• Coffee cups<br>• Juice glasses & tumblers<br>• Mixing bowls<br>• Cutting board<br>• Knife set<br>• Wine opener<br>• Bottle opener<br>• Potholders')}
                  {(!isModern && !isPeacock) && guideItem('#d1fae5','☕','Coffee Bar',prop.appliances.coffeeMaker.type,prop.appliances.coffeeMaker.instructions + (prop.appliances.coffeeMaker.youtube ? ' ⏯️ <a href="' + prop.appliances.coffeeMaker.youtube + '" target="_blank" style="color:#166534;">Video guide</a>' : ''))}
                  {(isModern || isPeacock) && guideItem('#d1fae5','☕','Coffee Bar','Drip coffee maker with supplies','Everything you need for your coffee! From grounds to creamer — this drip coffee maker will help you start your mornings right.')}
                  {(!isModern && !isPeacock) && guideItem('#d1fae5','☕','Coffee Bar',prop.appliances.coffeeMaker.type,prop.appliances.coffeeMaker.instructions + (prop.appliances.coffeeMaker.youtube ? ' ⏯️ <a href="' + prop.appliances.coffeeMaker.youtube + '" target="_blank" style="color:#166534;">Video guide</a>' : ''))}
                  {guideItem('#e0f2fe','🧺','Washer & Dryer','In-unit laundry, iron & cleaning','<strong>📍 Location:</strong> Washer and separate dryer located in the hallway by the front door.<br><br><strong>🧼 Detergent:</strong> A starter supply of detergent pods is provided. For more washes, you&apos;ll need to pick up additional pods at the store.<br><br><strong>🧹 Cleaning Supplies:</strong> Broom located next to the washer/dryer. Iron, ironing board, and vacuum cleaner are in the bedroom closets.')}
                  {(isPenthouse) && guideItem('#fce7f3','🌸','Aroma 360','Essential oil diffuser','Aroma 360 diffuser pre-loaded. Plug in and enjoy. ⏯️ <a href="https://www.youtube.com/watch?v=Th_8nI2pdjM" target="_blank" style="color:#166534;">Demo</a>')}
                  {(isPenthouse || isRustic) && guideItem('#d1fae5','💧','Water Filter','Drinking water filtration system','Water filter system for clean drinking water. ⏯️ <a href="https://www.youtube.com/watch?v=awyb9DSggcg" target="_blank" style="color:#166534;">Demo</a>')}
                  {(isPenthouse || isRustic || isDouble || isModern || isPeacock) && guideItem('#fee2e2','🔥','Fireplace & Ambiance','Electric fireplace & candles','Electric fireplace with remote. Flame without heat in summer.')}
                  {guideItem('#fef3c7','📋','House Rules','Community guidelines & policies','<strong>🏘️ Our Community:</strong> We are located in a private community, and although this is a vacation destination, it&apos;s home to many people. Please respect their privacy and the right to a peaceful existence. Noise kept to a minimum between 10 PM and 8 AM.<br><br><strong>🔨 Breakages:</strong> Accidents happen! Please let us know immediately if something breaks. Minor issues are usually no charge. Larger issues (like a TV screen) we&apos;ll agree on cost before you leave.<br><br><strong>🚭 Smoking Policy:</strong> No smoking tobacco, marijuana, or vaping inside the buildings/units, on decks (front or rear), walkways, pool areas, or playgrounds. Smoking tobacco (no marijuana) and vaping are permitted in the parking lot and street only.<br><br><strong>📜 All Rules:</strong><br>• Use only plastic utensils on cookware (prevents scratching)<br>• No smoking or vaping inside or on the deck — parking lot only (per HOA rules)<br>• No pets<br>• No events, parties, or loud music<br>• No open flame or candles<br>• Discard all cooking oil in trash, not down drains<br>• Take trash out to dumpster as needed<br>• Quiet hours: 10 PM – 8 AM<br>• No unregistered guests<br>• No food or drink in bedrooms<br>• No rearranging furniture<br>• Please wash your dishes<br>• No illegal substances on premises<br>• All towels stay in the condo — do not take to pool')}
                  {(isModern || isPeacock) && guideItem('#e0f2fe','🚿','Bathrooms','Body wash, shampoo & conditioner','<strong>🛁 Master Bathroom:</strong> Equipped with body wash, shampoo, and conditioner. Plenty of towels and hand soap are provided.<br><br><strong>🚿 Hall Bathroom:</strong> Also equipped with body wash, shampoo, and conditioner. Plenty of towels and hand soap.')}
                  {(isModern || isPeacock) && guideItem('#fef3c7','🛋️','Family Room','Queen sleeper sofa','The family room is the perfect place to relax after a long, adventurous day. There is a cozy couch that transforms into a queen size sleeper sofa.')}
                  {(isModern || isPeacock) && guideItem('#fce7f3','🎮','Games','Board games & blankets','In the two ottomans you will find board games and extra blankets for cozy nights in.')}
                  
                  {(isModern || isPeacock) && guideItem('#ede9fe','🛏️','Bedrooms','King, queen & full beds','<strong>🛏️ Master Bedroom:</strong> King size bed with dresser, table, and closets with hangers and extra blankets. Includes lamps, charging port with extra USB ports and outlets, TV, and ceiling fan.<br><br><strong>🛏️ Second Bedroom:</strong> Queen size bed and full size bed with the same amenities — lamps, charging ports, TV, and ceiling fan. The Pack \'n Play is located in the second bedroom closet.')}
                  {(isModern || isPeacock) && guideItem('#fef9c3','👶','Pack \'n Play','Second bedroom closet','The Pack \'n Play is located in the second bedroom in the closet for your little one.')}
                  {(isModern || isPeacock) && guideItem('#fef3c7','🔌','Charging Station','6-device charging hub','We provide a charging station that can hold up to 6 devices. Cables support: 2 USB-C and 2 iPhone (Lightning) device connections.')}
                  {(isModern || isPeacock) && guideItem('#dbcafe','📺','Roku Streaming','Smart TV — guest mode','<strong>How to use Roku in guest mode:</strong><br>1. Press the Home button on the Roku remote<br>2. Select your favorite streaming app (Netflix, Hulu, Disney+, Prime Video)<br>3. Sign in with your own account — your credentials are automatically removed at checkout<br>4. To switch apps, press Home and select another<br><br><strong>💡 Tip:</strong> The TV remembers nothing between guests. Sign in and enjoy!')}
                  {guideItem('#ede9fe','🏊','Amenities','Pool, grill, lake, deck','Pool 8AM–10PM • Charcoal grills by pool • Private lake trail • Playground on-site')}
                  {isNotch && guideItem('#dbeafe','🏊','Pool & Pavilion Rules','Hours, safety & policies','<strong>Hours:</strong> 8 AM – 10 PM daily<br><br><strong>Rules:</strong> No glass containers in the pool area. Children must be supervised at all times. No diving or running. Pool towels are provided in the unit — please do not take bath towels to the pool.<br><br>The pavilion/shelter is available for guest use. Please clean up after yourself and be considerate of other guests.')}
                  {isNotch && guideItem('#d1fae5','🌿','Outdoor Recreation','Lake, trail, playground & more','<strong>🏞️ Private Lake (Pond):</strong> A short walk from the property. Catch-and-release fishing allowed. The walking trail circles the lake. Please supervise children near the water. <strong>⚠️ The path down to the lake is steep and rocky — proper footwear is a must for Ozarks terrain.</strong><br><br><strong>🚶 Walking Trail:</strong> Scenic trail circling the lake. <strong>⚠️ The trail is steep and rocky — wear sturdy shoes or hiking boots.</strong> Maintained year-round, but Ozarks terrain means uneven surfaces, roots, and rocks.<br><br><strong>🛝 Playground:</strong> Near the main pool — swings and a slide. Adult supervision required.<br><br><strong>🏀 Basketball:</strong> Court near the pool area. Basketballs are on the rack by the court.<br><br><strong>🥏 Horseshoes:</strong> Pits by the larger pool. Horseshoes are left at the pit.')}
                  {isHaven && guideItem('#fce7f3','🎮','Games','Board games under the TV','<strong>📍 Location:</strong> Board games are stored in the slide-out section of the small table under the TV in the living room.<br><br><strong>🎲 What you will find:</strong> A selection of board games and card games for family fun. Perfect for rainy days or quiet evenings in!')}
                  {isHaven && guideItem('#dbcafe','📺','Roku Streaming','Smart TV — guest mode','<strong>All TVs in the house are set up for Roku guest mode.</strong><br><br><strong>📋 How to use:</strong><br>1. Press the Home button on the Roku remote<br>2. Select your favorite streaming app (Netflix, Hulu, Disney+, Prime Video, and more)<br>3. Sign in with your own account — your credentials are automatically removed at checkout<br>4. To switch apps, press Home and select another<br><br><strong>💡 Tip:</strong> The TV remembers nothing between guests. Sign in, enjoy, and everything is cleared when you leave!')}
                  {isHaven && guideItem('#e0f2fe','🚗','Getting Around','Parking & layout','<strong>🅿️ Parking:</strong> Park in the upper lot by the blue shed. Boat and trailer parking is also available in the designated area.<br><br><strong>🏠 The Home:</strong> Branson Family Haven is a standalone house at 44 Timber Trace. The main entrance is at the front door. The downstairs living area has the kitchen, dining, and family room. Bedrooms are upstairs.<br><br><strong>🔑 Entry:</strong> Keyless entry — your door code is the last 4 digits of the phone number used when booking.')}
                  {isHaven && guideItem('#d1fae5','🏊','Community Amenities','2 pools, hot tub & playground','<strong>🏊 Pools & Hot Tub:</strong> 2 shared community pools and a hot tub are available for guest use. Please follow posted rules and hours.<br><br><strong>🛝 Playground:</strong> Community playground for children. Adult supervision required.<br><br><strong>🍖 Gas BBQ Grill:</strong> Propane gas grill on the property. Propane is provided.<br><br><strong>🔥 Fire Pit:</strong> Outdoor fire pit available for guest use. Please extinguish completely after use and follow any burn restrictions.<br><br><strong>🚤 Boat & Trailer Parking:</strong> Designated parking in the upper lot by the blue shed.')}
                  
                  {isNotch && guideItem('#fef3c7','🍖','BBQ Grill','Charcoal — bring your own','Charcoal barbecue grills are available on the property. <strong>Charcoal is NOT provided</strong> — please bring your own. Clean the grill after use. Grills are shared — be considerate of other guests. Grilling tools are in the kitchen.')}
                  {isNotch && guideItem('#e0f2fe','🪙','Coin Laundry','Shared facility near main pool','Coin-operated washers and dryers are located near the main pool. Machines accept quarters. A starter supply of detergent pods is provided in your unit. Additional detergent is available for purchase at the laundry facility. <strong>Hours:</strong> Available during pool hours (8 AM – 10 PM). ⏯️ <a href="https://www.youtube.com/watch?v=IlJQi1S0NRI" target="_blank" style="color:#166534;">Video walkthrough</a>')}
                  {isHaven && guideItem('#e0f2fe','🧺','Washer & Dryer','Full-size in-unit laundry','<strong>📍 Location:</strong> Full-size washer and dryer located in the unit — no quarters needed! Load them up and go.<br><br><strong>🧼 Detergent:</strong> A starter supply of detergent is provided. For multiple loads, you may need to pick up more at the store.<br><br><strong>💡 How to use:</strong> Add clothes, add detergent, select cycle, and press Start. Standard cycles work great for most loads.')}
                  {isHaven && guideItem('#fce7f3','🍳','Whirlpool Range','Electric range with cooktop','<strong>🔥 How to use:</strong> The Whirlpool electric range has a smooth glass cooktop. Turn the knob to the desired heat level. The surface will glow red when hot.<br><br><strong>⚠️ Important:</strong> Use only plastic utensils on cookware to prevent scratching the glass surface. Let the cooktop cool completely before cleaning.<br><br><strong>🧹 Cleaning:</strong> Use cooktop cleaner and a soft cloth — never abrasive scrubbers.')}
                  {isHaven && guideItem('#dbeafe','🧼','Dishwasher','Whirlpool with Fan Dry','<strong>🏷️ Model:</strong> Whirlpool dishwasher with Fan Drying Technology.<br><br><strong>📋 How to use:</strong> 1. Load dishes facing the center 2. Add detergent to the dispenser and close the lid 3. Select a cycle — Normal works for most loads, Heavy for pots and pans 4. Press Start. <strong>Options:</strong> Sani Rinse for extra sanitizing, High Temp for tough grease.<br><br><strong>💡 Tip:</strong> Please start the dishwasher before checkout with any remaining dishes.')}
                  {isHaven && guideItem('#fef9c3','📡','Microwave','Above the range','<strong>📍 Location:</strong> Mounted above the Whirlpool range.<br><br><strong>📋 How to use:</strong> 1. Press Open to open the door 2. Place food inside 3. Close the door 4. Enter time with the number pad 5. Press Start. Use the +30 Sec button for quick reheats.<br><br><strong>⚠️ No metal:</strong> Do not put metal, foil, or anything with metallic trim in the microwave.')}
                  {isHaven && guideItem('#fef3c7','💡','Dimmer Lights','Can lights downstairs','<strong>📍 Location:</strong> The can lights in the downstairs living area are on dimmer switches.<br><br><strong>📋 How to use:</strong> Look for the dimmer switches on the wall (they slide up and down instead of just clicking on/off). Slide up to brighten, down to dim, and all the way down to turn off. Perfect for movie nights or relaxing evenings!')}
                  

                </div>
              </>
            ) : (
              <>
                <div className="px-4 pt-3 pb-3" style={{ background: T.gradient, color: 'white', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 10, bottom: -8, fontSize: 60, opacity: 0.08 }}>🏡</div>
                  <h1 className="font-serif text-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>Our Properties</h1>
                  <p className="text-[12px] mt-0.5" style={{ color: '#ffffff' }}>Browse all Summers Vacations rentals</p>
                </div>
                <div className="px-3.5 pt-3">
                  <div className="bg-green-50 rounded-lg px-3.5 py-3 mb-2 border border-green-200">
                    <div className="flex items-center gap-2"><span className="text-xl">🌊</span><div><div className="text-[13px] font-bold text-teal-700">Your stay at {prop.name} has ended</div><div className="text-[11px] text-teal-600">But there are 6 more properties to explore!</div></div></div>
                  </div>

                  {[
                    {icon:'🏠',name:'The Penthouse',meta:'🌟 You stayed here! • 2BR • Sleeps 6',desc:'Top-floor with fireplace, coffee bar, Aroma 360'},
                    {icon:'🌊',name:'Rustic Ozark Retreat',meta:'2BR • Sleeps 6 • Cozy mountain vibe',desc:'Keurig, Nest Thermostat, fireplace, deck'},
                    {icon:'🌳',name:'Woodland Retreat',meta:'2BR • Sleeps 6 • Bunk beds',desc:'Great for families! Mr. Coffee, bunk room'},
                    {icon:'✨',name:'Modern Charmer',meta:'1BR • Sleeps 4 • Sleek & stylish',desc:'Updated finishes, coffee bar, Pack \'n Play'},
                    {icon:'🦚',name:'Pretty Peacock',meta:'1BR • Sleeps 6 • No steps',desc:'Bottom floor, charging station, easy access'},
                    {icon:'🏡',name:'Branson Family Haven',meta:'3BR house • Sleeps 8 • Private yard',desc:'Standalone home, full kitchen, washer/dryer'},
                    {icon:'🏢',name:'Double Condo',meta:'Penthouse + Rustic • Sleeps 12+',desc:'🔥 Bundle & save! Two units, one booking'},
                  ].map((p,i) => (
                    <a key={i} href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener" className={`block bg-white rounded-lg px-3.5 py-3 mb-1 border no-underline text-inherit ${i===0?'border-l-4 border-sky-400':''}`}>
                      <div className="flex items-center gap-2"><span className="text-3xl">{p.icon}</span><div className="flex-1"><div className="text-[13px] font-bold text-sky-900">{p.name}</div><div className="text-[11px] text-sky-700">{p.meta}</div></div>
                        {i>0 && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-50 text-teal-700 whitespace-nowrap">Book Now</span>}</div>
                      <div className="text-[10px] text-teal-700 font-semibold mt-1 ml-9">{p.desc}</div>
                    </a>
                  ))}

                  <div className="bg-teal-50 rounded-lg px-3.5 py-3 my-2 border border-teal-200">
                    <div className="text-[12px] font-bold text-teal-800">💡 Bundle & Save</div>
                    <div className="text-[11px] text-teal-700 mt-1">Planning a family reunion or group trip? Book <strong>2+ units</strong> and save! All properties are in the same complex. Contact Brian for custom multi-unit pricing: <strong>314-565-0589</strong></div>
                  </div>
                </div>
              </>
            )}

            {/* Video Guides (show in guest mode) */}
            {mode === 'guest' && (
              <div className="px-3.5">
                <div className="font-serif text-base text-sky-900 pt-2 pb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>🎬 Video Guides</div>
                {prop.videos.map((v, i) => (
                  <a key={i} href={v.url} target="_blank" rel="noopener" className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 mb-0.5 border border-sky-100 no-underline text-inherit">
                    <span className="text-base">▶</span><span className="text-[12px] font-semibold text-sky-800">{v.title}</span>
                  </a>
                ))}
              </div>
            )}

            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener" className="block mx-3.5 my-2 rounded-xl px-3.5 py-3 flex items-center gap-2 no-underline" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
              <span className="text-3xl">🏠</span><div className="flex-1"><div className="text-sm font-bold text-sky-900">Book Your Next Stay</div><div className="text-[11px] text-teal-800">Direct booking • Best rates</div></div><span className="text-xl text-teal-800">›</span>
            </a>
          </>
        )}

        {/* ═══ ADVENTURE ═══ */}
        {tab === 'adventure' && (
          <>
            <div className="px-4 pt-3 pb-3" style={styles.bar}><h1 className="font-serif text-2xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Branson Adventures</h1><p className="text-[12px] mt-0.5 text-sky-200">Theme Parks • Coasters • Museums • Outdoors</p></div>
            {sectionTitle('⭐','Featured — Silver Dollar City')}
            <div className="mx-3.5 mb-1.5 rounded-xl px-3.5 py-3" style={styles.bar}>
              <div className="flex items-center gap-2"><span className="text-xl">🎢</span><h3 className="text-base font-bold text-white">Silver Dollar City</h3></div>
              <div className="text-[12px] mt-1 text-white leading-relaxed">America&apos;s #1 Theme Park! Outlaw Run, Time Traveler, Powder Keg, Mystic River Falls, Fire In The Hole. 12 min drive. Summer Celebration with extended hours!</div>
              <div className="flex gap-2 mt-2">
                <a href="https://www.silverdollarcity.com/" target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline" style={{ background: T.accentColor, color: '#ffffff' }}>🎫 Tickets</a>
                <a href="https://www.silverdollarcity.com/theme-park/attractions/rides/" target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline bg-white/20 text-white">🎢 Rides</a>
              </div>
            </div>
            {sectionTitle('🏔️','Mountain Coasters & Thrills')}
            {linkCard('https://theshepherdofthehills.com/coaster/','🎢','Copperhead Mountain Coaster','Longest in Branson! 3,350 ft',['a','3,350 ft'],'Control your speed down Branson\'s longest coaster. Zip lines, ropes course & observation tower too.')}
            {linkCard('https://www.bransonalpinemountaincoaster.com/','⛰️','Runaway Mountain Coaster','Branson Mountain Adventure Park',['b','Thrilling'],'Twisting mountain coaster through the Ozark hills. Control your own speed!')}
            {linkCard('https://www.bransontracks.com/','🏎️','The Track Family Fun Parks','Go-karts, mini golf, bumper boats',['g','Family'],'Multiple tracks for all ages. Classic and high-speed go-karts, plus arcade.')}
            {linkCard('https://www.fritzsadventure.com/','🌀','Fritz\'s Adventure','Indoor ropes, climbing, 3-story slide',['p','Indoor'],'Massive indoor adventure park. Ropes course, climbing walls, slides, laser maze. Great rainy day activity!')}
            {linkCard('https://www.wonderworksbranson.com/','🧪','WonderWorks','100+ exhibits, 6D ride, laser tag',['b','All Ages'],'Upside-down building! Hands-on science exhibits, bubble lab, astronaut training, and indoor ropes.')}
            {sectionTitle('🏛️','Museums & Attractions')}
            {linkCard('https://www.titanicbranson.com/','🚢','Titanic Museum','Walk the grand staircase!',['a','Top Rated'],'World\'s largest Titanic museum. Touch an iceberg, walk the halls, hear survivor stories.')}
            {linkCard('https://www.ripleys.com/branson/','🤯','Ripley\'s Believe It or Not!','Oddities & curiosities',['p','Fun'],'Hundreds of bizarre artifacts, interactive exhibits, and the famous Odditorium.')}
            {linkCard('https://www.hollywoodwaxentertainment.com/branson/','🌟','Hollywood Wax Museum','Meet the stars!',['b','Photo Ops'],'Lifelike wax figures of your favorite celebrities. Great Instagram moments.')}
            {linkCard('https://www.aquariumattheboardwalk.com/','🐠','Aquarium at the Boardwalk','Underwater tunnel!',['b','New!'],'Walk-through underwater tunnel. Jellyfish, sharks, stingrays, and touch pools.')}
            {linkCard('https://www.beyondthelens.com/','🔍','Beyond the Lens!','Pop culture + tech',['p','Interactive'],'Virtual reality, escape rooms, celebrity photo ops, and conspiracy theory exhibits.')}
            {sectionTitle('🌊','Nature & Outdoors')}
            {linkCard('https://dogwoodcanyon.org/','🌊','Dogwood Canyon Nature Park','10K acres • Waterfalls • Wildlife',['g','Must-See'],'Stunning Ozarks canyon with walking trails, waterfalls, bison herd, and trout fishing. Tram tours available.')}
            {linkCard('https://www.mostateparks.com/park/table-rock-state-park','🏞️','Table Rock State Park','Hiking • Swimming • Boating',['g','Free'],'Beautiful state park on Table Rock Lake. Marina, trails, picnic areas, and swim beach.')}
            {sectionTitle('🎡','Strip & Family Fun')}
            <div className="grid grid-cols-2 gap-2 px-3.5 pb-1.5">
              {[{e:'🎡',t:'Ferris Wheel',d:'The Boardwalk',l:'https://www.bransontracks.com/the-branson-ferris-wheel/'},{e:'⚡',t:'Xtreme Racing',d:'Indoor go-karts',l:'https://www.xtremeracingcenter.com/'},{e:'🌊',t:'White Water',d:'SDC water park!',l:'https://www.silverdollarcity.com/white-water/'},{e:'🚂',t:'Scenic Railway',d:'Scenic train ride',l:'https://www.bransontrain.com/'},{e:'🦋',t:'Butterfly Palace',d:'Live butterflies!',l:'https://www.thebutterflypalace.com/'},{e:'🥏',t:'Parakeet Pete\'s',d:'Zipline + balloon',l:'https://bransonlandingattractions.com/'}].map((x,i)=>(
                <a key={i} href={x.l} target="_blank" rel="noopener" className="block bg-white rounded-lg px-3 py-2.5 border border-sky-100 no-underline text-inherit"><div className="text-xl">{x.e}</div><div className="text-[13px] font-bold text-sky-900 mt-0.5">{x.t}</div><div className="text-[11px] text-sky-700">{x.d}</div></a>
              ))}
            </div>
            <div className="mx-3.5 my-2 bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
              <div className="text-[11px] text-teal-800 font-semibold">💡 Summer Tip: Buy SDC tickets online to skip the line. After 3 PM entry is discounted. Unlimited Summer Ticket: $99 for the whole season!</div>
            </div>
          </>
        )}

        {/* ═══ FISHING ═══ */}
        {tab === 'fishing' && (
          <>
            <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#0c4a6e,#0ea5e9)' }}><h1 className="font-serif text-2xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Branson Fishing Guide</h1><p className="text-[12px] mt-0.5 text-blue-300">Daily Report • Hot Spots • Guides • Tackle</p>
              <span className="inline-block text-[11px] mt-1 px-2 py-0.5 rounded-full bg-white/20 text-white">🎣 {todayFormatted}</span>
            </div>
            {sectionTitle('📊',"Today's Fishing Report")}
            <div className="mx-3.5 mb-1.5 rounded-xl px-3.5 py-3" style={{ background: 'linear-gradient(135deg,#0c4a6e,#0ea5e9)' }}>
              <div className="flex items-center gap-2"><span className="text-lg">🟢</span><h3 className="text-base font-bold text-white">Bite of the Day</h3></div>
              <div className="text-[12px] mt-1 text-blue-200 leading-relaxed">{fishingData?.biteOfDay || 'Taneycomo trout biting on pink worms below Fall Creek. Table Rock bass on topwater at dawn before the heat.'}</div>
              <div className="flex gap-3 mt-2 flex-wrap">
                <div className="text-[11px] text-blue-200"><strong className="text-yellow-300">Table Rock</strong><br />{fishingData?.conditions?.tableRock?.temp || '78°F'} • {fishingData?.conditions?.tableRock?.level || '916.9 ft'} • {fishingData?.conditions?.tableRock?.clarity || 'Clear'}</div>
                <div className="text-[11px] text-blue-200"><strong className="text-yellow-300">Taneycomo</strong><br />{fishingData?.conditions?.taneycomo?.temp || '50°F'} • {fishingData?.conditions?.taneycomo?.clarity || 'Very clear'}<br />{fishingData?.conditions?.taneycomo?.generation || 'Check SWPA schedule'}</div>
                <div className="text-[11px] text-blue-200"><strong className="text-yellow-300">Weather</strong><br />High {fishingData?.weather?.high || '96°F'}<br />Heat index {fishingData?.weather?.heatIndex || '105°F'}</div>
              </div>
              <div className="text-[10px] mt-2 text-blue-300/60">⚠️ Always check SWPA generation schedule before wading Taneycomo</div>
            </div>
            {sectionTitle('🐟','What\'s Biting & How')}
            <div className="px-3.5 grid grid-cols-2 gap-1.5">
              {[
                ['🎯','Bass','EXCELLENT','Topwater dawn/dusk, deep cranks, jigs 10-25ft, flutter spoons','g'],
                ['🐟','Crappie','FAIR','Standing timber 15-25ft, live minnows or jigs','b'],
                ['🐟','Walleye','GOOD','Deep points, channel swings, 30-50 fish trips','a'],
                ['🐟','Trout','GOOD-V.GOOD','Pink worms, 40+ fish days, Fall Creek to Cooper','r'],
                ['🐟','Bluegill','PEAK','10-20ft, live crickets, gravel areas','g'],
                ['🐟','Catfish','GOOD','River arms, cut bait, stink bait','b'],
              ].map(([e,t,s,d,c]) => (
                <div key={t} className="bg-white rounded-lg px-2.5 py-2 border border-sky-100">
                  <div className="flex items-center gap-1"><span className="text-sm">{e}</span><span className="text-[11px] font-bold text-sky-900">{t}</span><span className={`text-[9px] font-semibold px-1 py-0.5 rounded whitespace-nowrap ${c==='g'?'bg-green-50 text-teal-700':c==='r'?'bg-red-50 text-red-700':c==='b'?'bg-blue-50 text-blue-700':'bg-teal-50 text-teal-700'}`}>{s}</span></div>
                  <div className="text-[10px] text-sky-700 mt-0.5 leading-tight">{d}</div>
                </div>
              ))}
            </div>
            {sectionTitle('🏞️','Table Rock — Bass, Crappie, Walleye')}
            {linkCard('https://www.branson.com/activities/boat-ramps','🏞️','Indian Point Public Use Area','Shore fishing • 4 min • Closest!',['g','Closest'],'Free public access. Shore fishing and boat ramp. Best for bass and crappie.')}
            {linkCard('https://rocklane.com/table-rock-lake-fishing/','🌊','Aunts Creek Access','Dock & shore • Bass/Crappie',['b','Dock'],'Public dock and shore access. Good for bass, crappie, and bluegill.')}
            {linkCard('https://mdc.mo.gov/discover-nature/places/viney-creek-access','🤫','Viney Creek Access','Quiet • Off the beaten path • 15 min',['a','🤫 Secret'],'Hidden gem! Less crowded, great for kayak and shore fishing. Local favorite.')}
            {linkCard('https://mostateparks.com/park/table-rock-state-park','🏞️','Table Rock State Park','Marina • Ramp • Swim beach',['g','State Park'],'Full-service marina, 5-lane boat ramp, campground, and swimming beach on Table Rock.')}
            {sectionTitle('💧','Lake Taneycomo — Trout')}
            {linkCard('https://www.fallcreekrvcampground.com/','🎣','Fall Creek Marina & Trout Dock','500-ft dock • Trout • 8 min',['r','🔥 Hot'],'Your go-to for trout! Free fishing dock, tackle shop, bait, rentals. 40+ fish days possible.')}
            {linkCard('https://mdc.mo.gov/discover-nature/places/cooper-creek-access','🤫','Cooper Creek Access','ADA dock • Quiet • 10 min',['a','🤫 Secret'],'Accessible fishing dock. Less pressure than Fall Creek. Trophy trout potential.')}
            {linkCard('https://mdc.mo.gov/discover-nature/places/table-rock-dam','💧','Table Rock Dam Tailwaters','Best trout water • Wade access',['r','Trophy'],'The dam tailwaters below Table Rock Dam. World-class trout fishing. Check generation schedule!')}
            {linkCard('https://bransonlandingattractions.com/','🏙️','Branson Landing Boardwalk','Dock fishing • Downtown',['b','Urban'],'Fish right off the boardwalk downtown! Stocked rainbows eager to bite. Great for kids and casual anglers.')}
            {sectionTitle('🛶','Guide Services')}
            {linkCard('https://captainbguide.com/','🎣','Captain B Guide Service','Trout specialist • Brian\'s buddy!',['r','🔥 Pick'],'Top-notch Taneycomo trout fishing with Captain B. Tell him Summers Vacations sent you!')}
            {linkCard('https://bransonguidedfishingtrips.com/','🐟','Branson Guided Fishing Trips','USCG licensed • Bass & Trout',['b','Licensed'],'Full-time professional guides for Table Rock and Taneycomo. All equipment provided.')}
            {linkCard('https://www.focusedfishing.com/','🎯','Focused Fishing Guide Service','Full-time pro • Multi-species',['g','Pro'],'Year-round guide service. Bass, crappie, walleye, and trout trips available.')}
            {sectionTitle('🪱','Bait & Tackle')}
            {linkCard('https://www.basspro.com/shop/en/bass-pro-shops-branson','🦌','Bass Pro Shops — Branson Landing','Full fishing dept • An experience!',['r','🔥 Must'],'Legendary outdoor store with aquarium, waterfall & arcade. Everything you need plus a museum experience.')}
            {linkCard('https://www.fallcreekrvcampground.com/','🪱','Fall Creek Marina Tackle','Live bait • Licenses • 8 min',['b','Local'],'Right on Taneycomo. Live bait, tackle, fishing licenses, and local advice.')}
            {linkCard('https://www.lilleyslanding.com/','🏕️','Lilley\'s Landing','Resort • Guide service • Pro shop',['g','Resort'],'Full-service fishing resort on Taneycomo. Pro shop, guides, and lodging available.')}
            <div className="mx-3.5 my-2 bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
              <div className="text-[11px] font-bold text-teal-800">🎫 Missouri fishing license required for ages 16-64. Get one at any tackle shop or mdc.mo.gov. Trout permit also required for Taneycomo.</div>
            </div>
            <div className="mx-3.5 mb-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
              <div className="text-[11px] text-blue-800"><strong>💡 Summer Tip:</strong> {fishingData?.tip || 'Fish early mornings before the heat. Table Rock topwater bite is best at sunrise. Taneycomo has no-generation windows until 1-2 PM — perfect for wading.'}</div>
            </div>
          </>
        )}

        {/* ═══ SHOWS ═══ */}
        {tab === 'shows' && (
          <>
            <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}><h1 className="font-serif text-2xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Branson Shows</h1><p className="text-[12px] mt-0.5 text-purple-300">40+ Shows • Music • Comedy • Dinner • Magic</p>
              <span className="inline-block text-[11px] mt-1 px-2 py-0.5 rounded-full bg-white/20 text-white">🎭 {todayFormatted}</span>
            </div>
            {sectionTitle('🎤','Country & Variety')}
            {linkCard('https://www.grandcountrylivemusic.com/grand-jubilee','🎸','Grand Jubilee','7:30 PM • Grand Country • $39+',['a','Classic'],'Branson\'s longest-running show! High-energy variety with comedy & live band.')}
            {linkCard('https://presleys.com/','🎵','Presleys\' Country Jubilee','8 PM • Presleys\' Theatre',['a','Legacy'],'50+ year Branson tradition! Country music, comedy, and gospel. The show that started it all.')}
            {linkCard('https://www.themansiontheatre.com/','🤠','Clay Cooper\'s Country Express','7:30 PM • Clay Cooper Theatre',['b','Variety'],'High-energy country variety with comedy, dancing, and 20+ performers.')}
            {linkCard('https://thehaygoods.com/','🎻','The Haygoods','8 PM • Clay Cooper Theatre • $42+',['p','Family'],'6 siblings, 20+ genres, incredible music & dancing. A Branson powerhouse.')}
            {linkCard('https://www.hughesbrotherstheatre.com/','👨‍👩‍👦','Hughes Music Show','8 PM • Hughes Brothers Theatre',['b','Family'],'The Hughes Brothers & family — stunning harmonies and variety entertainment.')}
            {linkCard('https://www.piercearrowshow.com/','🎤','Pierce Arrow','8 PM • Reza Live Theatre',['a','Country'],'Country music, comedy, and the legendary low bass voice.')}
            {linkCard('https://www.sixshow.com/','🎵','SIX','8 PM • Multiple venues',['p','Unique'],'6 brothers — all vocals, no instruments. Viral sensation with incredible harmonies.')}
            {sectionTitle('🎸','Tribute Shows')}
            {linkCard('https://www.themansiontheatre.com/','🎤','Bohemian Queen','8 PM • Clay Cooper • $45+',['r','🔥 Hot'],'The ultimate Freddie Mercury tribute! Full costume changes & all the Queen hits.')}
            {linkCard('https://www.legendsinconcert.com/branson/','🌟','Legends in Concert','3 PM & 8 PM • Legends Theater',['a','Iconic'],'World-famous tribute show! Multiple artists per show — Elvis, Garth, Abba & more.')}
            {linkCard('https://hamnervarietytheater.com/','🕺','Back to the Bee Gees','5 PM • Hamner Variety • 🆕 NEW!',['p','Disco'],'Brand new show! Disco tribute — Stayin\' Alive & all the hits.')}
            {linkCard('https://www.elvisdean z.com/','🕺','Dean Z — Ultimate Elvis','2 PM • Multiple venues',['a','Elvis'],'The world\'s best Elvis tribute artist. Authentic costumes and voice.')}
            {sectionTitle('🎪','Spectaculars & Acrobats')}
            {linkCard('https://www.sight-sound.com/','🎭','Sight & Sound — DAVID','3:30 & 7:30 PM • Sight & Sound',['b','⭐ 4.8'],'Epic biblical production! Massive sets, live animals, incredible storytelling.')}
            {linkCard('https://www.shepherdofthehills.com/','🤠','Shepherd\'s Wild West Showdown','7:30 PM • Shepherd of the Hills',['g','Action'],'Stunt show! Trick riding, gunfights, and comedy western action.')}
            {linkCard('https://www.acrobatsofchina.com/','🤸','Amazing Acrobats — Shanghai Circus','2 & 7:30 PM',['p','Wow!'],'Mind-blowing Chinese acrobatics, contortion, and aerial acts.')}
            {sectionTitle('🍽️','Dinner Shows')}
            {linkCard('https://www.dollypartonsstampede.com/branson/','🐴',"Dolly Parton's Stampede",'5:30 & 8 PM • $60+',['a','Iconic'],'4-course feast with 32 horses, trick riding, and musical spectacle.')}
            {linkCard('https://www.shepherdofthehills.com/','🍗','Chuckwagon Dinner Show','5 PM • Shepherd of the Hills',['g','Western'],'Cowboy supper + live country music and comedy show.')}
            {linkCard('https://showboatbransonbelle.com/','🚢','Showboat Branson Belle','Dinner cruise on Table Rock',['b','Lake'],'2-hour cruise + meal + live show on a 700-seat paddle wheeler.')}
            {sectionTitle('🎭','Comedy & Magic')}
            {linkCard('https://www.illusionistrickthomas.com/','🪄','Rick Thomas — Mansion of Dreams','2 PM • Mansion Theatre',['p','Magic'],'Vegas-level illusionist! Award-winning magic, comedy, and grand illusions.')}
            {linkCard('https://www.grandcountry.com/branson-shows/comedy-jamboree/','😂','Comedy Jamboree','3 & 7:30 PM • Grand Country',['g','Funny'],'Slapstick comedy, music, and family-friendly laughs.')}
            {sectionTitle('🎪','More Experiences')}
            {linkCard('https://www.bransontrain.com/','🚂','Branson Dinner Trains','Evenings • Apr–Oct',['a','Unique'],'4-course dinner on a vintage train through the Ozark foothills.')}
            {linkCard('https://www.bransonducktours.com/','🦆','Branson Duck Tours','Hourly 10 AM–5 PM',['g','Fun'],'Amphibious vehicle tour — land AND water! Splash into Table Rock Lake.')}
            {linkCard('https://www.thefreedomencounter.com/','🇺🇸','Freedom Journey Experience','Ongoing • Freedom Encounter',['b','Patriotic'],'Immersive walk-through experience of America\'s founding.')}
            <div className="mx-3.5 my-2 bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
              <div className="text-[11px] text-teal-800 font-semibold">🎵 FREE Summer Concerts at Branson Landing — next show Aug 8! Jukebox Winos & Chris Luneau. Waterfront stage, 7-10 PM.</div>
            </div>
            <div className="mx-3.5 mb-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
              <div className="text-[11px] text-purple-800"><strong>💡 Pro Tip:</strong> Most shows run Tue–Sat. Book 2-3 days ahead for best seats. Matinees (2-3 PM) are less crowded. Children under 12 often free or discounted.</div>
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
              <div className="text-[11px] mt-1 text-yellow-300 px-2 py-1 rounded bg-black/20 leading-relaxed">🤯 Fun Fact: The first tee drops 130+ ft — that&apos;s a 13-story building!</div>
              <div className="flex gap-2 mt-1 flex-wrap"><span className="text-[11px]"><strong className="text-yellow-300">Rates</strong> $235–$265</span><span className="text-[11px]"><strong className="text-yellow-300">15 min</strong></span><span className="text-[11px]"><strong className="text-yellow-300">Par 72</strong> 7,000 yds</span></div>
              <div className="flex gap-2 mt-2">
                <a href="https://bransonhillsgolfclub.com/" target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline" style={{ background: '#f5c842', color: '#ffffff' }}>📅 Book Tee Time</a>
                <a href="https://bransonhillsgolfclub.com/rates/" target="_blank" rel="noopener" className="text-[11px] font-semibold px-3 py-1.5 rounded-md no-underline bg-white/20 text-white">💰 Rates</a>
              </div>
            </div>
            {sectionTitle('🏌️','All Courses')}
            {linkCard('https://bigcedar.com/golf/paynes-valley/','⭐',"Payne's Valley — Big Cedar",'Tiger Woods • 12 min • $425+',['r','Premium'],'#1 USA TODAY 2026! Tiger\'s first public design. Bonus 19th island green.')}
            {linkCard('https://bigcedar.com/golf/ozarks-national/','🌊','Ozarks National — Big Cedar','Coore & Crenshaw • Top 100',['a','Top 100'])}
            {linkCard('https://bigcedar.com/golf/buffalo-ridge/','🏔️','Buffalo Ridge Springs','Tom Fazio • Top 100',['a','Top 100'])}
            {linkCard('https://www.ledstonegolf.com/','⛳','Ledgestone Country Club','Public • 5 min • $70–$160',['g','Closest'],'Award-winning mountain golf just 5 min from the condo!')}
            {linkCard('https://bransonhillsgolfclub.com/','🏆','Branson Hills Golf Club','#1 in MO • 15 min • $235+',['a','Top Rated'])}
            {linkCard('https://bigcedar.com/golf/top-of-the-rock/','⛰️','Top of the Rock — Big Cedar','Tom Watson par 3 • $135+',['b','⭐ 4.5'])}
            {linkCard('https://bigcedar.com/golf/cliffhangers/','🧗','Cliffhangers at Big Cedar','Jack Nicklaus par 3 • $225+',['p','Nicklaus'])}
            {linkCard('https://www.thousandhillsresorthotel.com/','🏙️','Thousand Hills Golf Resort','Resort course • $50–$90',['g','Budget'])}
            {linkCard('https://holidayhills.com/','🌄','Holiday Hills Golf Club','Public • $40–$70',['g','Great Value'])}
            {linkCard('https://bigcedar.com/golf/mountain-top/','🥾','Mountain Top — Big Cedar','Walking only • 13 holes • $100+',['p','Unique'])}
            <div className="mx-3.5 my-2 bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
              <div className="text-[11px] text-teal-800 font-semibold">💡 Weekday tee times save $50-100+. Book 30 days ahead for Big Cedar courses.</div>
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
            {sectionTitle('🌊','Big Cedar Lodge Dining')}
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
                <a key={i} href={x.l} target="_blank" rel="noopener" className="block bg-white rounded-lg px-3 py-2.5 border border-sky-100 no-underline text-inherit"><div className="text-xl">{x.e}</div><div className="text-[13px] font-bold text-sky-900 mt-0.5">{x.t}</div><div className="text-[11px] text-sky-700">{x.d}</div></a>
              ))}
            </div>
          </>
        )}

        {/* ═══ CONTACT ═══ */}
        {tab === 'contact' && (
          <>
            <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#0c4a6e,#0ea5e9)' }}>
              <h1 className="font-serif text-2xl text-yellow-300" style={{ fontFamily: "'DM Serif Display', serif" }}>Contact Your Host</h1>
              <p className="text-[12px] mt-0.5 text-sky-200">Brian Summers — here to help 24/7</p>
            </div>
            <div className="mx-3.5 mt-3 rounded-xl px-4 py-5 text-center" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
              <div className="text-5xl mb-2">📞</div>
              <div className="text-[13px] font-semibold uppercase tracking-wider text-teal-800">Call or Text Anytime</div>
              <a href="tel:3145650589" className="block text-3xl font-extrabold text-stone-900 mt-1 no-underline tracking-wider">314-565-0589</a>
              <div className="text-[12px] mt-2 text-teal-800">Feel free to reach out with any questions, issues, or if you need anything during your stay. I'm here to make your vacation great!</div>
            </div>
            <div className="mx-3.5 mt-2 bg-white rounded-xl px-4 py-3 border border-sky-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✉️</span>
                <a href="mailto:summersvacationsllc@gmail.com" className="text-[13px] font-semibold text-blue-600">summersvacationsllc@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">👨‍🚒</span>
                <div className="text-[12px] text-sky-900">Brian Summers — Firefighter/Paramedic, {new Date().getFullYear() - 2000} years. Your safety and comfort are my priority.</div>
              </div>
            </div>
            <div className="mx-3.5 my-2 bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
              <div className="text-[11px] text-teal-800">💡 For emergencies, call 911 first. For urgent but non-life-threatening issues, the urgent care info is in the Guide tab under Emergency Info.</div>
            </div>
          </>
        )}

      </div>

        {/* ═══ CHECKOUT ═══ */}
        {tab === 'checkout' && (
          <>
            <div className="px-4 pt-3 pb-3" style={{ background: 'linear-gradient(135deg,#0c4a6e,#0ea5e9)' }}>
              <h1 className="font-serif text-2xl text-yellow-300" style={{ fontFamily: "'DM Serif Display', serif" }}>Checkout</h1>
              <p className="text-[12px] mt-0.5 text-sky-200">Safe travels — we hope you enjoyed your stay!</p>
            </div>
            <div className="mx-3.5 mt-3 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              <div className="text-[13px] font-bold text-red-700">⏰ Checkout by 10:00 AM</div>
              <div className="text-[11px] text-red-600 mt-0.5">Late checkout is rarely possible if guests are arriving that day. Please plan ahead!</div>
            </div>
            <div className="mx-3.5 mt-2 text-[12px] text-sky-900 uppercase tracking-wider font-semibold">Before you leave:</div>
            {[
              { icon: '🛏️', title: 'Leave beds unmade', body: 'No need to strip the sheets — just leave them as-is. If you used the sleeper sofa, leave the cushions off the couch.' },
              { icon: '🛁', title: isHaven ? 'Towels in downstairs bathroom' : 'Towels on bathroom floor', body: isHaven ? 'Place used towels in the downstairs front bathroom shower floor.' : 'Place used towels on the hallway bathroom shower floor.' },
              { icon: '🗑️', title: 'Take trash to dumpster', body: isHaven ? 'Take all trash to the dumpster.' : 'Take all trash to the dumpster located in front of the building to the left.' },
              { icon: '🍽️', title: isHaven ? 'Start the dishwasher' : 'Wash and dry dishes', body: isHaven ? 'Put any remaining dishes in the dishwasher and start a cycle.' : 'Please hand wash any remaining dishes and leave them to dry. Our staff will put them away.' },
              { icon: '💡', title: 'Turn everything off', body: 'Turn off the stove, heater, lights, and all electronics.' },
              { icon: '🪑', title: 'Move furniture back', body: 'Return any furniture or items you moved back to their original locations.' },
              { icon: '🔒', title: 'Lock all doors & windows', body: 'Check every door and window to make sure theyâre locked before you leave.' },
            ].map((item, i) => (
              <div key={i} className="mx-3.5 mt-2 bg-white rounded-lg px-3 py-2.5 border border-sky-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <div className="text-[13px] font-bold text-sky-900">{item.title}</div>
                </div>
                <div className="text-[11px] text-sky-900 mt-0.5 ml-7">{item.body}</div>
              </div>
            ))}
            <div className="mx-3.5 mt-3 mb-2 bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
              <div className="text-[12px] text-teal-800 font-semibold">⭐ Leave us a review!</div>
              <div className="text-[11px] text-teal-700 mt-0.5">VRBO and Airbnb will send you a review request. If you can't give us 5 stars, please let us know why — your feedback helps our next guests have a great stay!</div>
            </div>
            <div className="text-center pb-4">
              <div className="text-[12px] text-sky-200">Thank you for staying with us!</div>
              <div className="text-[11px] text-sky-700 mt-0.5">— Brian & Chantel Summers</div>
            </div>
          </>
        )}

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
          {tabBtn('contact','M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z','Contact')}
          {tabBtn('checkout','M9 5l7 7-7 7','Checkout')}
        </div>
      </div>
    </div>
  );
}