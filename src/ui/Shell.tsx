import type { ReactNode } from "react";
import { Meadow } from "../scene/Meadow";

/** The frame around every screen: sky + logo, the meadow strip, the parchment scroll, optional tab bar. */
export function Shell({ corner, children, tabs }: { corner?: ReactNode; children: ReactNode; tabs?: ReactNode }) {
  return (
    <div className="app">
      <div className="sky">
        <Meadow />
        <header className="top">
          <h1 className="logo"><span className="logo-1">WE GOT</span><span className="logo-2">LISTS</span></h1>
          {corner}
        </header>
        <div className="scene" />
      </div>
      <main className="scroll"><div className="scroll-body">{children}</div></main>
      {tabs}
    </div>
  );
}

export function Title({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return <div className="win-head">{icon}<h2>{children}</h2></div>;
}

/** A labelled text box in the parchment style. */
export function Field(props: { label: string; type?: string; value: string; onChange: (v: string) => void; autoComplete?: string; autoFocus?: boolean; maxLength?: number }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input type={props.type ?? "text"} value={props.value} onChange={e => props.onChange(e.target.value)}
        autoComplete={props.autoComplete} autoFocus={props.autoFocus} maxLength={props.maxLength}
        autoCapitalize={props.type === "email" || props.type === "password" ? "none" : "words"} spellCheck={false} />
    </label>
  );
}

export function Message({ kind, children }: { kind: "error" | "info" | "good"; children: ReactNode }) {
  return <div className={`msg msg-${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}
