// Number and text formatting for the report, shared by the on-screen view and the
// PDF so both print identical figures. Pure.

/** A fixed-decimals number, or "n/a" when the engine returned Infinity or NaN. */
export const fix = (n: number, digits = 2): string => (Number.isFinite(n) ? n.toFixed(digits) : "n/a");

/** A whole number with thousands separators. */
export const int = (n: number): string => (Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "n/a");

export const money = (n: number): string => "$" + Math.round(n).toLocaleString("en-US");

// The PDF uses the standard Helvetica fonts, which encode Windows-1252 only. The
// engine's wording uses a few characters outside it, so each gets a plain
// equivalent here rather than throwing at render time on the first one added.
const REPLACEMENTS: Record<string, string> = {
  "′": "'", // prime (feet)
  "″": '"', // double prime (inches)
  "≥": ">=",
  "≤": "<=",
  "−": "-", // minus sign
  "–": "-", // en dash
  "\u2014": "-", // em dash
  "→": "->",
  "≈": "~",
  "≠": "!=",
  "α": "alpha",
  "β": "beta",
  "γ": "gamma",
  "φ": "phi",
  "σ": "sigma",
  "✓": "ok",
  " ": " ",
};

// Windows-1252 code points above 0x7F that are not plain Latin-1.
const CP1252_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d,
  0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

/** Make a string safe for a standard PDF font: map known symbols, replace anything else with "?". */
export function toWinAnsi(text: string): string {
  let out = "";
  for (const ch of text) {
    const mapped = REPLACEMENTS[ch];
    if (mapped !== undefined) {
      out += mapped;
      continue;
    }
    const cp = ch.codePointAt(0)!;
    const ok = cp === 0x0a || (cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff) || CP1252_EXTRAS.has(cp);
    out += ok ? ch : "?";
  }
  return out;
}

/** "a***@gmail.com": enough for a buyer to recognise their address, not enough to harvest it. */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  return `${email[0]}***${email.slice(at)}`;
}

/** YYYY-MM-DD in UTC from a Unix timestamp in seconds. */
export function isoDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}
