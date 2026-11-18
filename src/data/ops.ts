// Every change to a list's items is an "op". Ops are applied to the screen straight away,
// saved in an outbox, and sent to the server when there's signal. Pure code: easy to test.
import type { Heart, Item } from "../lists/types";

export type Op =
  | { kind: "add"; listId: string; item: Item }
  | { kind: "update"; listId: string; id: string; change: Partial<Pick<Item, "done" | "position" | "text">> }
  | { kind: "delete"; listId: string; id: string }
  | { kind: "clear"; listId: string; onlyDone: boolean }
  | { kind: "heart"; listId: string; itemId: string; userId: string; on: boolean };

export interface ListState { items: Item[]; hearts: Heart[] }

export function applyOp(s: ListState, op: Op): ListState {
  switch (op.kind) {
    case "add":
      return s.items.some(i => i.id === op.item.id) ? s : { ...s, items: [...s.items, op.item] };
    case "update":
      return {
        ...s,
        items: s.items.map(i => {
          if (i.id !== op.id) return i;
          const next = { ...i, ...op.change };
          if ("done" in op.change && op.change.done !== i.done) next.done_at = op.change.done ? new Date().toISOString() : null;
          return next;
        }),
      };
    case "delete":
      return { items: s.items.filter(i => i.id !== op.id), hearts: s.hearts.filter(h => h.item_id !== op.id) };
    case "clear": {
      const gone = new Set(s.items.filter(i => !op.onlyDone || i.done).map(i => i.id));
      return { items: s.items.filter(i => !gone.has(i.id)), hearts: s.hearts.filter(h => !gone.has(h.item_id)) };
    }
    case "heart": {
      const rest = s.hearts.filter(h => !(h.item_id === op.itemId && h.user_id === op.userId));
      return { ...s, hearts: op.on ? [...rest, { item_id: op.itemId, user_id: op.userId, list_id: op.listId }] : rest };
    }
  }
}

/** Server data + changes not yet confirmed = what the screen should show. */
export function withPending(server: ListState, pending: Op[], listId: string): ListState {
  return pending.filter(o => o.listId === listId).reduce(applyOp, server);
}
