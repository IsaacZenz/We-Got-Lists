export interface List {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  memberCount: number; // > 1 means the list is shared
  remaining: number;   // items not crossed off yet
}

export interface Item {
  id: string;
  list_id: string;
  text: string;
  done: boolean;
  done_at: string | null;
  position: number;
  added_by: string | null;
  created_at: string;
}

export interface Heart { item_id: string; user_id: string; list_id: string }

export interface Person { id: string; display_name: string; initials: string }
