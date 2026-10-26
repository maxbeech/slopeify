// Cross-links between guides and calculators, chosen by shared words in their
// titles and keywords so every page gets contextual internal links without a
// hand-maintained map.
import { CALCULATORS, type CalcVariant } from "@/lib/calculators";
import { POSTS, type Post } from "@/lib/posts";

const STOP = new Set(["a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "do", "i", "need", "how", "much", "does", "what", "vs", "is", "your", "you", "retaining", "wall", "walls", "calculator", "2026"]);

function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

export function relatedPosts(slug: string, text: string, limit = 4): Post[] {
  const t = tokens(text);
  return POSTS.filter((p) => p.slug !== slug)
    .map((p) => ({ p, s: overlap(t, tokens(`${p.title} ${p.keyword}`)) }))
    .sort((a, b) => b.s - a.s || a.p.slug.localeCompare(b.p.slug))
    .slice(0, limit)
    .map((x) => x.p);
}

export function relatedCalculators(text: string, limit = 3): CalcVariant[] {
  const t = tokens(text);
  return CALCULATORS.map((c) => ({ c, s: overlap(t, tokens(`${c.h1} ${c.slug}`)) }))
    .sort((a, b) => b.s - a.s || a.c.slug.localeCompare(b.c.slug))
    .slice(0, limit)
    .map((x) => x.c);
}
