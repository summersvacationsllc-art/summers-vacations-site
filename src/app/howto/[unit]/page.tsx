import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllGuidebookSlugs, getGuidebook } from "@/data/guidebooks";
import { videosForUnit } from "@/lib/howto";

type Props = { params: Promise<{ unit: string }> };

export function generateStaticParams() {
  return getAllGuidebookSlugs().map((unit) => ({ unit }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { unit } = await params;
  const gb = getGuidebook(unit);
  return {
    title: gb ? `How-to · ${gb.name}` : "How-to videos",
    description: gb ? `How-to videos for ${gb.name}.` : "Unit how-to videos.",
  };
}

export default async function HowToUnitPage({ params }: Props) {
  const { unit } = await params;
  const gb = getGuidebook(unit);
  if (!gb) notFound();
  const videos = videosForUnit(unit);

  return (
    <main className="min-h-dvh bg-[#f0f9ff] text-[#0c4a6e] px-4 py-8">
      <div className="mx-auto max-w-lg">
        <Link href="/howto" className="text-sm font-semibold text-[#0369a1]">
          ← All homes
        </Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">How-to videos</p>
        <h1 className="mt-2 font-serif text-4xl leading-none">{gb.name}</h1>
        <p className="mt-3 text-[#0369a1]">Tap a card to watch on YouTube. These are the walkthroughs for this home.</p>
        {videos.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-[#bae6fd] bg-white p-4">
            No how-to videos loaded for this home yet.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {videos.map((v) => (
              <li key={v.id}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-2xl border border-[#bae6fd] bg-white shadow-[0_10px_24px_-18px_rgba(2,132,199,.55)]"
                >
                  <div className="relative aspect-video bg-[#e0f2fe]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#dc2626] text-2xl text-white">
                      ▶
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <b className="text-[#0c4a6e]">{v.title}</b>
                    <div className="text-sm text-[#0369a1]">Watch on YouTube</div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
