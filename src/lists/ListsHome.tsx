import { useEffect, useRef, useState } from "react";
import * as api from "./api";
import type { List } from "./types";
import { ListsOverview } from "./ListsOverview";
import { ListView } from "./ListView";
import { Message } from "../ui/Shell";
import type { Profile } from "../profile/profile";

export type Tab = "mine" | "shared";
const isShared = (l: List) => l.memberCount > 1;

/** The lists part of the app: the overview for the current tab, or one open list. */
export function ListsHome({ profile, onProfile, tab, setTab }:
  { profile: Profile; onProfile: (p: Profile) => void; tab: Tab; setTab: (t: Tab) => void }) {
  const [lists, setLists] = useState<List[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  const reload = () => api.fetchLists().then(setLists).catch(e => setError(e.message));
  useEffect(() => { reload(); }, []);

  // When the app starts, jump straight into your starred list (in whichever tab it belongs).
  useEffect(() => {
    if (!lists || startedRef.current) return;
    startedRef.current = true;
    const primary = lists.find(l => l.id === profile.primary_list_id);
    if (primary) { setTab(isShared(primary) ? "shared" : "mine"); setOpenId(primary.id); }
  }, [lists]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switching tabs goes back to that tab's overview.
  const lastTab = useRef(tab);
  useEffect(() => { if (lastTab.current !== tab) { setOpenId(null); lastTab.current = tab; } }, [tab]);

  async function star(id: string) {
    const next = profile.primary_list_id === id ? null : id; // tapping the lit star turns it off
    const before = profile;
    onProfile({ ...profile, primary_list_id: next });
    try { await api.setPrimaryList(profile.id, next); }
    catch (e) { onProfile(before); setError((e as Error).message); }
  }

  async function create(name: string) {
    try { const id = await api.createList(name); await reload(); setOpenId(id); }
    catch (e) { setError((e as Error).message); }
  }

  const patch = (id: string, change: Partial<List>) => setLists(ls => ls?.map(l => (l.id === id ? { ...l, ...change } : l)) ?? null);

  if (error) return <><Message kind="error">{error}</Message><button className="btn b-blue" onClick={() => { setError(""); reload(); }}>TRY AGAIN</button></>;
  if (!lists) return <p className="note">Loading lists…</p>;

  const open = lists.find(l => l.id === openId);
  if (open) {
    return (
      <ListView key={open.id} list={open} userId={profile.id} isPrimary={profile.primary_list_id === open.id}
        onBack={() => setOpenId(null)} onStar={() => star(open.id)}
        onRenamed={name => patch(open.id, { name })}
        onCountChange={remaining => patch(open.id, { remaining })}
        onDeleted={() => { setOpenId(null); setLists(ls => ls?.filter(l => l.id !== open.id) ?? null); if (profile.primary_list_id === open.id) onProfile({ ...profile, primary_list_id: null }); }} />
    );
  }
  return (
    <ListsOverview lists={lists.filter(l => isShared(l) === (tab === "shared"))} primaryId={profile.primary_list_id}
      shared={tab === "shared"} onOpen={setOpenId} onStar={star} onCreate={create} />
  );
}
