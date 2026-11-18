// Everything the app asks the database about lists, items, hearts and people.
import { supabase } from "../supabase";
import type { Heart, Item, List, Person } from "./types";
import type { Op } from "../data/ops";

const ITEM_COLS = "id, list_id, text, done, done_at, position, added_by, created_at";

function check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.data;
}

// ---------- Lists ----------
export async function fetchLists(): Promise<List[]> {
  const rows = check(await supabase.from("lists")
    .select("id, name, owner_id, created_at, list_members(count), items(done)")
    .order("created_at")) as unknown as Array<{
      id: string; name: string; owner_id: string; created_at: string;
      list_members: { count: number }[]; items: { done: boolean }[];
    }>;
  return rows.map(r => ({
    id: r.id, name: r.name, owner_id: r.owner_id, created_at: r.created_at,
    memberCount: r.list_members[0]?.count ?? 1,
    remaining: r.items.filter(i => !i.done).length,
  }));
}
export async function createList(name: string): Promise<string> {
  return (check(await supabase.rpc("create_list", { p_name: name.trim() })) as { id: string }).id;
}
export async function renameList(id: string, name: string) { check(await supabase.from("lists").update({ name: name.trim() }).eq("id", id)); }
export async function deleteList(id: string) { check(await supabase.from("lists").delete().eq("id", id)); }
export async function leaveList(id: string) { check(await supabase.rpc("leave_list", { p_list: id })); }
export async function setPrimaryList(userId: string, listId: string | null) {
  check(await supabase.from("profiles").update({ primary_list_id: listId }).eq("id", userId));
}

// ---------- Items and hearts ----------
export async function fetchItems(listId: string): Promise<Item[]> {
  return check(await supabase.from("items").select(ITEM_COLS).eq("list_id", listId)) as Item[];
}
export async function fetchHearts(listId: string): Promise<Heart[]> {
  return check(await supabase.from("item_hearts").select("item_id, user_id, list_id").eq("list_id", listId)) as Heart[];
}

/** Sends one waiting change to the server. */
export async function sendOp(op: Op): Promise<void> {
  switch (op.kind) {
    case "add": {
      const { id, list_id, text, position, added_by } = op.item;
      const res = await supabase.from("items").insert({ id, list_id, text, position, added_by });
      if (res.error?.code === "23505") return; // already saved on an earlier try
      check(res); return;
    }
    case "update": check(await supabase.from("items").update(op.change).eq("id", op.id)); return;
    case "delete": check(await supabase.from("items").delete().eq("id", op.id)); return;
    case "clear": {
      let q = supabase.from("items").delete().eq("list_id", op.listId);
      if (op.onlyDone) q = q.eq("done", true);
      check(await q); return;
    }
    case "heart": {
      if (op.on) {
        const res = await supabase.from("item_hearts").insert({ item_id: op.itemId, user_id: op.userId, list_id: op.listId });
        if (res.error?.code === "23505") return; // already hearted
        check(res);
      } else {
        check(await supabase.from("item_hearts").delete().eq("item_id", op.itemId).eq("user_id", op.userId));
      }
    }
  }
}

// ---------- People and sharing ----------
export async function fetchMembers(listId: string): Promise<Person[]> {
  const ids = (check(await supabase.from("list_members").select("user_id").eq("list_id", listId)) as { user_id: string }[]).map(r => r.user_id);
  if (ids.length === 0) return [];
  return check(await supabase.from("profiles").select("id, display_name, initials").in("id", ids)) as Person[];
}
export async function fetchFriends(): Promise<Person[]> { return check(await supabase.rpc("my_friends")) as Person[]; }
export async function createInvite(listId: string): Promise<string> { return check(await supabase.rpc("create_invite", { p_list: listId })) as string; }
export async function joinList(code: string): Promise<string> { return check(await supabase.rpc("join_list", { p_code: code })) as string; }
export async function addFriendToList(listId: string, friendId: string) {
  check(await supabase.rpc("add_friend_to_list", { p_list: listId, p_friend: friendId }));
}
