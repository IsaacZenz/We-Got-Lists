import { describe, expect, it } from "vitest";
import { activeItems, doneItems, positionAfterMove, positionAtEnd } from "./order";
import type { Item } from "./types";

let n = 0;
const item = (text: string, position: number, done = false, done_at: string | null = null): Item => ({
  id: text, list_id: "L", text, done, done_at, position, added_by: null, created_at: `2026-01-01T00:00:0${n++ % 10}Z`,
});

describe("item order", () => {
  const items = [item("milk", 2), item("eggs", 1), item("bread", 3), item("tea", 4, true, "2026-01-02T10:00:00Z"), item("jam", 5, true, "2026-01-02T11:00:00Z")];

  it("lists to-get items by position", () => {
    expect(activeItems(items).map(i => i.text)).toEqual(["eggs", "milk", "bread"]);
  });

  it("lists crossed-off items newest first", () => {
    expect(doneItems(items).map(i => i.text)).toEqual(["jam", "tea"]);
  });

  it("adds new items after everything else", () => {
    expect(positionAtEnd(items)).toBe(6);
    expect(positionAtEnd([])).toBe(1);
  });

  const active = activeItems(items); // eggs 1, milk 2, bread 3
  const moved = (from: number, to: number) => {
    const p = positionAfterMove(active, from, to);
    const copy = active.map((it, i) => (i === from ? { ...it, position: p } : it));
    return activeItems(copy).map(i => i.text);
  };

  it("moves an item to the top", () => expect(moved(2, 0)).toEqual(["bread", "eggs", "milk"]));
  it("moves an item to the bottom", () => expect(moved(0, 2)).toEqual(["milk", "bread", "eggs"]));
  it("moves an item into the middle", () => expect(moved(0, 1)).toEqual(["milk", "eggs", "bread"]));
  it("moving onto itself keeps the order", () => expect(moved(1, 1)).toEqual(["eggs", "milk", "bread"]));
  it("works with a single item", () => expect(positionAfterMove([item("solo", 7)], 0, 0)).toBe(7));

  it("survives many moves into the same gap", () => {
    let list = activeItems([item("a", 1), item("b", 2), item("c", 3)]);
    for (let k = 0; k < 40; k++) {
      // keep dragging the last item to just after the first
      const p = positionAfterMove(list, 2, 1);
      list = activeItems(list.map((it, i) => (i === 2 ? { ...it, position: p } : it)));
    }
    expect(list).toHaveLength(3);
    expect(new Set(list.map(i => i.position)).size).toBe(3); // still all different
  });
});
