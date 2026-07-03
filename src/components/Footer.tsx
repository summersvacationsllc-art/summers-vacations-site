import { Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-800 text-stone-300 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <a
              href="tel:+13145650589"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone size={14} />
              +1 314-565-0589
            </a>
            <a
              href="mailto:summersvacationsllc@gmail.com"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail size={14} />
              summersvacationsllc@gmail.com
            </a>
          </div>
          <a
            href="https://www.facebook.com/summersvacations/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073C0 18.11 4.388 23.242 10.125 24V15.56H7.078v-3.487h3.047V9.458c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.487h-2.796V24C19.612 23.242 24 18.11 24 12.073z" />
            </svg>
            Facebook
          </a>
        </div>
      </div>
    </footer>
  );
}
