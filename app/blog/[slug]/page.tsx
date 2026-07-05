import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, postBySlug } from "@/lib/posts";
import { SITE, breadcrumbLd } from "@/lib/site";

export const revalidate = 604800; // 1 week ISR

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = postBySlug(slug);
  if (!p) return {};
  return { title: p.title, description: p.description, alternates: { canonical: `/blog/${p.slug}` } };
}

// Inline bold + links → safe JSX (no dangerouslySetInnerHTML).
function inline(text: string, k: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|`(.+?)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${k}-b${i}`}>{m[1]}</strong>);
    else if (m[2]) out.push(<Link key={`${k}-l${i}`} href={m[3]} className="text-emerald-700 hover:underline">{m[2]}</Link>);
    else if (m[4]) out.push(<code key={`${k}-c${i}`} className="rounded bg-slate-100 px-1 text-sm">{m[4]}</code>);
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function render(body: string) {
  const blocks = body.split("\n\n");
  const nodes: React.ReactNode[] = [];
  blocks.forEach((block, bi) => {
    const lines = block.split("\n");
    if (lines[0].startsWith("## ")) {
      nodes.push(<h2 key={bi} className="mt-6 text-xl font-bold text-slate-900">{inline(lines[0].slice(3), `h${bi}`)}</h2>);
      const rest = lines.slice(1).join("\n").trim();
      if (rest) nodes.push(<p key={`${bi}p`} className="mt-2 text-slate-600">{inline(rest, `hp${bi}`)}</p>);
    } else if (lines.every((l) => l.startsWith("- ") || l.startsWith("> "))) {
      if (lines[0].startsWith("> ")) {
        nodes.push(<blockquote key={bi} className="mt-3 border-l-4 border-emerald-200 pl-4 italic text-slate-600">{inline(lines.map((l) => l.slice(2)).join(" "), `q${bi}`)}</blockquote>);
      } else {
        nodes.push(
          <ul key={bi} className="mt-3 list-disc space-y-1 pl-6 text-slate-600">
            {lines.map((l, li) => <li key={li}>{inline(l.slice(2), `li${bi}-${li}`)}</li>)}
          </ul>,
        );
      }
    } else {
      nodes.push(<p key={bi} className="mt-3 text-slate-600">{inline(block, `p${bi}`)}</p>);
    }
  });
  return nodes;
}

// Emit a HowTo only when a post is genuinely a numbered sequence of steps,
// so we never mislabel an explainer as instructions.
function howToFromBody(title: string, description: string, body: string) {
  const steps: { "@type": "HowToStep"; name: string; text: string }[] = [];
  for (const block of body.split("\n\n")) {
    const lines = block.split("\n");
    const m = lines[0].match(/^##\s+(\d+)\.\s+(.*)$/);
    if (!m) continue;
    const text = lines.slice(1).join(" ").replace(/\*\*|\[|\]\([^)]*\)|`/g, "").trim();
    steps.push({ "@type": "HowToStep", name: m[2].trim(), text: text || m[2].trim() });
  }
  if (steps.length < 3) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description,
    step: steps,
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = postBySlug(slug);
  if (!p) notFound();

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.date,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: `${SITE.url}/blog/${p.slug}`,
  };

  // A HowTo graph for step-by-step guides gives rich results and quotable
  // structure for AI answer engines. We derive steps from the ## sections.
  const howToLd = howToFromBody(p.title, p.description, p.body);

  const crumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/blog" },
    { name: p.title, path: `/blog/${p.slug}` },
  ]);

  return (
    <article className="mx-auto max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      {howToLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />}
      <nav className="mb-3 text-sm text-slate-500">
        <Link href="/blog" className="hover:text-slate-900">Guides</Link> / {p.title}
      </nav>
      <h1 className="text-3xl font-extrabold text-slate-900">{p.title}</h1>
      <div className="mt-2 text-xs text-slate-500">
        Updated {new Date(p.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {p.readMins} min read
      </div>
      <div className="mt-4">{render(p.body)}</div>

      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="font-semibold text-slate-900">Design your wall in 30 seconds</div>
        <p className="mt-1 text-sm text-slate-600">Base width, factors of safety, materials and cost, all free.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          <Link href="/" className="inline-block rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            Open the calculator
          </Link>
          <Link href="/find-a-pro" className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Find a local pro
          </Link>
        </div>
      </div>
    </article>
  );
}
