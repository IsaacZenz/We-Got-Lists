import { useEffect, useState } from "react";
import * as api from "./api";
import type { Person } from "./types";
import { appUrl } from "../auth/useAuth";
import { Message } from "../ui/Shell";
import { Confirm } from "../ui/Confirm";
import { isNetworkError } from "../data/net";

/** Who's on this list, invite links, quick-add friends, and leaving. */
export function SharePanel({ listId, listName, userId, members, onChanged, onLeft, onClose }: {
  listId: string; listName: string; userId: string; members: Person[];
  onChanged: () => void; onLeft: () => void; onClose: () => void;
}) {
  const [friends, setFriends] = useState<Person[] | null>(null);
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState<{ kind: "info" | "error" | "good"; text: string } | null>(null);
  const [askLeave, setAskLeave] = useState(false);

  useEffect(() => { api.fetchFriends().then(setFriends).catch(() => setFriends([])); }, []);

  const fail = (e: unknown) => setMsg({ kind: "error", text: isNetworkError(e) ? "You're offline. Sharing needs a connection." : (e as Error).message });

  async function invite() {
    setMsg(null);
    try {
      const code = await api.createInvite(listId);
      const url = `${appUrl()}?join=${code}`;
      setLink(url);
      const text = `Join my "${listName}" list on We Got Lists!`;
      if (navigator.share) {
        try { await navigator.share({ title: "We Got Lists", text, url }); return; } catch { /* cancelled: show the link instead */ }
      }
      try { await navigator.clipboard.writeText(url); setMsg({ kind: "good", text: "Invite link copied! Paste it in a text to your friend." }); }
      catch { setMsg({ kind: "info", text: "Copy the link below and send it to your friend." }); }
    } catch (e) { fail(e); }
  }

  async function add(f: Person) {
    try { await api.addFriendToList(listId, f.id); setMsg({ kind: "good", text: `${f.display_name} can now see this list.` }); onChanged(); }
    catch (e) { fail(e); }
  }

  async function leave() {
    setAskLeave(false);
    try { await api.leaveList(listId); onLeft(); } catch (e) { fail(e); }
  }

  const onList = new Set(members.map(m => m.id));
  const addable = (friends ?? []).filter(f => !onList.has(f.id));

  return (
    <div className="share">
      <button className="link back" onClick={onClose}>◀ Back to the list</button>
      <h3 className="sub">ON THIS LIST</h3>
      <ul className="people">
        {members.map(m => (
          <li key={m.id}><span className="av">{m.initials}</span> {m.display_name}{m.id === userId ? " (you)" : ""}</li>
        ))}
      </ul>

      <h3 className="sub">INVITE SOMEONE</h3>
      <p className="note small">Send a link. Whoever opens it (and signs in) joins this list. Links last 14 days.</p>
      <button className="btn b-blue wide" onClick={invite}>SHARE INVITE LINK</button>
      {link && <input className="add-in linkbox" readOnly value={link} onFocus={e => e.currentTarget.select()} aria-label="Invite link" />}

      {addable.length > 0 && (
        <>
          <h3 className="sub">ADD A FRIEND</h3>
          <p className="note small">People you already share a list with.</p>
          <ul className="people">
            {addable.map(f => (
              <li key={f.id}><span className="av">{f.initials}</span> <span className="grow">{f.display_name}</span>
                <button className="btn b-green small" onClick={() => add(f)}>+ ADD</button></li>
            ))}
          </ul>
        </>
      )}

      {msg && <Message kind={msg.kind}>{msg.text}</Message>}

      <button className="btn b-wood wide leave" onClick={() => setAskLeave(true)}>LEAVE THIS LIST</button>
      {askLeave && (
        <Confirm title="LEAVE LIST?" yes="LEAVE" onNo={() => setAskLeave(false)} onYes={leave}>
          {members.length > 1
            ? <><b>{listName}</b> will disappear from your phone. Everyone else keeps it. Someone can invite you back.</>
            : <>You're the only one on <b>{listName}</b>, so leaving deletes it.</>}
        </Confirm>
      )}
    </div>
  );
}
