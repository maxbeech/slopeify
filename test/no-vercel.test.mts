// Slopeify runs on Helm7. Anything that names Vercel either does nothing there or
// silently changes behaviour: a VERCEL_* env check is always unset (so a Sentry
// environment read from one reports production errors as "development"), and an
// @vercel/* package throws or no-ops off Vercel. Keep them out.
//
// Files marked GENERATED are copies of shared service clients edited elsewhere, so
// they are not policed here.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) sourceFiles(p, found);
    else if (/\.(ts|tsx|mts|mjs)$/.test(entry)) found.push(p);
  }
  return found;
}

const TOP_LEVEL = ["next.config.ts", "middleware.ts", "instrumentation.ts", "instrumentation-client.ts", "sentry.server.config.ts", "sentry.edge.config.ts"];
const files = [...["app", "components", "lib"].flatMap((r) => sourceFiles(r)), ...TOP_LEVEL.filter(existsSync)]
  .filter((f) => !/GENERATED/.test(readFileSync(f, "utf8").slice(0, 400)));

console.log("No Vercel in application code");
check("finds source to police", files.length > 30, `found ${files.length}`);
const offenders = files.filter((f) => /vercel/i.test(readFileSync(f, "utf8")));
check("names Vercel nowhere", offenders.length === 0, offenders.join(", "));

console.log("package.json");
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const pkgs = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((n) => n === "vercel" || n.startsWith("@vercel/"));
check("no vercel package", pkgs.length === 0, pkgs.join(", "));
const scripts = Object.entries(pkg.scripts ?? {}).filter(([, cmd]) => /(^|[\s;&|])vercel(\s|$)/.test(cmd));
check("no vercel CLI script", scripts.length === 0, JSON.stringify(scripts));
check("no vercel.json", !existsSync("vercel.json"));
// `next start` reads $PORT itself; a hard-coded -p would leave Helm7's health check probing a dead port.
check("start honours $PORT", pkg.scripts?.start === "next start", String(pkg.scripts?.start));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
