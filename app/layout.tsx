import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: SITE.name, description: SITE.description, url: SITE.url, siteName: SITE.name, type: "website" },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
};

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-700 text-sm text-white">R</span>
          RetainCalc<span className="text-emerald-700">HQ</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate-600">
          <Link href="/calculators" className="hover:text-slate-900">Calculators</Link>
          <Link href="/states" className="hidden hover:text-slate-900 sm:inline">By state</Link>
          <Link href="/blog" className="hover:text-slate-900">Guides</Link>
          <Link href="/pricing" className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-700">Pro</Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-8 text-sm text-slate-500">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="hover:text-slate-900">Wall designer</Link>
          <Link href="/calculators/retaining-wall-cost-calculator" className="hover:text-slate-900">Cost</Link>
          <Link href="/calculators/retaining-wall-blocks-calculator" className="hover:text-slate-900">Block count</Link>
          <Link href="/calculators/retaining-wall-base-calculator" className="hover:text-slate-900">Base width</Link>
          <Link href="/blog" className="hover:text-slate-900">Guides</Link>
          <Link href="/methodology" className="hover:text-slate-900">How it works</Link>
          <Link href="/pricing" className="hover:text-slate-900">Pro / design report</Link>
        </div>
        <p className="mt-4 max-w-2xl text-xs text-slate-400">
          {SITE.name} gives simplified, code-based planning estimates (IBC Tables 1610.1 &amp; 1806.2,
          Rankine earth pressure). A retaining wall over 4 ft, or any wall with a surcharge, requires an
          engineered, stamped design and a local permit. Always confirm with a licensed engineer and your
          building department. © {new Date().getFullYear()} {SITE.name}.
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Header />
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
