import type { ReactNode } from "react";

/** A pixel-style "Are you sure?" pop-up. */
export function Confirm({ title, children, yes, onYes, onNo }:
  { title: string; children: ReactNode; yes: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={onNo}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="dialog-body">{children}</div>
        <div className="row">
          <button className="btn b-wood" onClick={onNo}>CANCEL</button>
          <button className="btn b-red" onClick={onYes}>{yes}</button>
        </div>
      </div>
    </div>
  );
}
