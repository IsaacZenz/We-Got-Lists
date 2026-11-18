import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { supabase } from "../supabase";
import * as api from "./api";
import { applyOp, withPending, type ListState, type Op } from "../data/ops";
import { outbox } from "../data/outbox";
import { readCache, writeCache } from "../data/cache";
import { isNetworkError } from "../data/net";
import type { Person } from "./types";

/**
 * Everything for one open list: items, hearts and members, kept live.
 * - Shows the saved copy straight away (works with no signal).
 * - Changes appear instantly and wait in the outbox until the server confirms them.
 * - Supabase Realtime tells us when someone else changes the list, and we re-fetch.
 */
export function useListData(listId: string, userId: string, events: { onRenamed: (name: string) => void; onGone: () => void }) {
  const cached = readCache(userId);
  const [server, setServer] = useState<ListState | null>(
    cached.items?.[listId] ? { items: cached.items[listId], hearts: cached.hearts?.[listId] ?? [] } : null);
  const [members, setMembers] = useState<Person[]>(cached.members?.[listId] ?? []);
  const [live, setLive] = useState(false);
  const [fetchFailed, setOffline] = useState(false);
  const [netDown, setNetDown] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    const on = () => setNetDown(false), off = () => setNetDown(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  const offline = fetchFailed || netDown;
  const [error, setError] = useState("");
  const pending = useSyncExternalStore(cb => outbox.subscribe(cb), () => outbox.pending());
  const ev = useRef(events);
  ev.current = events;

  const refresh = useCallback(async () => {
    try {
      const [items, hearts, people] = await Promise.all([api.fetchItems(listId), api.fetchHearts(listId), api.fetchMembers(listId)]);
      setServer({ items, hearts });
      setMembers(people);
      setOffline(false);
      writeCache(userId, c => {
        c.items = { ...c.items, [listId]: items };
        c.hearts = { ...c.hearts, [listId]: hearts };
        c.members = { ...c.members, [listId]: people };
      });
    } catch (e) {
      if (isNetworkError(e)) setOffline(true);
      else setError((e as Error).message);
    }
  }, [listId, userId]);

  // Fold confirmed changes into the server copy so nothing flickers while we wait for a re-fetch.
  useEffect(() => outbox.onConfirmed((op: Op) => {
    if (op.listId === listId) setServer(s => (s ? applyOp(s, op) : s));
  }), [listId]);

  // First load, re-load when the app comes back to the front, and live updates.
  useEffect(() => {
    void refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const bump = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 250); };
    const onVisible = () => { if (document.visibilityState === "visible") bump(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", bump);

    const ids = () => new Set((serverRef.current?.items ?? []).map(i => i.id));
    const ch = supabase.channel(`list-${listId}`)
      .on("postgres_changes", { event: "*", schema: "wgl", table: "items", filter: `list_id=eq.${listId}` }, bump)
      .on("postgres_changes", { event: "DELETE", schema: "wgl", table: "items" }, p => { if (ids().has((p.old as { id: string }).id)) bump(); })
      .on("postgres_changes", { event: "*", schema: "wgl", table: "item_hearts", filter: `list_id=eq.${listId}` }, bump)
      .on("postgres_changes", { event: "DELETE", schema: "wgl", table: "item_hearts" }, p => { if (ids().has((p.old as { item_id: string }).item_id)) bump(); })
      .on("postgres_changes", { event: "*", schema: "wgl", table: "list_members", filter: `list_id=eq.${listId}` }, bump)
      .on("postgres_changes", { event: "UPDATE", schema: "wgl", table: "lists", filter: `id=eq.${listId}` }, p => ev.current.onRenamed((p.new as { name: string }).name))
      .on("postgres_changes", { event: "DELETE", schema: "wgl", table: "lists" }, p => { if ((p.old as { id: string }).id === listId) ev.current.onGone(); })
      .subscribe(status => setLive(status === "SUBSCRIBED"));

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", bump);
      void supabase.removeChannel(ch);
    };
  }, [listId, refresh]);

  const serverRef = useRef(server);
  serverRef.current = server;

  const view = server ? withPending(server, pending, listId) : null;
  const waiting = pending.filter(o => o.listId === listId).length;

  return {
    items: view?.items ?? null,
    hearts: view?.hearts ?? [],
    members,
    live: live && !offline,
    offline,
    waiting,
    error, clearError: () => setError(""),
    refresh,
    apply: (op: Op) => outbox.push(op),
  };
}
