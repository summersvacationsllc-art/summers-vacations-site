import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Summers Vacations LLC | Branson Condo Rentals",
  description:
    "Offering you the highest quality guest experience. Short-term condo rentals in Branson, Missouri.",
  openGraph: {
    title: "Summers Vacations LLC | Branson Condo Rentals",
    description:
      "Offering you the highest quality guest experience. Short-term condo rentals in Branson, Missouri.",
    type: "website",
    locale: "en_US",
    siteName: "Summers Vacations LLC",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
