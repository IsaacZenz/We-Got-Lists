import { useEffect, useState } from "react";
import { Meadow } from "./scene/Meadow";
import { PixelIcon } from "./ui/PixelIcon";
import { checkConnection, type ConnectionStatus } from "./supabase";

const HELP: Record<string, string> = {
  "schema-not-exposed": "Supabase isn't sharing the 'wgl' tables yet. In Supabase: Project Settings → Data API → Exposed schemas → add wgl → Save.",
  "setup-script-not-run": "The database setup script hasn't been run yet. Paste supabase/001-setup.sql into Supabase's SQL Editor and press Run.",
  offline: "Couldn't reach Supabase. Check your internet connection.",
  other: "Something unexpected went wrong talking to Supabase.",
};

export function App() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [tab, setTab] = useState<"mine" | "shared">("mine");
  const recheck = () => { setStatus(null); checkConnection().then(setStatus); };
  useEffect(recheck, []);

  return (
    <div className="app">
      <div className="sky">
        <Meadow />
        <header className="top">
        <h1 className="logo"><span className="logo-1">WE GOT</span><span className="logo-2">LISTS</span></h1>
        <div className="badge"><PixelIcon name="people" px={2} /> 1</div>
        </header>
        <div className="scene" />
      </div>

      <main className="scroll">
        <div className="scroll-body">
          <div className="win-head">
            <PixelIcon name="star" />
            <h2>WELCOME!</h2>
          </div>
          <p className="note">The meadow is open. Lists, sign-in and sharing arrive in the next milestones.</p>

          <div className={`status ${status ? (status.ok ? "good" : "bad") : "wait"}`} data-testid="status">
            {status === null && "CHECKING SUPABASE…"}
            {status?.ok && "● CONNECTED TO SUPABASE"}
            {status && !status.ok && <>✕ NOT CONNECTED<p className="help">{HELP[status.reason]}</p><code>{status.detail}</code></>}
          </div>
          <button className="btn b-blue" onClick={recheck}>CHECK AGAIN</button>
          <p className="version">v{__APP_VERSION__}</p>
        </div>
      </main>

      <nav className="tabs">
        <button className={`tab ${tab === "mine" ? "on" : ""}`} onClick={() => setTab("mine")}>MY LISTS</button>
        <button className={`tab ${tab === "shared" ? "on" : ""}`} onClick={() => setTab("shared")}>SHARED</button>
      </nav>
    </div>
  );
}
