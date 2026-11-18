import { supabase } from "../supabase";
import { initialsFor } from "./initials";

export interface Profile { id: string; display_name: string; initials: string; primary_list_id: string | null }

/** Your We Got Lists profile, or null if you haven't picked a name yet. */
export async function loadMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("id, display_name, initials, primary_list_id").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Creates or updates your profile with a new display name. */
export async function saveMyProfile(userId: string, displayName: string): Promise<Profile> {
  const name = displayName.trim().replace(/\s+/g, " ");
  const row = { id: userId, display_name: name, initials: initialsFor(name) };
  const { data, error } = await supabase.from("profiles").upsert(row).select("id, display_name, initials, primary_list_id").single();
  if (error) throw error;
  return data;
}
