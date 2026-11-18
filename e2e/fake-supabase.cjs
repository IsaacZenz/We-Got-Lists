// A tiny pretend Supabase for screenshot tests: answers the app's requests from memory.
// Only understands the exact requests We Got Lists makes. Not used by the real app.
const crypto = require("crypto");

function makeFake({ user, profile = null, others = [] }) {
  const db = { profile, others, lists: [], members: [], items: [], hearts: [], invites: {} };
  const allProfiles = () => [db.profile, ...db.others].filter(Boolean);
  const inList = v => (v && v.startsWith("in.(") ? v.slice(4, -1).split(",").map(x => x.replace(/"/g, "")) : null);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, email: user.email, exp, role: "authenticated", aud: "authenticated" })}.sig`;
  const session = { access_token: jwt, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "r", user };
  const eq = (url, key) => { const v = url.searchParams.get(key); return v && v.startsWith("eq.") ? v.slice(3) : undefined; };
  const now = () => new Date().toISOString();

  const state = { offline: false };
  async function handle(route) {
    if (state.offline) return route.abort("internetdisconnected");
    const r = route.request();
    const url = new URL(r.url());
    const path = url.pathname;
    const method = r.method();
    const body = () => r.postDataJSON();
    const wantsOne = (r.headers()["accept"] || "").includes("vnd.pgrst.object");
    const reply = (json, status = 200) => route.fulfill({ status, json: wantsOne && Array.isArray(json) ? json[0] : json });

    if (path.endsWith("/auth/v1/token")) return route.fulfill({ json: session });
    if (path.endsWith("/auth/v1/user")) return route.fulfill({ json: user });
    if (path.endsWith("/auth/v1/logout")) return route.fulfill({ status: 204, body: "" });

    if (path.endsWith("/rest/v1/profiles")) {
      if (method === "GET") {
        const ids = inList(url.searchParams.get("id"));
        if (ids) return reply(allProfiles().filter(p => ids.includes(p.id)).map(({ id, display_name, initials }) => ({ id, display_name, initials })));
        return reply(db.profile ? [db.profile] : []);
      }
      if (method === "POST") { db.profile = { primary_list_id: null, ...(db.profile || {}), ...[].concat(body())[0] }; return reply([db.profile], 201); }
      if (method === "PATCH") { Object.assign(db.profile, body()); return route.fulfill({ status: 204, body: "" }); }
    }
    if (path.endsWith("/rest/v1/rpc/create_list")) {
      const l = { id: crypto.randomUUID(), name: body().p_name, owner_id: user.id, created_at: now() };
      db.lists.push(l); db.members.push({ list_id: l.id, user_id: user.id });
      return route.fulfill({ json: l });
    }
    if (path.endsWith("/rest/v1/rpc/create_invite")) { const code = "inv" + crypto.randomBytes(5).toString("hex"); db.invites[code] = body().p_list; return route.fulfill({ json: code }); }
    if (path.endsWith("/rest/v1/rpc/join_list")) {
      const l = db.invites[body().p_code]; if (!l) return route.fulfill({ status: 400, json: { message: "invite not found or expired", code: "P0001" } });
      if (!db.members.some(m => m.list_id === l && m.user_id === user.id)) db.members.push({ list_id: l, user_id: user.id });
      return route.fulfill({ json: l });
    }
    if (path.endsWith("/rest/v1/rpc/my_friends")) {
      const mine = db.members.filter(m => m.user_id === user.id).map(m => m.list_id);
      const ids = new Set(db.members.filter(m => mine.includes(m.list_id) && m.user_id !== user.id).map(m => m.user_id));
      return route.fulfill({ json: db.others.filter(o => ids.has(o.id)) });
    }
    if (path.endsWith("/rest/v1/rpc/add_friend_to_list")) { const b = body(); db.members.push({ list_id: b.p_list, user_id: b.p_friend }); return route.fulfill({ status: 204, body: "" }); }
    if (path.endsWith("/rest/v1/rpc/leave_list")) {
      const l = body().p_list; db.members = db.members.filter(m => !(m.list_id === l && m.user_id === user.id));
      if (!db.members.some(m => m.list_id === l)) db.lists = db.lists.filter(x => x.id !== l);
      return route.fulfill({ status: 204, body: "" });
    }
    if (path.endsWith("/rest/v1/list_members")) return reply(db.members.filter(m => m.list_id === eq(url, "list_id")).map(m => ({ user_id: m.user_id })));
    if (path.endsWith("/rest/v1/item_hearts")) {
      if (method === "GET") return reply(db.hearts.filter(h => h.list_id === eq(url, "list_id")));
      if (method === "POST") { db.hearts.push([].concat(body())[0]); return route.fulfill({ status: 201, body: "" }); }
      if (method === "DELETE") { const i = eq(url, "item_id"), u = eq(url, "user_id"); db.hearts = db.hearts.filter(h => !(h.item_id === i && h.user_id === u)); return route.fulfill({ status: 204, body: "" }); }
    }
    if (path.endsWith("/rest/v1/lists")) {
      const id = eq(url, "id");
      if (method === "GET") return reply(db.lists.map(l => ({ ...l,
        list_members: [{ count: db.members.filter(m => m.list_id === l.id).length }],
        items: db.items.filter(i => i.list_id === l.id).map(i => ({ done: i.done })) })));
      if (method === "PATCH") { Object.assign(db.lists.find(l => l.id === id), body()); return route.fulfill({ status: 204, body: "" }); }
      if (method === "DELETE") { if (db.profile?.primary_list_id === id) db.profile.primary_list_id = null; db.lists = db.lists.filter(l => l.id !== id); db.items = db.items.filter(i => i.list_id !== id); return route.fulfill({ status: 204, body: "" }); }
    }
    if (path.endsWith("/rest/v1/items")) {
      const id = eq(url, "id"), listId = eq(url, "list_id"), done = eq(url, "done");
      if (method === "GET") return reply(db.items.filter(i => i.list_id === listId));
      if (method === "POST") {
        const it = { id: crypto.randomUUID(), done: false, done_at: null, created_at: now(), ...[].concat(body())[0] };
        db.items.push(it); return route.fulfill({ status: 201, body: "" });
      }
      if (method === "PATCH") {
        const it = db.items.find(i => i.id === id); const ch = body();
        if ("done" in ch) it.done_at = ch.done ? now() : null;
        Object.assign(it, ch); return route.fulfill({ status: 204, body: "" });
      }
      if (method === "DELETE") {
        db.items = db.items.filter(i => !(id ? i.id === id : i.list_id === listId && (done === undefined || String(i.done) === done)));
        return route.fulfill({ status: 204, body: "" });
      }
    }
    console.log("fake-supabase: unhandled", method, url.pathname + url.search);
    return route.fulfill({ status: 404, json: { message: "not in fake" } });
  }
    /** Test helper: make a list that someone else owns and shares with you. */
  function seedSharedList(name, ownerId, items) {
    const l = { id: crypto.randomUUID(), name, owner_id: ownerId, created_at: now() };
    db.lists.push(l); db.members.push({ list_id: l.id, user_id: ownerId }, { list_id: l.id, user_id: user.id });
    items.forEach((it, k) => db.items.push({ id: crypto.randomUUID(), list_id: l.id, done: false, done_at: null, created_at: now(), position: k + 1, ...it }));
    return l;
  }
  return { db, handle, session, seedSharedList, state };
}
module.exports = { makeFake };
