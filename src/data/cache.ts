// Remembers the last things loaded from the server, so the app still shows your lists with no signal.
// Stored in this phone's browser storage, per signed-in person.
import type { Heart, Item, List, Person } from "../lists/types";
import type { Profile } from "../profile/profile";

interface CacheShape {
  profile?: Profile;
  lists?: List[];
  items?: Record<string, Item[]>;
  hearts?: Record<string, Heart[]>;
  members?: Record<string, Person[]>;
}

const key = (userId: string) => `wgl-cache-v1:${userId}`;

export function readCache(userId: string): CacheShape {
  try { return JSON.parse(localStorage.getItem(key(userId)) ?? "{}"); } catch { return {}; }
}

export function writeCache(userId: string, change: (c: CacheShape) => void) {
  try {
    const c = readCache(userId);
    change(c);
    localStorage.setItem(key(userId), JSON.stringify(c));
  } catch { /* storage full or blocked: the app still works, just not offline */ }
}

export function clearAllCaches() {
  try { Object.keys(localStorage).filter(k => k.startsWith("wgl-")).forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ }
}
