import { useState, type FormEvent } from "react";
import type { List } from "./types";
import { PixelIcon } from "../ui/PixelIcon";
import { Title } from "../ui/Shell";

/** All your lists in this tab, with stars, plus a box to make a new one. */
export function ListsOverview({ lists, primaryId, shared, onOpen, onStar, onCreate }: {
  lists: List[]; primaryId: string | null; shared: boolean;
  onOpen: (id: string) => void; onStar: (id: string) => void; onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try { await onCreate(name); setName(""); } finally { setBusy(false); }
  }

  return (
    <>
      <Title>{shared ? "SHARED LISTS" : "MY LISTS"}</Title>
      {lists.length === 0 && (
        <p className="note">{shared
          ? "No shared lists yet. Open one of your lists, tap ⋯ and choose Share to invite someone."
          : "No lists yet. Make your first one below!"}</p>
      )}
      <ul className="lists">
        {lists.map(l => (
          <li key={l.id}>
            <button className="star-btn" onClick={() => onStar(l.id)} aria-label={l.id === primaryId ? "Primary list (tap to unstar)" : "Make this my primary list"}>
              <PixelIcon name={l.id === primaryId ? "star" : "starOff"} />
            </button>
            <button className="list-open" onClick={() => onOpen(l.id)}>
              <span className="list-name">{l.name}</span>
              {shared && <span className="ppl"><PixelIcon name="people" px={1} /> {l.memberCount}</span>}
              <span className="count">{l.remaining}</span>
            </button>
          </li>
        ))}
      </ul>
      {!shared && (
        <form className="add" onSubmit={submit}>
          <input className="add-in" placeholder="New list name…" value={name} maxLength={40}
            onChange={e => setName(e.target.value)} aria-label="New list name" />
          <button className="add-btn" disabled={busy || !name.trim()} aria-label="Make list"><PixelIcon name="plus" /></button>
        </form>
      )}
    </>
  );
}
