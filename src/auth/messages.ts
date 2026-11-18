/** Turns Supabase's technical error messages into plain words. */
export function friendlyAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Check for typos, or tap \"Forgot password?\".";
  if (m.includes("email not confirmed")) return "Your email isn't confirmed yet. Tap the link in the email we sent you, then sign in here.";
  if (m.includes("already registered") || m.includes("already exists")) return "There's already an account with that email (maybe from Rate My Coconut Water). Just sign in with the same password.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return "Too many tries in a row. Wait a minute and try again.";
  if (m.includes("password") && (m.includes("at least") || m.includes("short") || m.includes("weak"))) return "That password is too short or too simple. Use at least 8 characters.";
  if (m.includes("same password") || m.includes("different from the old")) return "Pick a password different from your current one.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "That doesn't look like an email address.";
  if (m.includes("fetch") || m.includes("network") || m.includes("load failed")) return "Couldn't reach the server. Check your internet connection.";
  return message || "Something went wrong. Please try again.";
}
