import type { Metadata } from "next";
import Link from "next/link";
import { howtoUnits } from "@/lib/howto";

export const metadata: Metadata = {
  title: "How-to videos · My Branson Vacation",
  description: "Unit-specific how-to videos for Summers Vacations homes in Branson.",
};

export default function HowToIndexPage() {
  const units = howtoUnits();
  return (
    <main className="min-h-dvh bg-[#f0f9ff] text-[#0c4a6e] px-4 py-8">
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">mybransonvacation.com</p>
        <h1 className="mt-2 font-serif text-4xl leading-none text-[#0c4a6e]">How-to videos</h1>
        <p className="mt-3 text-[#0369a1]">Pick your home. Each link is that unit&apos;s YouTube walkthroughs — coffee, laundry, fireplace, and more.</p>
        <ul className="mt-6 space-y-3">
          {units.map((u) => (
            <li key={u.slug}>
              <Link
                href={`/howto/${u.slug}`}
                className="block rounded-2xl border border-[#bae6fd] bg-white px-4 py-4 shadow-[0_10px_24px_-18px_rgba(2,132,199,.55)]"
              >
                <b className="block text-lg text-[#0c4a6e]">{u.name}</b>
                <span className="text-sm text-[#0369a1]">{u.count} video{u.count === 1 ? "" : "s"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
