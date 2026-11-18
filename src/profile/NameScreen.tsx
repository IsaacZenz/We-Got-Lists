import { useState, type FormEvent } from "react";
import { Field, Message, Title } from "../ui/Shell";
import { initialsFor } from "./initials";
import { saveMyProfile, type Profile } from "./profile";
import { friendlyAuthError } from "../auth/messages";

/** Pick (or change) the name friends see on shared lists. Rendered inside a Shell. */
export function NameForm({ userId, current, onSaved, title = "WHAT'S YOUR NAME?" }:
  { userId: string; current?: string; onSaved: (p: Profile) => void; title?: string }) {
  const [name, setName] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Type a name, nickname is fine.");
    setBusy(true); setError("");
    try { onSaved(await saveMyProfile(userId, name)); }
    catch (err) { setError(friendlyAuthError((err as Error).message ?? String(err))); }
    finally { setBusy(false); }
  }

  return (
    <>
      <Title>{title}</Title>
      <p className="note">Friends see this on lists you share. Your initials go on items you add.</p>
      <form onSubmit={submit} className="form" noValidate>
        <Field label="DISPLAY NAME" value={name} onChange={setName} autoComplete="nickname" maxLength={30} autoFocus={!current} />
        <div className="preview">You'll show up as <span className="av">{initialsFor(name || "?")}</span></div>
        {error && <Message kind="error">{error}</Message>}
        <button className="btn b-green wide" disabled={busy}>{busy ? "…" : "SAVE"}</button>
      </form>
    </>
  );
}
