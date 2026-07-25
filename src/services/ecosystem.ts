import { listRegistryAssets } from "./install-service.js";
import { readUserStore } from "../metadata/user-store.js";
import type { SearchResult } from "../types/index.js";

export async function listTrending(
  period: "today" | "week" | "month" = "week",
  options: { verbose?: boolean } = {},
): Promise<SearchResult[]> {
  const listed = await listRegistryAssets(undefined, options);
  const sorted = [...listed.assets].sort((a, b) => {
    const da = a.downloads ?? 0;
    const db = b.downloads ?? 0;
    if (db !== da) return db - da;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
  // Period is reserved for future registry API; local registry uses downloads/rating.
  void period;
  return sorted.slice(0, 10);
}

export async function getAnalyticsSummary(): Promise<{
  favorites: number;
  recent: number;
}> {
  const store = await readUserStore();
  return {
    favorites: store.favorites.length,
    recent: store.recent.length,
  };
}
