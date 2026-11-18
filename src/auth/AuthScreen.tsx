import { useState, type FormEvent } from "react";
import { supabase } from "../supabase";
import { Field, Message, Shell, Title } from "../ui/Shell";
import { appUrl } from "./useAuth";
import { friendlyAuthError } from "./messages";

type Mode = "signin" | "signup" | "forgot";
const MIN_PASSWORD = 8;

/** Sign in, create an account, or ask for a password-reset email. */
export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const switchTo = (m: Mode) => { setMode(m); setError(""); setInfo(""); };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setInfo("");
    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("Enter your email address.");
    if (mode !== "forgot" && password.length < (mode === "signup" ? MIN_PASSWORD : 1))
      return setError(mode === "signup" ? `Pick a password with at least ${MIN_PASSWORD} characters.` : "Enter your password.");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) setError(friendlyAuthError(error.message));
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo: appUrl() } });
        if (error) setError(friendlyAuthError(error.message));
        else if (!data.session) {
          // Email confirmation is on. (Supabase also lands here, silently, if the email already has an account.)
          setInfo(`Almost there! We sent a confirmation link to ${cleanEmail}. Tap it, then come back here and sign in. ` +
            `Already use Rate My Coconut Water? Then you already have an account — just sign in with that password.`);
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: appUrl() });
        if (error) setError(friendlyAuthError(error.message));
        else { setInfo(`If ${cleanEmail} has an account, a reset link is on its way. Open it on this phone.`); setMode("signin"); }
      }
    } catch (err) {
      setError(friendlyAuthError(String(err)));
    } finally {
      setBusy(false);
    }
  }

  const title = { signin: "SIGN IN", signup: "NEW ACCOUNT", forgot: "RESET PASSWORD" }[mode];
  const button = { signin: "SIGN IN", signup: "CREATE ACCOUNT", forgot: "SEND RESET LINK" }[mode];

  return (
    <Shell>
      <Title>{title}</Title>
      {mode === "signup" && <p className="note">Same login as Rate My Coconut Water, if you have one.</p>}
      {mode === "forgot" && <p className="note">We'll email you a link to pick a new password.</p>}
      <form onSubmit={submit} className="form" noValidate>
        <Field label="EMAIL" type="email" value={email} onChange={setEmail} autoComplete="email" />
        {mode !== "forgot" && (
          <Field label="PASSWORD" type="password" value={password} onChange={setPassword}
            autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        )}
        {error && <Message kind="error">{error}</Message>}
        {info && <Message kind="info">{info}</Message>}
        <button className="btn b-green wide" disabled={busy}>{busy ? "…" : button}</button>
      </form>
      <div className="links">
        {mode !== "signin" && <button className="link" onClick={() => switchTo("signin")}>Back to sign in</button>}
        {mode === "signin" && <button className="link" onClick={() => switchTo("signup")}>New here? Create an account</button>}
        {mode === "signin" && <button className="link" onClick={() => switchTo("forgot")}>Forgot password?</button>}
      </div>
    </Shell>
  );
}
