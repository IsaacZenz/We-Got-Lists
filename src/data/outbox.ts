// The outbox: changes made on this phone that the server hasn't confirmed yet.
// They're kept in browser storage, so they survive closing the app with no signal.
import type { Op } from "./ops";
import { sendOp } from "../lists/api";
import { isNetworkError } from "./net";

type Listener = () => void;

class Outbox {
  private ops: Op[] = [];
  private userId: string | null = null;
  private flushing = false;
  private listeners = new Set<Listener>();
  private confirmedListeners = new Set<(op: Op) => void>();
  /** Last non-network error (e.g. the item was deleted by someone else). */
  lastError = "";

  private get storageKey() { return `wgl-outbox-v1:${this.userId}`; }

  /** Load the waiting changes for whoever just signed in. */
  start(userId: string) {
    this.userId = userId;
    try { this.ops = JSON.parse(localStorage.getItem(this.storageKey) ?? "[]"); } catch { this.ops = []; }
    this.emit();
    void this.flush();
  }

  stop() { this.userId = null; this.ops = []; this.emit(); }

  pending(): Op[] { return this.ops; }

  subscribe(fn: Listener) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }

  /** Called with each change the server has accepted (so screens can fold it into their server copy). */
  onConfirmed(fn: (op: Op) => void) { this.confirmedListeners.add(fn); return () => { this.confirmedListeners.delete(fn); }; }

  push(op: Op) {
    this.ops = [...this.ops, op];
    this.save();
    void this.flush();
  }

  /** Send waiting changes in order. Stops at the first network failure and tries again later. */
  async flush() {
    if (this.flushing || !this.userId) return;
    this.flushing = true;
    try {
      while (this.ops.length) {
        const op = this.ops[0];
        let accepted = true;
        try {
          await sendOp(op);
        } catch (e) {
          if (isNetworkError(e)) break; // no signal: keep it for later
          accepted = false;
          this.lastError = (e as Error).message; // server said no: drop it so it doesn't block the rest
        }
        this.ops = this.ops.slice(1);
        if (accepted) this.confirmedListeners.forEach(fn => fn(op));
        this.save();
      }
    } finally {
      this.flushing = false;
    }
  }

  private save() {
    try { if (this.userId) localStorage.setItem(this.storageKey, JSON.stringify(this.ops)); } catch { /* ignore */ }
    this.emit();
  }
  private emit() { this.listeners.forEach(fn => fn()); }
}

export const outbox = new Outbox();

// Try again whenever signal comes back or the app is reopened.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => void outbox.flush());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void outbox.flush(); });
  setInterval(() => { if (outbox.pending().length) void outbox.flush(); }, 15000);
}
