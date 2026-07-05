import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE, organizationLd, websiteLd } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { title: SITE.name, description: SITE.description, url: SITE.url, siteName: SITE.name, type: "website" },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
};

export const viewport = { themeColor: "#234835" };

// Stacked-block mark: reads as a small retaining wall, not a generic letter tile.
function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="shrink-0">
      <rect x="1" y="15" width="24" height="4" rx="1" fill="#234835" />
      <rect x="3" y="10" width="20" height="4" rx="1" fill="#2a5741" />
      <rect x="5" y="5" width="16" height="4" rx="1" fill="#356a4f" />
      <path d="M2 22h22" stroke="#a4562a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-slate-900">
          <Mark />
          Slope<span className="text-emerald-700">ify</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium text-slate-600 sm:gap-2">
          <Link href="/calculators" className="rounded-md px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900">Calculators</Link>
          <Link href="/states" className="hidden rounded-md px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 sm:inline-block">By state</Link>
          <Link href="/blog" className="rounded-md px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900">Guides</Link>
          <Link href="/find-a-pro" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-800">Find a pro</Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-slate-500">
        <div className="grid gap-6 sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900"><Mark />Slope<span className="text-emerald-700">ify</span></div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Code-based retaining wall design, cost and permit planning.</p>
          </div>
          <FooterCol title="Calculators" links={[
            ["Wall designer", "/"],
            ["Cost", "/calculators/retaining-wall-cost-calculator"],
            ["Block count", "/calculators/retaining-wall-blocks-calculator"],
            ["Base width", "/calculators/retaining-wall-base-calculator"],
          ]} />
          <FooterCol title="Learn" links={[
            ["Guides", "/blog"],
            ["How it works", "/methodology"],
            ["Permits by state", "/states"],
          ]} />
          <FooterCol title="Get help" links={[
            ["Find a pro", "/find-a-pro"],
            ["Pro report", "/pricing"],
          ]} />
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-slate-500">
          {SITE.name} gives simplified, code-based planning estimates (IBC Tables 1610.1 and 1806.2,
          Rankine earth pressure). A retaining wall over 4 ft, or any wall with a surcharge, needs an
          engineered, stamped design and a local permit. Always confirm with a licensed engineer and your
          building department. Some outbound links are affiliate or referral links.
        </p>
        <p className="mt-3 text-xs text-slate-400">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">{title}</div>
      <ul className="mt-2 space-y-1.5">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="hover:text-slate-900">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd()) }} />
        <Header />
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
