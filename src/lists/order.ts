// Pure helpers for item order. No database or screen code, so they're easy to test.
import type { Item } from "./types";

/** Items still to get, in list order. */
export const activeItems = (items: Item[]) =>
  items.filter(i => !i.done).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));

/** Crossed-off items, most recently crossed off first. */
export const doneItems = (items: Item[]) =>
  items.filter(i => i.done).sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));

/** Position for a new item added to the bottom of the to-get section. */
export function positionAtEnd(items: Item[]): number {
  return items.reduce((max, i) => Math.max(max, i.position), 0) + 1;
}

/**
 * New position for the item being dragged from `from` to `to` (indexes in the active list).
 * Only the dragged item gets a new number: halfway between its new neighbours.
 */
export function positionAfterMove(active: Item[], from: number, to: number): number {
  const rest = active.filter((_, i) => i !== from);
  const before = rest[to - 1];
  const after = rest[to];
  if (!before && !after) return active[from].position;
  if (!before) return after.position - 1;
  if (!after) return before.position + 1;
  return (before.position + after.position) / 2;
}
