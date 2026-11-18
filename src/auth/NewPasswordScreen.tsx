import { useState, type FormEvent } from "react";
import { supabase } from "../supabase";
import { Field, Message, Shell, Title } from "../ui/Shell";
import { friendlyAuthError } from "./messages";

/** Shown after opening a password-reset link from the email. */
export function NewPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Pick a password with at least 8 characters.");
    setBusy(true); setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(friendlyAuthError(error.message)); else onDone();
  }

  return (
    <Shell>
      <Title>NEW PASSWORD</Title>
      <p className="note">Pick a new password. It changes it for Rate My Coconut Water too.</p>
      <form onSubmit={submit} className="form" noValidate>
        <Field label="NEW PASSWORD" type="password" value={password} onChange={setPassword} autoComplete="new-password" autoFocus />
        {error && <Message kind="error">{error}</Message>}
        <button className="btn b-green wide" disabled={busy}>{busy ? "…" : "SAVE PASSWORD"}</button>
      </form>
    </Shell>
  );
}
