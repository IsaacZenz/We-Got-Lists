# We Got Lists — Plan

## Decisions (agreed 2026-11-17)

| Topic | Decision |
|---|---|
| Platform | Installable website (PWA), mainly for iPhone. Open in Safari → Share → "Add to Home Screen". |
| Hosting | GitHub Pages at https://isaaczenz.github.io/We-Got-Lists/, deployed by GitHub Actions (`.github/workflows/deploy.yml`) on every push. |
| Backend | Supabase: accounts, database, live updates. Shares the **Coconut-Water** project (`vhipoagjztecsobfrjsz`); all tables in a separate `wgl` schema. Same email/password signs in to both apps. |
| Sign-in | Email + password (with "forgot password" email). Shared with Rate My Coconut Water: same login works for both. Minimum 8 characters for new passwords. On first sign-in the app asks for a display name; initials are made from it. No trigger on `auth.users` (it would fire for Coconut-Water sign-ups too). |
| Tabs | **My Lists** (not shared) and **Shared**. Sharing a list moves it to Shared. |
| Favourite (primary) list | (Owner, 2026-11-18) Chosen from the list's ⋯ menu ("Make favourite" / "Remove favourite"). A star appears **only** next to the favourite list — no grey stars elsewhere. One per person, any list. Opens on app launch. Stored as `profiles.primary_list_id`. |
| Items | Text only. Crossed-off items drop to a "Got it!" section at the bottom. Each item can be deleted. |
| Reordering | Drag an item by its grip handle (⠿ on the left) to move it. Order is saved and shared with everyone on the list. Only unchecked items are reordered. Positions are decimals: a moved item gets the midpoint of its neighbours, so only that one row changes. |
| Adding items | New items go to the bottom of the to-get section. The text box keeps focus so you can type several in a row. |
| Deleting items | Trash icon on every item (to-get and crossed off). No confirm for single items. |
| Clearing | Two buttons: **Clear got-it** (crossed-off only) and **Clear all** (asks "Are you sure?"). |
| Sharing | Invite by link (⋯ → Share). Links last 14 days and open in Safari; whoever signs in joins. Anyone who shares a list with you is a "friend" you can add to other lists in one tap (no friend requests). |
| Leaving vs deleting | Shared list menu: **People & Sharing → Leave** removes it from your phone only; **Delete for everyone** (with confirm) deletes it for all. The last person to leave deletes it. |
| Permissions | Everyone on a shared list can do everything (add, cross off, delete, clear, rename, invite). |
| Updates | Live updates (Supabase Realtime) plus pull-to-refresh and a refresh button. Also refreshes when the app comes back to the front. Status line shows ● LIVE / ○ OFFLINE · N WAITING / ↻ SAVING. |
| Who added it | Small initials badge on each item in shared lists. |
| Hearts | Shared lists only. Many people can heart one item. Red heart = you hearted it, pink = others did. Tap the count to see who. |
| Offline | The whole app (code, fonts, icons) is saved on the phone. Last-loaded lists/items show without signal. Item changes (add, cross off, delete, reorder, clear, heart) wait in an outbox and send when signal returns. Making/renaming/deleting lists, starring and sharing need a connection and say so. Signing out clears the phone's saved copy. |
| Look | **Meadow** (2026-11-17): sky + grass, list on a parchment scroll, wooden buttons. See `docs/mockups/d-meadow-v2.*`. |
| App icon | (Owner, 2026-11-18) A pixel-art cow face on sky and grass. Drawn by `scripts/make-icons.py`. |
| Meadow scene | A strip of meadow under the logo with cows and chickens wandering (each faces the way it walks). Every 20 seconds a pterodactyl swoops down and carries off a randomly chosen cow or chicken; a new one wanders in. Original sprites. Timing numbers live in `MEADOW` in `src/scene/meadow.ts`. |
| Fonts (bundled in the app, not from Google, so they work offline) | Blocky pixel font ("Press Start 2P") for headings/buttons, "Pixelify Sans" for small text, and a clean readable font ("Nunito" bold) for list item text only. |
| Rows | Alternating parchment shades on list rows. |
| List header | (Owner, 2026-11-18) "◀ All lists" on its own line; star (if favourite) + list name get the full row. A single ⋯ button at the bottom of the list opens: Refresh, Make/Remove favourite, Share (or People & sharing), Rename, Delete. |
| Tabs | (Owner, 2026-11-18) Only shown on the all-lists screen, hidden while a list is open. My Lists / Shared tab bar sits at the **bottom** of the screen (thumb-reachable, iPhone convention, frees space for the meadow). |

### Open questions
- **Deleting a shared list:** with "anyone can do anything", one person could delete a list for everyone.
  Suggested default: on a shared list the menu offers **Leave list** for everyone, and **Delete for everyone** with a confirm. *Default if no answer: that.*
- **Light/dark:** pixel themes are usually one fixed palette. *Default: no separate dark mode.*


## How it fits together

```
iPhone (PWA from GitHub Pages)  ⇄  Supabase
                                    ├─ Auth (email + password)
                                    ├─ Postgres database (tables below)
                                    ├─ Row Level Security (who can see what)
                                    └─ Realtime (pushes changes to everyone on the list)
```

### Database tables
- `profiles` — id (= auth user), display_name, initials, primary_list_id (the star)
- `lists` — id, name, owner_id, created_at (made via `wgl.create_list()`, which also adds you as a member)
- `list_members` — list_id, user_id, joined_at  (a list is "shared" when it has more than one member)
- `items` — id, list_id, text, done, done_at, position, added_by, created_at
- `item_hearts` — item_id, user_id, list_id  (one heart per person per item; list_id is for live-update filtering)
- `invites` — code, list_id, created_by, expires_at (14 days; only used through `create_invite` / `join_list`)
- Friends = everyone who shares at least one list with you (worked out from `list_members`; no extra table).

**Security:** Row Level Security rules make sure you can only read or change lists you are a member of. That's what keeps the public app key safe to put in the website.

## Milestones

Each milestone ends with something you can open on your phone and test.

- [x] **0. Agree the plan + mockups**: this document and `docs/mockups/`.
- [x] **1. Skeleton + deploy**: Vite + React + TypeScript app, deployed to GitHub Pages, connected to your Supabase project. *Done when:* the site loads on your iPhone and can be added to the Home Screen.
- [x] **2. Accounts**: sign up, sign in, sign out, forgot password, set display name. *Done when:* you can make an account on your phone and stay signed in.
- [x] **3. My lists**: create/rename/delete lists, add/cross off/delete/drag-to-reorder items, both clear buttons, star primary list, in the Meadow look (with cows).
- [x] **4. Sharing**: invite link, join a list, Shared tab, member badges, friends quick-add, leave list.
- [x] **5. Live + hearts**: realtime updates, pull-to-refresh, hearts with counts and "who hearted".
- [x] **6. Offline + polish**: works without signal, app icon, bundled fonts, sticky add box, instant start from the saved copy. *Not done:* custom splash screen and sounds (optional; ask if wanted).

## Progress log
- 2026-11-17: Plan agreed; three pixel-art mockups made (`docs/mockups/*.png`).
- 2026-11-17: Meadow look chosen. Added cows + pterodactyl scene, readable list font, striped rows, drag-to-reorder, bottom tab bar (`d-meadow-v2.html/.png/.gif`).
- 2026-11-18: Fixed backwards-walking cows; added chickens (pterodactyl picks cow or chicken). Decided to share an existing Supabase project.
- 2026-11-18: Milestone 1 built: Vite + React + TypeScript app with the live meadow scene, Supabase connection check (`wgl.ping`), PWA install support, GitHub Pages deploy workflow. Owner still to: enable Pages, run `supabase/001-setup.sql`, expose the `wgl` schema.
- 2026-11-18: Milestone 2 built: sign in / create account / forgot + new password / display name / account panel / sign out. `supabase/002-accounts.sql`. Tested with a fake Supabase in Playwright; owner to test against the real one.
- 2026-11-18: Milestone 3 built: lists overview, create/rename/delete list, add/cross off/un-cross/delete items, drag to reorder, clear got-it, clear all (confirm), star opens on launch. `supabase/003-lists.sql`. 13-step walkthrough (`e2e/lists.cjs`) passes against a fake Supabase.
- 2026-11-18: Milestones 4–6 built together (owner asked): invite links, join, friends quick-add, leave / delete for everyone, initials on items, hearts, Realtime live updates, pull-to-refresh, offline outbox + saved copy, bundled fonts. `supabase/004-sharing-hearts-live.sql`. Checks: 40 unit tests, 13-step list walkthrough, 19-step sharing/offline walkthrough (fake Supabase). Live updates between two real phones not testable here.
- 2026-11-18: Checked the live Supabase project through the connector: scripts 001–004 all applied, RLS on every table, Realtime on. Applied `005-hardening.sql`. Ran a 17-check security test as two pretend users inside a rolled-back transaction: all passed, nothing left behind.
- 2026-11-18: Owner feedback: list header too crowded on phone. Moved Refresh and Options to a bottom toolbar; back link on its own line.
- 2026-11-18: Owner feedback round: options behind one ⋯ button, favourite chosen from that menu, star only on the favourite, tabs hidden inside a list, cow app icon, fixed grazing/pecking frames that cut animals' heads off.
