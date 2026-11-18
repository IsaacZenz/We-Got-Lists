// Everything the app asks the database about lists and items.
import { supabase } from "../supabase";
import type { Item, List } from "./types";

const ITEM_COLS = "id, list_id, text, done, done_at, position, added_by, created_at";

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

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
  const row = check(await supabase.rpc("create_list", { p_name: name.trim() })) as { id: string };
  return row.id;
}

export async function renameList(id: string, name: string) {
  check(await supabase.from("lists").update({ name: name.trim() }).eq("id", id));
}

export async function deleteList(id: string) {
  check(await supabase.from("lists").delete().eq("id", id));
}

export async function setPrimaryList(userId: string, listId: string | null) {
  check(await supabase.from("profiles").update({ primary_list_id: listId }).eq("id", userId));
}

export async function fetchItems(listId: string): Promise<Item[]> {
  return check(await supabase.from("items").select(ITEM_COLS).eq("list_id", listId)) as Item[];
}

export async function addItem(listId: string, text: string, position: number, userId: string): Promise<Item> {
  return check(await supabase.from("items")
    .insert({ list_id: listId, text: text.trim(), position, added_by: userId })
    .select(ITEM_COLS).single()) as Item;
}

export async function updateItem(id: string, change: Partial<Pick<Item, "done" | "position" | "text">>) {
  check(await supabase.from("items").update(change).eq("id", id));
}

export async function deleteItem(id: string) {
  check(await supabase.from("items").delete().eq("id", id));
}

/** "Clear got-it" removes crossed-off items; "Clear all" removes everything. */
export async function clearItems(listId: string, onlyDone: boolean) {
  let q = supabase.from("items").delete().eq("list_id", listId);
  if (onlyDone) q = q.eq("done", true);
  check(await q);
}
