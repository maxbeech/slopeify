import Link from "next/link";
import { POSTS } from "@/lib/posts";

export const metadata = {
  title: "Retaining Wall Guides",
  description:
    "Practical, code-grounded guides to retaining walls: cost, permits, drainage, materials, geogrid, base width and how to build one.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Retaining wall guides</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Clear answers to the questions people actually ask before they build, grounded in the same codes the calculator uses.</p>
      <div className="mt-8 space-y-3">
        {POSTS.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`}
            className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm">
            <div className="font-semibold text-slate-900">{p.title}</div>
            <div className="mt-1 text-sm text-slate-500">{p.description}</div>
            <div className="mt-2 text-xs text-slate-400">{p.readMins} min read</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
