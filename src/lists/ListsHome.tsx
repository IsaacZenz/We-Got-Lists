import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import * as api from "./api";
import type { List } from "./types";
import { ListsOverview } from "./ListsOverview";
import { ListView } from "./ListView";
import { Message } from "../ui/Shell";
import type { Profile } from "../profile/profile";
import { readCache, writeCache } from "../data/cache";
import { isNetworkError } from "../data/net";
import { takePendingJoin } from "../join";
import { PullIndicator, usePullToRefresh } from "../ui/usePullToRefresh";

export type Tab = "mine" | "shared";
const isShared = (l: List) => l.memberCount > 1;

/** The lists part of the app: the overview for the current tab, or one open list. */
export function ListsHome({ profile, onProfile, tab, setTab }:
  { profile: Profile; onProfile: (p: Profile) => void; tab: Tab; setTab: (t: Tab) => void }) {
  const [lists, setLists] = useState<List[] | null>(() => readCache(profile.id).lists ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ kind: "good" | "error" | "info"; text: string } | null>(null);
  const [offline, setOffline] = useState(false);
  const startedRef = useRef(false);

  const reload = useCallback(async () => {
    try {
      const ls = await api.fetchLists();
      setLists(ls); setOffline(false);
      writeCache(profile.id, c => { c.lists = ls; });
      return ls;
    } catch (e) {
      if (isNetworkError(e)) setOffline(true); else setError((e as Error).message);
      return null;
    }
  }, [profile.id]);

  // Start-up: join a list from an invite link if there is one, otherwise open the starred list.
  useEffect(() => {
    (async () => {
      const code = takePendingJoin();
      let joinedId: string | null = null;
      if (code) {
        try { joinedId = await api.joinList(code); }
        catch (e) { setNotice({ kind: "error", text: isNetworkError(e) ? "You're offline, so the invite couldn't be used. Open the link again when you have signal." : "That invite link has expired or doesn't work. Ask for a new one." }); }
      }
      const ls = (await reload()) ?? readCache(profile.id).lists ?? [];
      if (startedRef.current) return;
      startedRef.current = true;
      const target = ls.find(l => l.id === (joinedId ?? profile.primary_list_id));
      if (target) {
        openIn(isShared(target) ? "shared" : "mine", target.id);
        if (joinedId) setNotice({ kind: "good", text: `You joined "${target.name}"!` });
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live: hear about being added to (or removed from) lists, and refresh when the app comes back.
  useEffect(() => {
    const ch = supabase.channel(`me-${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "wgl", table: "list_members", filter: `user_id=eq.${profile.id}` }, () => void reload())
      .subscribe();
    const onVisible = () => { if (document.visibilityState === "visible") void reload(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => { void supabase.removeChannel(ch); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("online", onVisible); };
  }, [profile.id, reload]);

  // Switching tabs (by tapping them) goes back to that tab's overview.
  const lastTab = useRef(tab);
  useEffect(() => { if (lastTab.current !== tab) { setOpenId(null); lastTab.current = tab; } }, [tab]);
  /** Open a list in a given tab without the tab switch closing it again. */
  function openIn(t: Tab, id: string) { lastTab.current = t; setTab(t); setOpenId(id); }

  const pull = usePullToRefresh(reload);

  async function star(id: string) {
    const next = profile.primary_list_id === id ? null : id; // tapping the lit star turns it off
    const before = profile;
    onProfile({ ...profile, primary_list_id: next });
    try { await api.setPrimaryList(profile.id, next); }
    catch (e) { onProfile(before); setNotice({ kind: "error", text: isNetworkError(e) ? "You're offline. Starring needs a connection." : (e as Error).message }); }
  }

  async function create(name: string) {
    try { const id = await api.createList(name); await reload(); setOpenId(id); }
    catch (e) { setNotice({ kind: "error", text: isNetworkError(e) ? "You're offline. Making a new list needs a connection." : (e as Error).message }); }
  }

  const patch = (id: string, change: Partial<List>) => setLists(ls => {
    const next = ls?.map(l => (l.id === id ? { ...l, ...change } : l)) ?? null;
    if (next) writeCache(profile.id, c => { c.lists = next; });
    return next;
  });
  const gone = (id: string) => {
    setOpenId(null);
    setLists(ls => ls?.filter(l => l.id !== id) ?? null);
    if (profile.primary_list_id === id) onProfile({ ...profile, primary_list_id: null });
    void reload();
  };

  const banner = notice && <Message kind={notice.kind}>{notice.text} <button className="link" onClick={() => setNotice(null)}>OK</button></Message>;

  if (error) return <><Message kind="error">{error}</Message><button className="btn b-blue" onClick={() => { setError(""); void reload(); }}>TRY AGAIN</button></>;
  if (!lists) return <div ref={pull.ref}><p className="note">{offline ? "You're offline, and nothing is saved on this phone yet." : "Loading lists…"}</p></div>;

  const open = lists.find(l => l.id === openId);
  if (open) {
    return (
      <>
        {banner}
        <ListView key={open.id} list={open} userId={profile.id} isPrimary={profile.primary_list_id === open.id}
          onBack={() => { setOpenId(null); setNotice(null); void reload(); }} onStar={() => star(open.id)}
          onRenamed={name => patch(open.id, { name })}
          onCountChange={remaining => patch(open.id, { remaining })}
          onMembersChange={memberCount => { if (memberCount !== open.memberCount) { patch(open.id, { memberCount }); openIn(memberCount > 1 ? "shared" : "mine", open.id); } }}
          onGone={() => gone(open.id)} />
      </>
    );
  }
  return (
    <div ref={pull.ref}>
      <PullIndicator {...pull} />
      {banner}
      {offline && <Message kind="info">You're offline. Showing what was saved on this phone.</Message>}
      <ListsOverview lists={lists.filter(l => isShared(l) === (tab === "shared"))} primaryId={profile.primary_list_id}
        shared={tab === "shared"} onOpen={setOpenId} onStar={star} onCreate={create} />
    </div>
  );
}
