import { describe, expect, it, beforeEach } from "vitest";

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k), clear: () => store.clear(), key: () => null, length: 0,
  };
  (globalThis as unknown as { history: Pick<History, "replaceState"> }).history = { replaceState: () => {} };
});

describe("invite links", async () => {
  const { captureJoinFromUrl, takePendingJoin, hasPendingJoin } = await import("./join");
  const loc = (search: string) => ({ search, pathname: "/We-Got-Lists/", hash: "" });

  it("remembers a join code from the link, once", () => {
    expect(captureJoinFromUrl(loc("?join=abc123def456"))).toBe("abc123def456");
    expect(hasPendingJoin()).toBe(true);
    expect(takePendingJoin()).toBe("abc123def456");
    expect(takePendingJoin()).toBeNull();
  });
  it("ignores links without a code", () => {
    expect(captureJoinFromUrl(loc(""))).toBeNull();
    expect(hasPendingJoin()).toBe(false);
  });
  it("ignores junk codes", () => {
    expect(captureJoinFromUrl(loc("?join=<script>"))).toBeNull();
  });
});
