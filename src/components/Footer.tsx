import { Phone, Mail } from "lucide-react";
import Link from "next/link";
import { BOOK_URL, PHONE, PHONE_HREF, EMAIL, FACEBOOK } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-[#0c4a6e] text-sky-100 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-sm">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={PHONE_HREF}
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors no-underline"
            >
              <Phone size={14} />
              {PHONE}
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors no-underline"
            >
              <Mail size={14} />
              {EMAIL}
            </a>
            <a
              href={FACEBOOK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors no-underline"
            >
              Facebook
            </a>
            <Link
              href="/reports"
              className="hover:text-amber-300 transition-colors no-underline"
            >
              Daily Reports
            </Link>
          </div>
          <a
            href={BOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book px-5 py-2 rounded-full text-sm no-underline"
          >
            Book Your Stay
          </a>
        </div>
        <div className="mt-6 text-center text-xs text-sky-400">
          &copy; {new Date().getFullYear()} Summers Vacations LLC · My Branson
          Vacation
        </div>
      </div>
    </footer>
  );
}
