import { useEffect, useRef, useState, type FormEvent } from "react";
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as api from "./api";
import type { Heart, Item, List, Person } from "./types";
import { activeItems, doneItems, positionAfterMove, positionAtEnd } from "./order";
import { useListData } from "./useListData";
import { SharePanel } from "./SharePanel";
import { PixelIcon } from "../ui/PixelIcon";
import { Confirm } from "../ui/Confirm";
import { Message } from "../ui/Shell";
import { PullIndicator, usePullToRefresh } from "../ui/usePullToRefresh";
import { isNetworkError } from "../data/net";

type Ask = null | "clear-all" | "delete-list";

/** One list: add, cross off, delete, drag to reorder, clear, favourite, rename, share, hearts. */
export function ListView({ list, userId, isPrimary, onBack, onStar, onRenamed, onGone, onCountChange, onMembersChange }: {
  list: List; userId: string; isPrimary: boolean;
  onBack: () => void; onStar: () => void; onRenamed: (name: string) => void; onGone: () => void;
  onCountChange: (remaining: number) => void; onMembersChange: (count: number) => void;
}) {
  const data = useListData(list.id, userId, { onRenamed, onGone });
  const { items, hearts, members } = data;
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [people, setPeople] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [ask, setAsk] = useState<Ask>(null);
  const [whoFor, setWhoFor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // When the options menu opens at the bottom, scroll it into view.
  useEffect(() => { if (menu) menuRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [menu]);
  const pull = usePullToRefresh(data.refresh);

  const shared = (members.length || list.memberCount) > 1;
  const byId = new Map(members.map(m => [m.id, m]));

  useEffect(() => { if (items) onCountChange(items.filter(i => !i.done).length); }, [items?.length, items?.filter(i => !i.done).length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (members.length) onMembersChange(members.length); }, [members.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function add(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || !items) return;
    setText("");
    inputRef.current?.focus(); // keep the keyboard up for the next item
    const item: Item = { id: crypto.randomUUID(), list_id: list.id, text: t, done: false, done_at: null,
      position: positionAtEnd(items), added_by: userId, created_at: new Date().toISOString() };
    data.apply({ kind: "add", listId: list.id, item });
  }
  const toggle = (it: Item) => data.apply({ kind: "update", listId: list.id, id: it.id, change: { done: !it.done } });
  const remove = (it: Item) => data.apply({ kind: "delete", listId: list.id, id: it.id });
  const clear = (onlyDone: boolean) => data.apply({ kind: "clear", listId: list.id, onlyDone });
  const heart = (it: Item, on: boolean) => data.apply({ kind: "heart", listId: list.id, itemId: it.id, userId, on });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function onDragEnd(e: DragEndEvent) {
    if (!items || !e.over || e.active.id === e.over.id) return;
    const active = activeItems(items);
    const from = active.findIndex(i => i.id === e.active.id);
    const to = active.findIndex(i => i.id === e.over!.id);
    if (from < 0 || to < 0) return;
    data.apply({ kind: "update", listId: list.id, id: String(e.active.id), change: { position: positionAfterMove(active, from, to) } });
  }

  const online = (fn: () => Promise<void>) => fn().catch(e => setError(isNetworkError(e) ? "You're offline. That needs a connection." : (e as Error).message));

  async function saveName(e: FormEvent) {
    e.preventDefault();
    const n = (renaming ?? "").trim();
    if (!n) return;
    await online(async () => { await api.renameList(list.id, n); onRenamed(n); setRenaming(null); setMenu(false); });
  }
  const doDelete = () => { setAsk(null); void online(async () => { await api.deleteList(list.id); onGone(); }); };

  if (people) {
    return <SharePanel listId={list.id} listName={list.name} userId={userId} members={members}
      onChanged={() => void data.refresh()} onLeft={onGone} onClose={() => setPeople(false)} />;
  }

  const active = items ? activeItems(items) : [];
  const done = items ? doneItems(items) : [];
  const heartsFor = (id: string) => hearts.filter(h => h.item_id === id);
  const rowProps = (it: Item) => ({
    item: it, shared, by: it.added_by ? byId.get(it.added_by) : undefined, hearts: heartsFor(it.id), userId, people: byId,
    showWho: whoFor === it.id, onWho: () => setWhoFor(w => (w === it.id ? null : it.id)),
    onToggle: () => toggle(it), onDelete: () => remove(it), onHeart: (on: boolean) => heart(it, on),
  });

  return (
    <div className="list-view" ref={pull.ref}>
      <PullIndicator {...pull} />
      <button className="link back-link" onClick={onBack} aria-label="All lists"><PixelIcon name="back" px={2} /> All lists</button>
      <div className="win-head">
        {isPrimary && <span className="fav-star" title="Your favourite list"><PixelIcon name="star" /></span>}
        <h2 className="list-title">{list.name}</h2>
      </div>

      <div className="members">
        {shared && members.map(m => <span key={m.id} className="av" title={m.display_name}>{m.initials}</span>)}
        <span className={`live ${data.live ? "on" : ""}`}>
          {data.offline ? `○ OFFLINE${data.waiting ? ` · ${data.waiting} WAITING` : ""}` : data.waiting ? `↻ SAVING ${data.waiting}` : data.live ? "● LIVE" : "○ CONNECTING"}
        </span>
      </div>

      {(error || data.error) && <Message kind="error">{error || data.error} <button className="link" onClick={() => { setError(""); data.clearError(); }}>OK</button></Message>}

      <form className="add sticky" onSubmit={add}>
        <input ref={inputRef} className="add-in" placeholder="Add an item…" value={text} maxLength={200}
          onChange={e => setText(e.target.value)} aria-label="New item" enterKeyHint="done" />
        <button className="add-btn" disabled={!text.trim()} aria-label="Add item"><PixelIcon name="plus" /></button>
      </form>

      {items === null ? <p className="note">{data.offline ? "You're offline and this list hasn't been opened on this phone yet." : "Loading…"}</p> : (
        <>
          {active.length === 0 && done.length === 0 && <p className="note empty">Nothing on this list yet.</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={active.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="items">{active.map(it => <ActiveRow key={it.id} {...rowProps(it)} />)}</ul>
            </SortableContext>
          </DndContext>

          {done.length > 0 && (
            <>
              <div className="sep">— GOT IT! ({done.length}) —</div>
              <ul className="items">{done.map(it => <ItemRow key={it.id} {...rowProps(it)} />)}</ul>
            </>
          )}

          {(active.length > 0 || done.length > 0) && (
            <div className="row clear">
              <button className="btn b-green" disabled={done.length === 0} onClick={() => clear(true)}>CLEAR GOT IT</button>
              <button className="btn b-red" onClick={() => setAsk("clear-all")}>CLEAR ALL</button>
            </div>
          )}
        </>
      )}

      <div className="more-row">
        <button className={`more-btn ${menu ? "open" : ""}`} onClick={() => { setMenu(m => !m); setRenaming(null); }}
          aria-label="List options" aria-expanded={menu}><PixelIcon name="dots" px={3} /></button>
      </div>
      {menu && (
        <div className="menu" ref={menuRef}>
          {renaming === null ? (
            <div className="menu-btns">
              <button className="btn b-wood" onClick={() => { void data.refresh(); setMenu(false); }} aria-label="Refresh"><PixelIcon name="refresh" px={2} /> REFRESH</button>
              <button className="btn b-gold" onClick={() => { onStar(); setMenu(false); }}>
                {isPrimary ? "REMOVE FAVOURITE" : <><PixelIcon name="star" px={2} /> MAKE FAVOURITE</>}
              </button>
              <button className="btn b-blue" onClick={() => { setPeople(true); setMenu(false); }}>{shared ? "PEOPLE & SHARING" : "SHARE THIS LIST"}</button>
              <button className="btn b-wood" onClick={() => setRenaming(list.name)}>RENAME</button>
              <button className="btn b-red" onClick={() => setAsk("delete-list")}>{shared ? "DELETE FOR EVERYONE" : "DELETE LIST"}</button>
            </div>
          ) : (
            <form className="add" onSubmit={saveName}>
              <input className="add-in" value={renaming} maxLength={40} autoFocus onChange={e => setRenaming(e.target.value)} aria-label="List name" />
              <button className="btn b-green">SAVE</button>
            </form>
          )}
        </div>
      )}


      {ask === "clear-all" && (
        <Confirm title="CLEAR ALL?" yes="CLEAR ALL" onNo={() => setAsk(null)} onYes={() => { setAsk(null); clear(false); }}>
          This removes every item on <b>{list.name}</b>, crossed off or not{shared ? ", for everyone" : ""}. The list itself stays.
        </Confirm>
      )}
      {ask === "delete-list" && (
        <Confirm title={shared ? "DELETE FOR EVERYONE?" : "DELETE LIST?"} yes="DELETE" onNo={() => setAsk(null)} onYes={doDelete}>
          {shared
            ? <><b>{list.name}</b> will be deleted for <b>everyone</b> on it. To just remove it from your phone, use People &amp; Sharing → Leave instead.</>
            : <><b>{list.name}</b> and everything on it will be gone for good.</>}
        </Confirm>
      )}
    </div>
  );
}

interface RowProps {
  item: Item; shared: boolean; by?: Person; hearts: Heart[]; userId: string; people: Map<string, Person>;
  showWho: boolean; onWho: () => void; onToggle: () => void; onDelete: () => void; onHeart: (on: boolean) => void;
}

/** The parts of a row after the grip (shared by to-get and crossed-off rows). */
function RowBody(p: RowProps) {
  const mine = p.hearts.some(h => h.user_id === p.userId);
  const n = p.hearts.length;
  return (
    <>
      <button className={`box ${p.item.done ? "on" : ""}`} onClick={p.onToggle} aria-label={`${p.item.done ? "Un-cross" : "Cross off"} ${p.item.text}`}>
        {p.item.done && <PixelIcon name="check" px={2} />}
      </button>
      <span className="txt">
        {p.item.text}
        {p.showWho && n > 0 && <span className="who">❤ {p.hearts.map(h => p.people.get(h.user_id)?.display_name ?? "someone").join(", ")}</span>}
      </span>
      {p.shared && p.by && <span className="by" title={`Added by ${p.by.display_name}`}>{p.by.initials}</span>}
      {p.shared && (
        <span className="heart">
          <button className="icon-btn heart-btn" onClick={() => p.onHeart(!mine)} aria-label={`${mine ? "Un-heart" : "Heart"} ${p.item.text}`} aria-pressed={mine}>
            <PixelIcon name={mine ? "heart" : n ? "heartPink" : "heartOff"} px={2} />
          </button>
          {n > 0 && <button className="count-btn" onClick={p.onWho} aria-label={`Who hearted ${p.item.text}`}>{n}</button>}
        </span>
      )}
      <button className="icon-btn" onClick={p.onDelete} aria-label={`Delete ${p.item.text}`}><PixelIcon name="trash" px={2} /></button>
    </>
  );
}

function ItemRow(p: RowProps) {
  return <li className="item done"><span className="grip-space" /><RowBody {...p} /></li>;
}

/** A to-get item that can be dragged by its grip. */
function ActiveRow(p: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: p.item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} className={`item ${isDragging ? "drag" : ""}`}>
      <button ref={setActivatorNodeRef} className="grip" {...attributes} {...listeners} aria-label={`Move ${p.item.text}`}>
        <PixelIcon name="grip" px={2} />
      </button>
      <RowBody {...p} />
    </li>
  );
}
