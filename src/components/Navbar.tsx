"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "About", href: "#about" },
  { label: "Gallery", href: "#gallery" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Buttons", href: "#buttons" },
  { label: "Contact", href: "#contact" },
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
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a
            href="/"
            className={`font-semibold text-lg tracking-tight transition-colors ${
              scrolled ? "text-stone-800" : "text-white"
            }`}
          >
            Summers Vacations LLC
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  scrolled
                    ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </a>
            ))}
            <a
              href="https://www.facebook.com/summersvacations/"
              target="_blank"
              rel="noopener noreferrer"
              className={`ml-2 p-2 rounded-lg transition-colors ${
                scrolled
                  ? "text-stone-500 hover:text-blue-600 hover:bg-blue-50"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073C0 18.11 4.388 23.242 10.125 24V15.56H7.078v-3.487h3.047V9.458c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.487h-2.796V24C19.612 23.242 24 18.11 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://notchcondos.guestywebsites.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-400/35 hover:-translate-y-0.5"
            >
              Book Now
            </a>
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-stone-600" : "text-white"
            }`}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg"
            >
              {item.label}
            </a>
          ))}
          <a
            href="https://notchcondos.guestywebsites.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2.5 text-sm font-semibold text-center text-white bg-amber-500 rounded-lg mt-2"
          >
            Book Now
          </a>
        </div>
      )}
    </header>
  );
}
