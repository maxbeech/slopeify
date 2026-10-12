// The purchase block on the pricing page. Server component: whether payments are
// connected is read from the environment per request, so the page tells the truth
// without a dead button and without a flash of the wrong state.
import Link from "next/link";
import type { DesignInputs } from "@/lib/design";
import { REPORT_UNAVAILABLE_MESSAGE } from "@/lib/report/config";
import { describeWall, wallParam } from "@/lib/report/purchase";
import CheckoutButton from "./CheckoutButton";

export default function ProReportCta({ available, wall }: { available: boolean; wall: DesignInputs | null }) {
  if (!available) {
    return <p className="text-sm text-slate-600">{REPORT_UNAVAILABLE_MESSAGE}</p>;
  }

  if (!wall) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-600">The report is built from your wall. Set it up in the calculator, then choose Get the Pro report there.</p>
        <Link href="/" className="block rounded-lg bg-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-800">
          Design your wall first
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-900">Your wall:</span> {describeWall(wall)}.{" "}
        <Link href={`/?${wallParam(wall)}`} className="font-medium text-emerald-700 hover:underline">Change it</Link>
      </p>
      <CheckoutButton wall={wallParam(wall)} />
    </div>
  );
}
