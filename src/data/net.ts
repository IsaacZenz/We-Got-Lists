/** True when an error means "couldn't reach the server" (so the change should wait and retry). */
export function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const m = String((e as Error)?.message ?? e).toLowerCase();
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|the internet connection appears to be offline/.test(m);
}
