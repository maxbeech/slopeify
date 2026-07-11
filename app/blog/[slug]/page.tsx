import Image from "next/image";
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

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function plainText(s: string): string {
  return s
    .replace(/\*\*|`/g, "")
    .replace(/\[(.+?)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
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
    else if (m[2]) {
      const external = /^https?:\/\//.test(m[3]);
      out.push(
        <Link
          key={`${k}-l${i}`}
          href={m[3]}
          className="text-emerald-700 hover:underline"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {m[2]}
        </Link>,
      );
    } else if (m[4]) out.push(<code key={`${k}-c${i}`} className="rounded bg-slate-100 px-1 text-sm">{m[4]}</code>);
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderTable(lines: string[], key: string) {
  const rows = lines.filter((_, i) => i !== 1).map((r) =>
    r.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()),
  );
  const [header, ...body] = rows;
  return (
    <div key={key} className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-50">
          <tr>
            {header.map((h, i) => (
              <th key={i} className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-900">
                {inline(h, `${key}-th${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-100 last:border-0">
              {row.map((c, ci) => (
                <td key={ci} className="px-3 py-2 align-top text-slate-600">
                  {inline(c, `${key}-td${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const isListLine = (l: string) => l.startsWith("- ") || l.startsWith("> ");

// Renders a block of `- ` list items or `> ` quote lines (already confirmed
// homogeneous by the caller) as a <ul> or <blockquote>.
function renderListLines(lines: string[], key: string): React.ReactNode {
  if (lines[0].startsWith("> ")) {
    return (
      <blockquote key={key} className="mt-4 rounded-r-lg border-l-4 border-emerald-300 bg-emerald-50/60 py-2 pl-4 pr-3 italic text-slate-700">
        {inline(lines.map((l) => l.slice(2)).join(" "), `${key}-q`)}
      </blockquote>
    );
  }
  return (
    <ul key={key} className="mt-3 list-disc space-y-1.5 pl-6 text-slate-600">
      {lines.map((l, li) => {
        const raw = l.slice(2);
        const cb = raw.match(/^\[([ xX])\]\s*(.*)$/);
        if (cb) {
          return (
            <li key={li} className="-ml-6 flex list-none items-start gap-2">
              <span
                aria-hidden
                className={`mt-1 inline-block h-3.5 w-3.5 shrink-0 rounded-sm border ${cb[1] === " " ? "border-slate-400" : "border-emerald-600 bg-emerald-600"}`}
              />
              <span>{inline(cb[2], `${key}-li${li}`)}</span>
            </li>
          );
        }
        return <li key={li}>{inline(raw, `${key}-li${li}`)}</li>;
      })}
    </ul>
  );
}

// Renders a flat list of blocks (paragraphs, lists, quotes, tables, h3s) that
// share one heading's worth of context, no h2 recursion needed here since
// sections are split on h2 boundaries before this runs.
function renderBlocks(blocks: string[], keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  blocks.forEach((block, bi) => {
    const key = `${keyPrefix}-${bi}`;
    const lines = block.split("\n");
    if (lines[0].startsWith("### ")) {
      nodes.push(<h3 key={key} className="mt-5 text-lg font-bold text-slate-900">{inline(lines[0].slice(4), `${key}-h`)}</h3>);
      const rest = lines.slice(1).join("\n").trim();
      if (rest) nodes.push(<p key={`${key}p`} className="mt-2 text-slate-600">{inline(rest, `${key}-hp`)}</p>);
    } else if (lines[0].trim().startsWith("|") && lines[1] && /^\|?\s*:?-{2,}/.test(lines[1].trim())) {
      nodes.push(renderTable(lines, key));
    } else if (lines.every(isListLine)) {
      nodes.push(renderListLines(lines, key));
    } else if (lines.length > 1 && !isListLine(lines[0]) && lines.slice(1).every(isListLine)) {
      // A bold label line directly above a list, with no blank line between
      // them (e.g. "**Drainage:**\n- item\n- item").
      nodes.push(<p key={`${key}-label`} className="mt-3 text-slate-600">{inline(lines[0], `${key}-label`)}</p>);
      nodes.push(renderListLines(lines.slice(1), `${key}-list`));
    } else {
      nodes.push(<p key={key} className="mt-3 text-slate-600">{inline(block, `${key}-p`)}</p>);
    }
  });
  return nodes;
}

interface Section {
  heading: string;
  blocks: string[];
}

function splitSections(body: string): { intro: string[]; sections: Section[] } {
  const blocks = body.split("\n\n");
  const intro: string[] = [];
  const sections: Section[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const m = lines[0].match(/^##\s+(.*)$/);
    if (m) {
      const rest = lines.slice(1).join("\n").trim();
      sections.push({ heading: m[1].trim(), blocks: rest ? [rest] : [] });
    } else if (sections.length === 0) {
      intro.push(block);
    } else {
      sections[sections.length - 1].blocks.push(block);
    }
  }
  return { intro, sections };
}

function groupQA(blocks: string[]): { q: string; aBlocks: string[] }[] {
  const qas: { q: string; aBlocks: string[] }[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const m = lines[0].match(/^###\s+(.*)$/);
    if (m) {
      const rest = lines.slice(1).join("\n").trim();
      qas.push({ q: m[1].trim(), aBlocks: rest ? [rest] : [] });
    } else if (qas.length) {
      qas[qas.length - 1].aBlocks.push(block);
    }
  }
  return qas;
}

const isTakeaways = (h: string) => /^key takeaways$/i.test(h);
const isFaq = (h: string) => /^(faqs?|frequently asked questions)$/i.test(h);

function Toc({ sections }: { sections: Section[] }) {
  if (sections.length < 3) return null;
  return (
    <nav aria-label="Table of contents" className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">In this guide</div>
      <ol className="mt-2 space-y-1.5 text-sm">
        {sections.map((s, i) => (
          <li key={i}>
            <a href={`#${slugify(s.heading)}`} className="text-emerald-700 hover:underline">
              {s.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function KeyTakeaways({ section }: { section: Section }) {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
      <div className="flex items-center gap-2 font-bold text-emerald-900">
        <span aria-hidden>✓</span> Key takeaways
      </div>
      <div className="mt-1 [&_ul]:mt-2 [&_li]:text-slate-700">{renderBlocks(section.blocks, "kt")}</div>
    </div>
  );
}

function FaqSection({ section }: { section: Section }) {
  const qas = groupQA(section.blocks);
  return (
    <div>
      <h2 id={slugify(section.heading)} className="mt-6 scroll-mt-24 text-xl font-bold text-slate-900">
        {section.heading}
      </h2>
      <div className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {qas.map((qa, i) => (
          <details key={i} className="group p-4 open:bg-slate-50/60" open={i === 0}>
            <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:hidden">
              {inline(qa.q, `faq-q${i}`)}
            </summary>
            <div className="mt-2 text-slate-600">{renderBlocks(qa.aBlocks, `faq-a${i}`)}</div>
          </details>
        ))}
      </div>
    </div>
  );
}

// Emit a HowTo only when a post is genuinely a numbered sequence of steps,
// so we never mislabel an explainer as instructions.
function howToFromBody(title: string, description: string, body: string) {
  const steps: { "@type": "HowToStep"; name: string; text: string }[] = [];
  for (const block of body.split("\n\n")) {
    const lines = block.split("\n");
    const m = lines[0].match(/^##\s+(\d+)\.\s+(.*)$/);
    if (!m) continue;
    const text = plainText(lines.slice(1).join(" ")) || m[2].trim();
    steps.push({ "@type": "HowToStep", name: m[2].trim(), text });
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

// FAQPage graph from a "## FAQs" section, for rich results and quotable
// answer-engine structure.
function faqFromBody(body: string) {
  const { sections } = splitSections(body);
  const faqSection = sections.find((s) => isFaq(s.heading));
  if (!faqSection) return null;
  const qas = groupQA(faqSection.blocks);
  if (qas.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map((qa) => ({
      "@type": "Question",
      name: plainText(qa.q),
      acceptedAnswer: { "@type": "Answer", text: plainText(qa.aBlocks.join(" ")) },
    })),
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
    image: `${SITE.url}${p.image}`,
    datePublished: p.date,
    dateModified: p.date,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: `${SITE.url}/blog/${p.slug}`,
  };

  const howToLd = howToFromBody(p.title, p.description, p.body);
  const faqLd = faqFromBody(p.body);

  const crumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/blog" },
    { name: p.title, path: `/blog/${p.slug}` },
  ]);

  const { intro, sections } = splitSections(p.body);

  return (
    <article className="mx-auto max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      {howToLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />}
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <nav className="mb-3 text-sm text-slate-500">
        <Link href="/blog" className="hover:text-slate-900">Guides</Link> / {p.title}
      </nav>
      <h1 className="text-3xl font-extrabold text-slate-900">{p.title}</h1>
      <div className="mt-2 text-xs text-slate-500">
        Updated {new Date(p.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {p.readMins} min read
      </div>
      <div className="relative mt-5 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100">
        <Image src={p.image} alt={p.title} fill sizes="(min-width: 672px) 672px, 100vw" className="object-cover" priority />
      </div>
      <div className="mt-1 text-right text-[11px] text-slate-400">{p.imageCredit}</div>

      <div className="mt-4">{renderBlocks(intro, "intro")}</div>
      <Toc sections={sections} />

      {sections.map((s, si) => {
        if (isTakeaways(s.heading)) return <KeyTakeaways key={si} section={s} />;
        if (isFaq(s.heading)) return <FaqSection key={si} section={s} />;
        return (
          <div key={si}>
            <h2 id={slugify(s.heading)} className="mt-6 scroll-mt-24 text-xl font-bold text-slate-900">
              {s.heading}
            </h2>
            {renderBlocks(s.blocks, `s${si}`)}
          </div>
        );
      })}

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
