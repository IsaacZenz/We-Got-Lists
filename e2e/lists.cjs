// Walks through Milestone 3 on an emulated iPhone with the fake Supabase and saves screenshots.
// Run: npx vite build && npx vite preview --port 4173 &  then: node e2e/lists.cjs [outDir]
const { chromium, devices } = require("playwright");
const { makeFake } = require("./fake-supabase.cjs");
const OUT = (process.argv[2] || "e2e/out") + "/";
require("fs").mkdirSync(OUT, { recursive: true });

(async () => {
  const user = { id: "11111111-1111-1111-1111-111111111111", email: "isaac@example.com", aud: "authenticated", role: "authenticated" };
  const fake = makeFake({ user, profile: { id: user.id, display_name: "Isaac Zenz", initials: "IZ", primary_list_id: null } });
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices["iPhone 13"] });
  await ctx.route("**/*.supabase.co/**", fake.handle);
  const p = await ctx.newPage();
  p.on("pageerror", e => console.log("PAGE ERROR:", e.message));
  const shot = async n => { await p.waitForTimeout(300); await p.screenshot({ path: OUT + n + ".png" }); };
  const texts = async () => (await p.locator(".items .item .txt").allTextContents());
  const step = (msg, ok) => console.log(ok ? "PASS" : "FAIL", msg);

  await p.goto("http://localhost:4173/We-Got-Lists/");
  await p.click("button:has-text('SIGN IN')", { trial: true }).catch(() => {});
  await p.fill("input[type=email]", user.email); await p.fill("input[type=password]", "pw"); await p.click("button.btn");
  await p.waitForSelector("text=No lists yet"); await shot("m3-1-empty");

  await p.fill("input[aria-label='New list name']", "Groceries"); await p.click("button[aria-label='Make list']");
  await p.waitForSelector("h2.list-title:has-text('Groceries')");
  for (const t of ["Eggs (dozen)", "Sourdough bread", "Bananas", "Hot sauce", "Oat milk", "Coffee beans", "Paper towels"]) {
    await p.fill("input[aria-label='New item']", t); await p.keyboard.press("Enter"); await p.waitForTimeout(80);
  }
  await p.waitForTimeout(300);
  step("7 items added in order", (await texts()).length === 7);
  step("input keeps focus after adding", await p.evaluate(() => document.activeElement?.getAttribute("aria-label") === "New item"));
  await p.click("button[aria-label='Cross off Coffee beans']");
  await p.click("button[aria-label='Cross off Paper towels']");
  step("no star before choosing a favourite", (await p.locator(".fav-star").count()) === 0);
  step("options are hidden until ⋯ is tapped", !(await p.isVisible("text=MAKE FAVOURITE")));
  await p.click("button[aria-label='List options']"); await p.click("text=MAKE FAVOURITE");
  step("favourite shows a star by the name", (await p.locator(".win-head .fav-star").count()) === 1);
  step("tabs are hidden while a list is open", (await p.locator(".tabs").count()) === 0);
  await p.waitForTimeout(300);
  step("crossed items move to GOT IT", (await p.textContent(".sep")).includes("(2)"));
  await p.evaluate(() => document.activeElement.blur());
  await shot("m3-2-list");

  // Drag "Bananas" (3rd) to the top by its grip (scroll to the top first, like a person would).
  await p.evaluate(() => document.querySelector(".scroll-body").scrollTo(0, 0)); await p.waitForTimeout(300);
  const grip = await p.locator("button[aria-label='Move Bananas']").boundingBox();
  const first = await p.locator("button[aria-label='Move Eggs (dozen)']").boundingBox();
  await p.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2); await p.mouse.down();
  for (let k = 1; k <= 12; k++) await p.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2 - ((grip.y - first.y + 10) * k) / 12);
  await shot("m3-3-dragging");
  await p.mouse.up(); await p.waitForTimeout(400);
  const order = await texts();
  step(`drag moved Bananas to top (${order.slice(0, 3).join(", ")})`, order[0] === "Bananas");
  step("new order saved to server", [...fake.db.items].filter(i => !i.done).sort((a, b) => a.position - b.position)[0].text === "Bananas");

  await p.click("button[aria-label='Delete Hot sauce']"); await p.waitForTimeout(200);
  step("delete removes an item", !(await texts()).includes("Hot sauce"));
  await p.click("button[aria-label='Un-cross Coffee beans']"); await p.waitForTimeout(200);
  step("un-crossing returns it to the list", (await p.textContent(".sep")).includes("(1)"));

  await p.click("text=CLEAR GOT IT"); await p.waitForTimeout(200);
  step("clear got-it removes only crossed items", (await p.locator(".sep").count()) === 0 && (await texts()).length === 5);

  await p.click("text=CLEAR ALL"); await p.waitForSelector(".dialog"); await shot("m3-4-confirm");
  await p.click(".dialog >> text=CANCEL"); step("cancel keeps items", (await texts()).length === 5);

  // Second list, then reload: the starred list should open by itself.
  await p.click("button[aria-label='All lists']");
  await p.fill("input[aria-label='New list name']", "Hardware store"); await p.click("button[aria-label='Make list']");
  await p.waitForSelector("h2.list-title:has-text('Hardware store')");
  await p.click("button[aria-label='All lists']"); await shot("m3-5-overview");
  step("tabs are back on the all-lists screen", (await p.locator(".tabs").count()) === 1);
  step("only the favourite has a star in the overview", (await p.locator(".lists .fav-star").count()) === 1);
  await p.reload(); await p.waitForSelector("h2.list-title");
  step("starred list opens on launch", (await p.textContent("h2.list-title")) === "Groceries");

  await p.click("button[aria-label='List options']"); await p.click("text=RENAME");
  await p.fill("input[aria-label='List name']", "Weekly groceries"); await p.click(".menu >> text=SAVE");
  await p.waitForSelector("h2.list-title:has-text('Weekly groceries')"); step("rename works", true);

  await p.click("button[aria-label='List options']"); await p.click("text=DELETE LIST"); await shot("m3-6-delete");
  await p.click(".dialog button:has-text('DELETE')"); await p.waitForSelector("h2:has-text('MY LISTS')");
  step("delete list removes it", fake.db.lists.length === 1 && fake.db.profile.primary_list_id === null);
  await p.click(".tab:has-text('SHARED')"); await p.waitForSelector("text=No shared lists yet"); step("shared tab empty state", true);
  await b.close();
})();
