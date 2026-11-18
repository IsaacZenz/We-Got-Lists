import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";

/** Who is signed in. `recovering` is true after opening a password-reset link. */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") setRecovering(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, loading, recovering, doneRecovering: () => setRecovering(false) };
}

/** Where links in Supabase emails should send people back to (this app). */
export const appUrl = () => window.location.origin + import.meta.env.BASE_URL;
