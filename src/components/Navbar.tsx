"use client";

import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BOOK_URL, FACEBOOK } from "@/lib/site";

const NAV_ITEMS = [
  { label: "Stays", href: "/#stays" },
  { label: "Adventures", href: "/#adventures" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-sky-100"
          : "bg-white/90 backdrop-blur-md border-b border-sky-100/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          <Link href="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md bg-gradient-to-br from-[#0c4a6e] to-[#0ea5e9]">
              MB
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold text-[#0c4a6e] tracking-tight group-hover:text-[#0ea5e9] transition-colors">
                My Branson Vacation
              </div>
              <div className="text-[10px] font-semibold text-teal-600 tracking-wide uppercase hidden sm:block">
                We take care of you
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-[#0c4a6e] hover:bg-sky-50 transition-colors no-underline"
              >
                {item.label}
              </a>
            ))}
            <a
              href={FACEBOOK}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 p-2 rounded-lg text-slate-500 hover:text-[#0ea5e9] hover:bg-sky-50 transition-colors"
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073C0 18.11 4.388 23.242 10.125 24V15.56H7.078v-3.487h3.047V9.458c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.487h-2.796V24C19.612 23.242 24 18.11 24 12.073z" />
              </svg>
            </a>
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-book ml-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm no-underline"
            >
              Book Your Stay
              <ArrowRight size={15} strokeWidth={2.5} />
            </a>
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-[#0c4a6e] hover:bg-sky-50 transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-sky-100 px-4 py-3">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-[#0c4a6e] hover:bg-sky-50 rounded-lg no-underline"
            >
              {item.label}
            </a>
          ))}
          <a
            href={BOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book block px-3 py-2.5 text-sm text-center rounded-full mt-2 no-underline"
          >
            Book Your Stay
          </a>
        </div>
      )}
    </header>
  );
}
