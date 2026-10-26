import Image from "next/image";
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
      <p className="mt-3 max-w-2xl text-slate-600">Clear answers to the questions people actually ask before they build, grounded in the same codes the calculator uses. Each guide links to the calculator that runs its numbers, and permit rules for your state are on the <Link href="/states" className="text-emerald-700 hover:underline">state pages</Link>.</p>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">Ready to run numbers? Open the <Link href="/" className="text-emerald-700 hover:underline">wall designer</Link> or pick a <Link href="/calculators" className="text-emerald-700 hover:underline">calculator</Link> for cost, block count, base width or a specific material.</p>
      <div className="mt-8 space-y-3">
        {POSTS.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`}
            className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm">
            <div className="relative hidden h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:block">
              <Image src={p.image} alt={p.title} fill sizes="128px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">{p.title}</div>
              <div className="mt-1 text-sm text-slate-500">{p.description}</div>
              <div className="mt-2 text-xs text-slate-400">{p.readMins} min read</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
