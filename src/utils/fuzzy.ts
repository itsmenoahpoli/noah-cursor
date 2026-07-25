/** Simple fuzzy score: higher is better. Returns 0 if no match. */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return 1;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 500 + (100 - Math.min(q.length, 100));
  if (t.includes(q)) return 300;

  // Subsequence match — require mostly consecutive hits to avoid noise
  let ti = 0;
  let score = 0;
  let consecutive = 0;
  let maxRun = 0;
  for (let qi = 0; qi < q.length; qi += 1) {
    const ch = q[qi]!;
    const found = t.indexOf(ch, ti);
    if (found === -1) return 0;
    consecutive = found === ti ? consecutive + 1 : 1;
    maxRun = Math.max(maxRun, consecutive);
    score += 10 + consecutive * 5;
    if (found === 0) score += 20;
    ti = found + 1;
  }
  // Drop weak subsequence-only matches (e.g. t-e-s-t inside "typescript")
  if (maxRun < Math.min(3, q.length) && !t.includes(q)) {
    return 0;
  }
  return score;
}

export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string | string[],
  limit = 50,
): Array<T & { score: number }> {
  const scored: Array<T & { score: number }> = [];
  for (const item of items) {
    const texts = getText(item);
    const parts = Array.isArray(texts) ? texts : [texts];
    let best = 0;
    for (const part of parts) {
      best = Math.max(best, fuzzyScore(query, part));
    }
    if (best > 0) {
      scored.push({ ...item, score: best });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
