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

export function App() {
  const { session, loading, recovering, doneRecovering } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined); // undefined = still loading
  const [profileError, setProfileError] = useState("");
  const [tab, setTab] = useState<Tab>("mine");
  const [showAccount, setShowAccount] = useState(false);
  const userId = session?.user.id;

  useEffect(() => {
    setProfile(undefined); setProfileError("");
    if (!userId) return;
    loadMyProfile(userId).then(setProfile).catch(e => setProfileError(friendlyAuthError(e.message)));
  }, [userId]);

  if (loading) return <Shell><Title>LOADING…</Title></Shell>;
  if (recovering && session) return <NewPasswordScreen onDone={doneRecovering} />;
  if (!session) return <AuthScreen />;

  if (profileError) return (
    <Shell><Title>UH OH</Title><Message kind="error">{profileError}</Message>
      <button className="btn b-blue" onClick={() => location.reload()}>TRY AGAIN</button></Shell>
  );
  if (profile === undefined) return <Shell><Title>LOADING…</Title></Shell>;
  if (profile === null) return <Shell><NameForm userId={session.user.id} onSaved={setProfile} /></Shell>;

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
        <AccountPanel email={session.user.email ?? ""} profile={profile} onProfile={setProfile} onClose={() => setShowAccount(false)} />
      ) : (
        <ListsHome profile={profile} onProfile={setProfile} tab={tab} setTab={setTab} />
      )}
    </Shell>
  );
}
