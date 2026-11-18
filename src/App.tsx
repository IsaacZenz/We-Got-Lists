import { useEffect, useState } from "react";
import { useAuth } from "./auth/useAuth";
import { AuthScreen } from "./auth/AuthScreen";
import { NewPasswordScreen } from "./auth/NewPasswordScreen";
import { NameForm } from "./profile/NameScreen";
import { loadMyProfile, type Profile } from "./profile/profile";
import { AccountPanel } from "./AccountPanel";
import { Message, Shell, Title } from "./ui/Shell";
import { ListsHome, type Tab } from "./lists/ListsHome";
import { friendlyAuthError } from "./auth/messages";
import { outbox } from "./data/outbox";
import { readCache, writeCache } from "./data/cache";
import { isNetworkError } from "./data/net";

export function App() {
  const { session, loading, recovering, doneRecovering } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined); // undefined = still loading
  const [profileError, setProfileError] = useState("");
  const [tab, setTab] = useState<Tab>("mine");
  const [showAccount, setShowAccount] = useState(false);
  const userId = session?.user.id;

  useEffect(() => {
    setProfile(undefined); setProfileError("");
    if (!userId) { outbox.stop(); return; }
    outbox.start(userId);
    // Show the copy saved on this phone straight away, then update it from the server.
    const saved = readCache(userId).profile;
    if (saved) setProfile(saved);
    loadMyProfile(userId)
      .then(p => { setProfile(p); if (p) writeCache(userId, c => { c.profile = p; }); })
      .catch(e => {
        if (isNetworkError(e) && saved) return; // offline: keep using the saved copy
        setProfileError(friendlyAuthError(e.message));
      });
  }, [userId]);

  const updateProfile = (p: Profile) => { setProfile(p); writeCache(p.id, c => { c.profile = p; }); };

  if (loading) return <Shell><Title>LOADING…</Title></Shell>;
  if (recovering && session) return <NewPasswordScreen onDone={doneRecovering} />;
  if (!session) return <AuthScreen />;

  if (profileError) return (
    <Shell><Title>UH OH</Title><Message kind="error">{profileError}</Message>
      <button className="btn b-blue" onClick={() => location.reload()}>TRY AGAIN</button></Shell>
  );
  if (profile === undefined) return <Shell><Title>LOADING…</Title></Shell>;
  if (profile === null) return <Shell><NameForm userId={session.user.id} onSaved={updateProfile} /></Shell>;

  const corner = (
    <button className="me" onClick={() => setShowAccount(s => !s)} aria-label="Your account">
      <span className="av">{profile.initials}</span>
    </button>
  );
  const tabs = (
    <nav className="tabs">
      <button className={`tab ${tab === "mine" ? "on" : ""}`} onClick={() => { setTab("mine"); setShowAccount(false); }}>MY LISTS</button>
      <button className={`tab ${tab === "shared" ? "on" : ""}`} onClick={() => { setTab("shared"); setShowAccount(false); }}>SHARED</button>
    </nav>
  );

  return (
    <Shell corner={corner} tabs={tabs}>
      {showAccount ? (
        <AccountPanel email={session.user.email ?? ""} profile={profile} onProfile={updateProfile} onClose={() => setShowAccount(false)} />
      ) : (
        <ListsHome profile={profile} onProfile={updateProfile} tab={tab} setTab={setTab} />
      )}
    </Shell>
  );
}
