import { useEffect, useRef, useState, type FormEvent } from "react";
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as api from "./api";
import type { Item, List } from "./types";
import { activeItems, doneItems, positionAfterMove, positionAtEnd } from "./order";
import { PixelIcon } from "../ui/PixelIcon";
import { Confirm } from "../ui/Confirm";
import { Message } from "../ui/Shell";

type Ask = null | "clear-all" | "delete-list";

/** One list: add, cross off, delete, drag to reorder, clear, star, rename, delete. */
export function ListView({ list, userId, isPrimary, onBack, onStar, onRenamed, onDeleted, onCountChange }: {
  list: List; userId: string; isPrimary: boolean;
  onBack: () => void; onStar: () => void; onRenamed: (name: string) => void; onDeleted: () => void;
  onCountChange: (remaining: number) => void;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [ask, setAsk] = useState<Ask>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => api.fetchItems(list.id).then(setItems).catch(e => setError(e.message));
  useEffect(() => { setItems(null); load(); }, [list.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (items) onCountChange(items.filter(i => !i.done).length); }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Change the screen right away, then save. If saving fails, reload the truth from the server. */
  async function optimistic(change: (cur: Item[]) => Item[], save: () => Promise<unknown>) {
    setItems(cur => (cur ? change(cur) : cur));
    try { await save(); } catch (e) { setError(`Couldn't save that: ${(e as Error).message}`); load(); }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || !items) return;
    setText("");
    inputRef.current?.focus(); // keep the keyboard up for the next item
    const tempId = `temp-${Date.now()}`;
    const position = positionAtEnd(items);
    const temp: Item = { id: tempId, list_id: list.id, text: t, done: false, done_at: null, position, added_by: userId, created_at: new Date().toISOString() };
    setItems(cur => [...(cur ?? []), temp]);
    try {
      const saved = await api.addItem(list.id, t, position, userId);
      setItems(cur => cur?.map(i => (i.id === tempId ? saved : i)) ?? null);
    } catch (err) {
      setError(`Couldn't add "${t}": ${(err as Error).message}`);
      setItems(cur => cur?.filter(i => i.id !== tempId) ?? null);
    }
  }

  const toggle = (it: Item) => optimistic(
    cur => cur.map(i => (i.id === it.id ? { ...i, done: !i.done, done_at: i.done ? null : new Date().toISOString() } : i)),
    () => api.updateItem(it.id, { done: !it.done }),
  );
  const remove = (it: Item) => optimistic(cur => cur.filter(i => i.id !== it.id), () => api.deleteItem(it.id));
  const clear = (onlyDone: boolean) => optimistic(cur => (onlyDone ? cur.filter(i => !i.done) : []), () => api.clearItems(list.id, onlyDone));

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function onDragEnd(e: DragEndEvent) {
    if (!items || !e.over || e.active.id === e.over.id) return;
    const active = activeItems(items);
    const from = active.findIndex(i => i.id === e.active.id);
    const to = active.findIndex(i => i.id === e.over!.id);
    if (from < 0 || to < 0) return;
    const position = positionAfterMove(active, from, to);
    const id = String(e.active.id);
    optimistic(cur => cur.map(i => (i.id === id ? { ...i, position } : i)), () => api.updateItem(id, { position }));
  }

  async function saveName(e: FormEvent) {
    e.preventDefault();
    const n = (renaming ?? "").trim();
    if (!n) return;
    try { await api.renameList(list.id, n); onRenamed(n); setRenaming(null); setMenu(false); }
    catch (err) { setError((err as Error).message); }
  }

  async function doDelete() {
    setAsk(null);
    try { await api.deleteList(list.id); onDeleted(); } catch (err) { setError((err as Error).message); }
  }

  const active = items ? activeItems(items) : [];
  const done = items ? doneItems(items) : [];

  return (
    <div className="list-view">
      <div className="win-head">
        <button className="icon-btn" onClick={onBack} aria-label="All lists"><PixelIcon name="back" px={3} /></button>
        <button className="star-btn" onClick={onStar} aria-label={isPrimary ? "Primary list (tap to unstar)" : "Make this my primary list"}>
          <PixelIcon name={isPrimary ? "star" : "starOff"} />
        </button>
        <h2 className="list-title">{list.name}</h2>
        <button className="icon-btn" onClick={() => setMenu(m => !m)} aria-label="List options"><PixelIcon name="dots" px={3} /></button>
      </div>

      {menu && (
        <div className="menu">
          {renaming === null ? (
            <div className="row">
              <button className="btn b-blue" onClick={() => setRenaming(list.name)}>RENAME</button>
              <button className="btn b-red" onClick={() => setAsk("delete-list")}>DELETE LIST</button>
            </div>
          ) : (
            <form className="add" onSubmit={saveName}>
              <input className="add-in" value={renaming} maxLength={40} autoFocus onChange={e => setRenaming(e.target.value)} aria-label="List name" />
              <button className="btn b-green">SAVE</button>
            </form>
          )}
        </div>
      )}

      {error && <Message kind="error">{error} <button className="link" onClick={() => setError("")}>OK</button></Message>}

      <form className="add" onSubmit={add}>
        <input ref={inputRef} className="add-in" placeholder="Add an item…" value={text} maxLength={200}
          onChange={e => setText(e.target.value)} aria-label="New item" enterKeyHint="done" />
        <button className="add-btn" disabled={!text.trim()} aria-label="Add item"><PixelIcon name="plus" /></button>
      </form>

      {items === null ? <p className="note">Loading…</p> : (
        <>
          {active.length === 0 && done.length === 0 && <p className="note empty">Nothing on this list yet.</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={active.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="items">
                {active.map(it => <ActiveRow key={it.id} item={it} onToggle={() => toggle(it)} onDelete={() => remove(it)} />)}
              </ul>
            </SortableContext>
          </DndContext>

          {done.length > 0 && (
            <>
              <div className="sep">— GOT IT! ({done.length}) —</div>
              <ul className="items">
                {done.map(it => (
                  <li key={it.id} className="item done">
                    <span className="grip-space" />
                    <button className="box on" onClick={() => toggle(it)} aria-label={`Un-cross ${it.text}`}><PixelIcon name="check" px={2} /></button>
                    <span className="txt">{it.text}</span>
                    <button className="icon-btn" onClick={() => remove(it)} aria-label={`Delete ${it.text}`}><PixelIcon name="trash" px={2} /></button>
                  </li>
                ))}
              </ul>
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

      {ask === "clear-all" && (
        <Confirm title="CLEAR ALL?" yes="CLEAR ALL" onNo={() => setAsk(null)} onYes={() => { setAsk(null); clear(false); }}>
          This removes every item on <b>{list.name}</b>, crossed off or not. The list itself stays.
        </Confirm>
      )}
      {ask === "delete-list" && (
        <Confirm title="DELETE LIST?" yes="DELETE" onNo={() => setAsk(null)} onYes={doDelete}>
          <b>{list.name}</b> and everything on it will be gone for good.
        </Confirm>
      )}
    </div>
  );
}

/** A to-get item that can be dragged by its grip. */
function ActiveRow({ item, onToggle, onDelete }: { item: Item; onToggle: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} className={`item ${isDragging ? "drag" : ""}`}>
      <button ref={setActivatorNodeRef} className="grip" {...attributes} {...listeners} aria-label={`Move ${item.text}`}>
        <PixelIcon name="grip" px={2} />
      </button>
      <button className="box" onClick={onToggle} aria-label={`Cross off ${item.text}`} />
      <span className="txt">{item.text}</span>
      <button className="icon-btn" onClick={onDelete} aria-label={`Delete ${item.text}`}><PixelIcon name="trash" px={2} /></button>
    </li>
  );
}
