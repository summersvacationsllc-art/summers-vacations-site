import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "My Branson Vacation | Family Condos Near Table Rock Lake",
  description:
    "Warm, local hosting for your Branson family vacation. Clean condos near Silver Dollar City, Table Rock Lake, and the Strip — we take care of everything so you can just have fun.",
  openGraph: {
    title: "My Branson Vacation | Family Condos Near Table Rock Lake",
    description:
      "High-value Branson stays with a local host who truly looks after your family. Book your adventure today.",
    type: "website",
    locale: "en_US",
    siteName: "My Branson Vacation",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${fraunces.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col font-sans">{children}</body>
    </html>
  );
}
