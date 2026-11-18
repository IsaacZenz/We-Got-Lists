/** "Isaac Zenz" → "IZ", "isaac" → "IS", "  j  " → "J". Letters and digits only, upper-cased. */
export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).map(w => w.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  if (words.length === 0) return "?";
  const first = [...words[0]];
  const pick = words.length >= 2 ? first[0] + [...words[words.length - 1]][0] : first.slice(0, 2).join("");
  return pick.toUpperCase();
}
