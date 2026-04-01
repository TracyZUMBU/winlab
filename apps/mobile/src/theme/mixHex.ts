/**
 * Linear RGB mix between two #RRGGBB colors (ratio: 0 = a, 1 = b).
 * Used to derive accent-tinted neutrals when the brand accent changes.
 */
export function mixHex(a: string, b: string, ratio: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const t = Math.min(1, Math.max(0, ratio));
  const r = Math.round(pa.r * (1 - t) + pb.r * t);
  const g = Math.round(pa.g * (1 - t) + pb.g * t);
  const bl = Math.round(pa.b * (1 - t) + pb.b * t);
  return `#${toHex2(r)}${toHex2(g)}${toHex2(bl)}`;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function toHex2(n: number): string {
  return n.toString(16).padStart(2, "0");
}
