import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { SiteNav } from "@/components/nav/SiteNav";
import { SiteFooter } from "@/components/nav/SiteFooter";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ludi — Every game. Every store. One place.",
  description:
    "Aggregate videogame metadata, prices, and your personal library in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface">
        <SmoothScroll />
        <Suspense
          fallback={<header className="h-14 border-b border-hairline bg-elevated" />}
        >
          <SiteNav />
        </Suspense>
        {/* No container here — pages opt into `shell` so heroes and feature
            bands can run full-bleed the way the prototype does. */}
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
