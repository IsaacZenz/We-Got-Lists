import { createClient } from "@supabase/supabase-js";
import { DB_SCHEMA, SUPABASE_KEY, SUPABASE_URL } from "./config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: DB_SCHEMA } });
