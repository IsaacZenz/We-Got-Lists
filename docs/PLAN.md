# We Got Lists — Plan

## Decisions (agreed 2026-11-17)

| Topic | Decision |
|---|---|
| Platform | Installable website (PWA), mainly for iPhone. Open in Safari → Share → "Add to Home Screen". |
| Hosting | GitHub Pages, deployed automatically by GitHub Actions on every push to `main`. |
| Backend | Supabase: accounts, database, live updates. Shares one of the owner's existing projects; all tables in a separate `wgl` schema. |
| Sign-in | Email + password (with "forgot password" email). |
| Tabs | **My Lists** (not shared) and **Shared**. Sharing a list moves it to Shared. |
| Primary list | Star icon. Personal to each user, one star per user, any list (shared or not). Opens on app launch. |
| Items | Text only. Crossed-off items drop to a "Got it!" section at the bottom. Each item can be deleted. |
| Reordering | Drag an item by its grip handle (⠿ on the left) to move it. Order is saved and shared with everyone on the list. Only unchecked items are reordered. |
| Clearing | Two buttons: **Clear got-it** (crossed-off only) and **Clear all** (asks "Are you sure?"). |
| Sharing | Invite by link. Anyone you share with becomes a "friend" you can add to future lists in one tap. |
| Permissions | Everyone on a shared list can do everything (add, cross off, delete, clear, rename, invite). |
| Updates | Live updates (Supabase Realtime) plus pull-to-refresh as a backup. |
| Who added it | Small initials badge on each item in shared lists. |
| Hearts | Shared lists only. Many people can heart one item. Shows filled heart + count; tap to see who. |
| Offline | Shows the last-loaded lists without signal; changes made offline are saved and sent when signal returns. |
| Look | **Meadow** (2026-11-17): sky + grass, list on a parchment scroll, wooden buttons. See `docs/mockups/d-meadow-v2.*`. |
| Meadow scene | A strip of meadow under the logo with cows and chickens wandering (each faces the way it walks). Every so often a pterodactyl swoops down and carries off a randomly chosen cow or chicken; a new one wanders in. Original sprites. |
| Fonts | Blocky pixel font ("Press Start 2P") for headings/buttons, "Pixelify Sans" for small text, and a clean readable font ("Nunito" bold) for list item text only. |
| Rows | Alternating parchment shades on list rows. |
| Tabs | My Lists / Shared tab bar sits at the **bottom** of the screen (thumb-reachable, iPhone convention, frees space for the meadow). |

### Open questions
- **Deleting a shared list:** with "anyone can do anything", one person could delete a list for everyone.
  Suggested default: on a shared list the menu offers **Leave list** for everyone, and **Delete for everyone** with a confirm. *Default if no answer: that.*
- **Light/dark:** pixel themes are usually one fixed palette. *Default: no separate dark mode.*
- **Supabase:** share an existing project (owner decision 2026-11-18). We Got Lists tables live in their own `wgl` schema. Waiting on: which project + its URL and publishable key.

## How it fits together

```
iPhone (PWA from GitHub Pages)  ⇄  Supabase
                                    ├─ Auth (email + password)
                                    ├─ Postgres database (tables below)
                                    ├─ Row Level Security (who can see what)
                                    └─ Realtime (pushes changes to everyone on the list)
```

### Database tables
- `profiles` — id (= auth user), display_name, initials, primary_list_id
- `lists` — id, name, owner_id, created_at
- `list_members` — list_id, user_id, joined_at  (a list is "shared" when it has more than one member)
- `items` — id, list_id, text, done, done_at, position, added_by, created_at
- `item_hearts` — item_id, user_id  (one heart per person per item)
- `invites` — code, list_id, created_by, expires_at
- Friends = everyone who shares at least one list with you (worked out from `list_members`; no extra table).

**Security:** Row Level Security rules make sure you can only read or change lists you are a member of. That's what keeps the public app key safe to put in the website.

## Milestones

Each milestone ends with something you can open on your phone and test.

- [x] **0. Agree the plan + mockups**: this document and `docs/mockups/`.
- [ ] **1. Skeleton + deploy**: Vite + React + TypeScript app, deployed to GitHub Pages, connected to your Supabase project. *Done when:* the site loads on your iPhone and can be added to the Home Screen.
- [ ] **2. Accounts**: sign up, sign in, sign out, forgot password, set display name. *Done when:* you can make an account on your phone and stay signed in.
- [ ] **3. My lists**: create/rename/delete lists, add/cross off/delete/drag-to-reorder items, both clear buttons, star primary list, in the Meadow look (with cows).
- [ ] **4. Sharing**: invite link, join a list, Shared tab, member badges, friends quick-add, leave list.
- [ ] **5. Live + hearts**: realtime updates, pull-to-refresh, hearts with counts and "who hearted".
- [ ] **6. Offline + polish**: works without signal, app icon, splash screen, sounds (optional, original).

## Progress log
- 2026-11-17: Plan agreed; three pixel-art mockups made (`docs/mockups/*.png`).
- 2026-11-17: Meadow look chosen. Added cows + pterodactyl scene, readable list font, striped rows, drag-to-reorder, bottom tab bar (`d-meadow-v2.html/.png/.gif`).
- 2026-11-18: Fixed backwards-walking cows; added chickens (pterodactyl picks cow or chicken). Decided to share an existing Supabase project.
