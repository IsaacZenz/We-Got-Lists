import { useState } from "react";
import { supabase } from "./supabase";
import { Message } from "./ui/Shell";
import { NameForm } from "./profile/NameScreen";
import type { Profile } from "./profile/profile";
import { appUrl } from "./auth/useAuth";
import { friendlyAuthError } from "./auth/messages";
import { clearAllCaches } from "./data/cache";

/** Opened by tapping your initials in the corner. */
export function AccountPanel({ email, profile, onProfile, onClose }:
  { email: string; profile: Profile; onProfile: (p: Profile) => void; onClose: () => void }) {
  const [msg, setMsg] = useState<{ kind: "info" | "error"; text: string } | null>(null);

  async function sendReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl() });
    setMsg(error ? { kind: "error", text: friendlyAuthError(error.message) } : { kind: "info", text: `Reset link sent to ${email}. Open it on this phone.` });
  }

  return (
    <div className="account">
      <button className="link back" onClick={onClose}>◀ Back</button>
      <NameForm userId={profile.id} current={profile.display_name} onSaved={p => { onProfile(p); onClose(); }} title="YOUR ACCOUNT" />
      <div className="account-email">Signed in as <b>{email}</b></div>
      {msg && <Message kind={msg.kind}>{msg.text}</Message>}
      <div className="row">
        <button className="btn b-blue" onClick={sendReset}>CHANGE PASSWORD</button>
        <button className="btn b-red" onClick={async () => { await supabase.auth.signOut(); clearAllCaches(); }}>SIGN OUT</button>
      </div>
    </div>
  );
}
