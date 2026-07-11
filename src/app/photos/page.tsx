"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface CatalogPhoto {
  url: string;
  thumb: string;
  title: string;
  category: string;
  source: string;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<CatalogPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("All");
  const [lightbox, setLightbox] = useState<CatalogPhoto | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/photos-catalog.json");
        const d = await r.json();
        setPhotos(d);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(photos.map(p => p.category));
    return ["All", ...Array.from(cats)];
  }, [photos]);

  const filtered = photos.filter(p => {
    if (selectedCat !== "All" && p.category !== selectedCat) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-stone-950">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <span className="text-sm font-bold text-white">Photo Catalog</span>
          </Link>
          <span className="text-[11px] text-stone-500">{photos.length} photos</span>
        </div>
        <div className="border-t border-stone-800 px-4 py-2">
          <input type="text" placeholder="Search photos..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-400" />
        </div>
        <div className="overflow-x-auto border-t border-stone-800">
          <div className="flex gap-1 px-4 py-2">
            {categories.slice(0, 20).map(cat => (
              <button key={cat} onClick={() => setSelectedCat(cat)}
                className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border-none cursor-pointer transition-colors whitespace-nowrap ${
                  selectedCat === cat ? 'bg-amber-400 text-stone-900' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}>
                {cat.length > 30 ? cat.slice(0, 30) + "…" : cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-500">No photos match</div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {filtered.map((photo, i) => (
              <div key={i} className="break-inside-avoid bg-stone-900 rounded-xl overflow-hidden border border-stone-800 hover:border-amber-500/30 transition-colors cursor-pointer group"
                onClick={() => setLightbox(photo)}>
                <img src={photo.thumb} alt={photo.title} loading="lazy"
                  className="w-full block group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="p-2.5">
                  <div className="text-[11px] font-semibold text-stone-300 leading-tight">{photo.title}</div>
                  <div className="text-[9px] text-stone-500 mt-1">{photo.source}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl font-bold z-10 bg-stone-800/50 w-10 h-10 rounded-full flex items-center justify-center">✕</button>
          <img src={lightbox.url} alt={lightbox.title}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <div className="text-sm font-semibold text-white">{lightbox.title}</div>
            <div className="text-xs text-stone-400 mt-1">{lightbox.source} · {lightbox.category}</div>
            <a href={lightbox.url} target="_blank" rel="noopener"
              className="inline-block mt-2 text-xs font-semibold text-amber-400 no-underline hover:text-amber-300">Open full size →</a>
          </div>
        </div>
      )}
    </main>
  );
}
