// Invite links look like https://isaaczenz.github.io/We-Got-Lists/?join=abc123
// When the app opens with one, remember the code (so it survives signing in) and tidy the address bar.
const KEY = "wgl-pending-join";

export function captureJoinFromUrl(loc: { search: string; pathname: string; hash: string } = window.location) {
  const code = new URLSearchParams(loc.search).get("join");
  if (!code || !/^[A-Za-z0-9]{6,40}$/.test(code)) return null;
  try { localStorage.setItem(KEY, code); } catch { /* ignore */ }
  try { history.replaceState(null, "", loc.pathname + loc.hash); } catch { /* ignore */ }
  return code;
}

export function hasPendingJoin(): boolean {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

/** Returns the waiting invite code (once) and forgets it. */
export function takePendingJoin(): string | null {
  try { const c = localStorage.getItem(KEY); localStorage.removeItem(KEY); return c; } catch { return null; }
}
