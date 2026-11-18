import { describe, expect, it } from "vitest";
import { applyOp, withPending, type ListState } from "./ops";
import type { Item } from "../lists/types";

const item = (id: string, done = false): Item => ({ id, list_id: "L", text: id, done, done_at: done ? "2026-01-01T00:00:00Z" : null, position: 1, added_by: "me", created_at: "2026-01-01T00:00:00Z" });
const base: ListState = { items: [item("eggs"), item("milk", true)], hearts: [{ item_id: "milk", user_id: "jo", list_id: "L" }] };

describe("ops", () => {
  it("add puts a new item on the list, once", () => {
    const op = { kind: "add" as const, listId: "L", item: item("jam") };
    const s = applyOp(applyOp(base, op), op);
    expect(s.items.map(i => i.id)).toEqual(["eggs", "milk", "jam"]);
  });
  it("crossing off stamps done_at; un-crossing clears it", () => {
    const s = applyOp(base, { kind: "update", listId: "L", id: "eggs", change: { done: true } });
    expect(s.items[0].done_at).not.toBeNull();
    const t = applyOp(s, { kind: "update", listId: "L", id: "eggs", change: { done: false } });
    expect(t.items[0].done_at).toBeNull();
  });
  it("delete also removes that item's hearts", () => {
    const s = applyOp(base, { kind: "delete", listId: "L", id: "milk" });
    expect(s.items).toHaveLength(1);
    expect(s.hearts).toHaveLength(0);
  });
  it("clear got-it keeps to-get items", () => {
    expect(applyOp(base, { kind: "clear", listId: "L", onlyDone: true }).items.map(i => i.id)).toEqual(["eggs"]);
  });
  it("clear all empties the list", () => {
    expect(applyOp(base, { kind: "clear", listId: "L", onlyDone: false })).toEqual({ items: [], hearts: [] });
  });
  it("hearting twice doesn't double count; un-heart removes only mine", () => {
    const on = { kind: "heart" as const, listId: "L", itemId: "milk", userId: "me", on: true };
    const s = applyOp(applyOp(base, on), on);
    expect(s.hearts).toHaveLength(2);
    expect(applyOp(s, { ...on, on: false }).hearts).toEqual([{ item_id: "milk", user_id: "jo", list_id: "L" }]);
  });
  it("withPending replays only this list's waiting changes on top of fresh server data", () => {
    const pending = [
      { kind: "add" as const, listId: "L", item: item("jam") },
      { kind: "add" as const, listId: "OTHER", item: item("nails") },
      { kind: "update" as const, listId: "L", id: "eggs", change: { done: true } },
    ];
    const s = withPending(base, pending, "L");
    expect(s.items.map(i => i.id)).toEqual(["eggs", "milk", "jam"]);
    expect(s.items[0].done).toBe(true);
  });
  it("changes to an item someone else deleted are ignored safely", () => {
    const s = applyOp(base, { kind: "update", listId: "L", id: "gone", change: { done: true } });
    expect(s).toEqual(base);
  });
});
