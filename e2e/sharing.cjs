// Walks through sharing, hearts and offline on an emulated iPhone with the fake Supabase.
// Run: npx vite build && npx vite preview --port 4173 &  then: node e2e/sharing.cjs [outDir]
const { chromium, devices } = require("playwright");
const { makeFake } = require("./fake-supabase.cjs");
const OUT = (process.argv[2] || "e2e/out") + "/";
require("fs").mkdirSync(OUT, { recursive: true });
const URL = "http://localhost:4173/We-Got-Lists/";

(async () => {
  const user = { id: "11111111-1111-1111-1111-111111111111", email: "isaac@example.com", aud: "authenticated", role: "authenticated" };
  const jo = { id: "22222222-2222-2222-2222-222222222222", display_name: "Jo Marsh", initials: "JM" };
  const sam = { id: "33333333-3333-3333-3333-333333333333", display_name: "Sam Lee", initials: "SL" };
  const fake = makeFake({ user, profile: { id: user.id, display_name: "Isaac Zenz", initials: "IZ", primary_list_id: null }, others: [jo, sam] });
  const bbq = fake.seedSharedList("Weekend BBQ", jo.id, [
    { text: "Burger buns", added_by: jo.id }, { text: "Charcoal", added_by: jo.id }, { text: "Corn on the cob", added_by: user.id }]);
  const charcoal = fake.db.items.find(i => i.text === "Charcoal");
  fake.db.hearts.push({ item_id: charcoal.id, user_id: jo.id, list_id: bbq.id });

  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices["iPhone 13"] });
  await ctx.route("**/*.supabase.co/**", fake.handle);
  const p = await ctx.newPage();
  p.on("pageerror", e => console.log("PAGE ERROR:", e.message));
  const shot = async n => { await p.waitForTimeout(300); await p.screenshot({ path: OUT + n + ".png" }); };
  const step = (msg, ok) => console.log(ok ? "PASS" : "FAIL", msg);
  const texts = () => p.locator(".items .item .txt").allTextContents();

  await p.goto(URL);
  await p.fill("input[type=email]", user.email); await p.fill("input[type=password]", "pw"); await p.click("button.btn");
  await p.waitForSelector("h2:has-text('MY LISTS')");

  // ---- Shared tab, initials, hearts
  await p.click(".tab:has-text('SHARED')");
  await p.waitForSelector("text=Weekend BBQ");
  step("shared list appears in the Shared tab", true);
  await p.click("text=Weekend BBQ"); await p.waitForSelector("h2.list-title:has-text('Weekend BBQ')");
  await p.waitForSelector(".members .av >> nth=1");
  step("members row shows both people", (await p.locator(".members .av").allTextContents()).sort().join() === "IZ,JM");
  step("items show who added them", (await p.locator(".by").allTextContents()).includes("JM"));
  await p.click("button[aria-label='Heart Burger buns']"); await p.waitForTimeout(300);
  step("hearting saves to the server", fake.db.hearts.some(h => h.user_id === user.id));
  await p.click("button[aria-label='Who hearted Charcoal']");
  step("tapping the count shows who hearted", (await p.textContent(".who")).includes("Jo Marsh"));
  await p.fill("input[aria-label='New item']", "Ice"); await p.keyboard.press("Enter"); await p.waitForTimeout(400);
  step("my new item is saved with my id", fake.db.items.some(i => i.text === "Ice" && i.added_by === user.id));
  await p.evaluate(() => document.activeElement.blur());
  await shot("m4-1-shared-list");

  // ---- Offline: changes wait, then send
  fake.state.offline = true; await ctx.setOffline(true);
  await p.fill("input[aria-label='New item']", "Paper plates"); await p.keyboard.press("Enter");
  await p.click("button[aria-label='Cross off Charcoal']"); await p.waitForTimeout(400);
  step("offline: item still appears right away", (await texts()).includes("Paper plates"));
  step("offline: status says changes are waiting", /OFFLINE · 2 WAITING/.test(await p.textContent(".live")));
  await p.evaluate(() => document.activeElement.blur());
  await shot("m6-1-offline");
  await p.reload({ timeout: 10000 }).catch(e => console.log("reload:", e.message.split("\n")[0]));
  await p.waitForTimeout(1500); await shot("m6-2-offline-reopen");
  step("offline: app itself opens with no signal", await p.isVisible(".logo"));
  await p.click(".tab:has-text('SHARED')"); await p.click("text=Weekend BBQ", { timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(500);
  step("offline: saved list + waiting changes still shown", (await texts().catch(() => [])).includes("Paper plates"));
  fake.state.offline = false; await ctx.setOffline(false);
  await p.waitForTimeout(2500);
  step("back online: waiting changes reach the server", fake.db.items.some(i => i.text === "Paper plates") && fake.db.items.find(i => i.text === "Charcoal").done);
  step("back online: status clears", !/WAITING|SAVING/.test(await p.textContent(".live")));

  // ---- Share one of my lists with a friend
  await p.click("button[aria-label='All lists']"); await p.click(".tab:has-text('MY LISTS')");
  await p.fill("input[aria-label='New list name']", "Groceries"); await p.click("button[aria-label='Make list']");
  await p.waitForSelector("h2.list-title:has-text('Groceries')");
  await p.click("button[aria-label='List options']"); await p.click("text=SHARE THIS LIST");
  await p.click("text=SHARE INVITE LINK"); await p.waitForSelector(".linkbox");
  const link = await p.inputValue(".linkbox");
  step(`invite link made (${link.replace(/^https?:\/\/[^/]+/, "")})`, /\/We-Got-Lists\/\?join=inv[0-9a-f]+$/.test(link));
  await shot("m4-2-share-panel");
  await p.click("button:has-text('+ ADD')"); await p.waitForTimeout(400);
  step("adding a friend puts them on the list", fake.db.members.some(m => m.user_id === jo.id && fake.db.lists.find(l => l.id === m.list_id)?.name === "Groceries"));
  await p.click("text=◀ Back to the list"); await p.waitForTimeout(500);
  step("the list now counts as shared", (await p.locator(".tab.on").textContent()) === "SHARED");

  // ---- Leave a shared list
  await p.click("button[aria-label='All lists']"); await p.click("text=Weekend BBQ");
  await p.click("button[aria-label='List options']"); await p.click("text=PEOPLE & SHARING");
  await p.click("text=LEAVE THIS LIST"); await p.click(".dialog button:has-text('LEAVE')");
  await p.waitForTimeout(500);
  step("leaving removes it for me, keeps it for Jo", !(await p.isVisible("text=Weekend BBQ")) && fake.db.lists.some(l => l.name === "Weekend BBQ"));

  // ---- Opening an invite link joins the list
  const garden = { id: "44444444-4444-4444-4444-444444444444", name: "Garden centre", owner_id: sam.id, created_at: new Date().toISOString() };
  fake.db.lists.push(garden); fake.db.members.push({ list_id: garden.id, user_id: sam.id });
  fake.db.invites.invGARDEN1 = garden.id;
  await p.goto(URL + "?join=invGARDEN1");
  await p.waitForSelector("text=You joined", { timeout: 8000 }).catch(() => {});
  step("invite link joins and opens the list", (await p.textContent("h2.list-title").catch(() => "")) === "Garden centre");
  step("the address bar is tidied", !p.url().includes("join="));
  await shot("m4-3-joined");
  await p.goto(URL + "?join=nopeNOPE99"); await p.waitForTimeout(1500);
  step("a bad invite explains itself", (await p.textContent("body")).includes("expired or doesn't work"));
  await b.close();
})();
