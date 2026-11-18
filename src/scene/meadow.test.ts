import { describe, expect, it } from "vitest";
import { MEADOW, pteroAt, sceneAt } from "./meadow";
import { PTERO } from "./sprites";

const size = { width: 370, ground: 200 };
const always = (k: "cow" | "chicken") => () => k;

describe("meadow scene", () => {
  it("has no pterodactyl early in a cycle", () => {
    expect(pteroAt(1, size)).toBeNull();
  });

  it("pterodactyl appears before the grab and is gone after", () => {
    expect(pteroAt(MEADOW.grabAt - 1, size)).not.toBeNull();
    expect(pteroAt(MEADOW.grabAt + 3, size)).toBeNull();
  });

  it("carries the chosen victim after the grab", () => {
    const before = sceneAt(MEADOW.grabAt - 0.1, size, always("chicken"));
    const after = sceneAt(MEADOW.grabAt + 0.5, size, always("chicken"));
    // After the grab there's one extra sprite (the carried chicken) drawn just before the pterodactyl.
    const pIdx = after.findIndex(s => PTERO.includes(s.grid));
    expect(pIdx).toBeGreaterThan(0);
    expect(after[pIdx - 1].grid.some(r => r.includes("cc"))).toBe(true); // chicken comb
    expect(before.length).toBe(after.length);
  });

  it("the walking victim faces the way it walks (right, not mirrored)", () => {
    const a = sceneAt(5, size, always("cow"));
    const b = sceneAt(5.5, size, always("cow"));
    // victim is the third sprite (after the two back-row critters)
    expect(b[2].x).toBeGreaterThan(a[2].x);
    expect(a[2].flip).toBe(false);
  });

  it("the front cow walks left and is mirrored", () => {
    const a = sceneAt(2, size, always("cow"));
    const b = sceneAt(2.5, size, always("cow"));
    expect(b[3].x).toBeLessThan(a[3].x);
    expect(a[3].flip).toBe(true);
  });

  it("is the same every time for the same time and picker", () => {
    expect(sceneAt(9.3, size, always("cow"))).toEqual(sceneAt(9.3, size, always("cow")));
  });
});
