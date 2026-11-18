import { createClient } from "@supabase/supabase-js";
import { DB_SCHEMA, SUPABASE_KEY, SUPABASE_URL } from "./config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: DB_SCHEMA } });

export type ConnectionStatus =
  | { ok: true }
  | { ok: false; reason: "schema-not-exposed" | "setup-script-not-run" | "offline" | "other"; detail: string };

/** Asks the database "are you there?" and explains what's wrong if it isn't. */
export async function checkConnection(): Promise<ConnectionStatus> {
  try {
    const { data, error } = await supabase.rpc("ping");
    if (!error && data === "pong") return { ok: true };
    const detail = error ? `${error.code ?? ""} ${error.message}`.trim() : `unexpected reply: ${JSON.stringify(data)}`;
    if (!error?.code && /fetch|network|load failed/i.test(error?.message ?? "")) return { ok: false, reason: "offline", detail };
    if (error?.code === "PGRST106") return { ok: false, reason: "schema-not-exposed", detail };
    if (error?.code === "PGRST202" || error?.code === "42883" || error?.code === "3F000") return { ok: false, reason: "setup-script-not-run", detail };
    return { ok: false, reason: "other", detail };
  } catch (e) {
    return { ok: false, reason: "offline", detail: String(e) };
  }
}
