# We Got Lists

A shared grocery-list app for your phone, set in a pixel-art meadow (watch out for the pterodactyl).

**Live app:** https://isaaczenz.github.io/We-Got-Lists/

- `docs/PLAN.md`: decisions, database design and milestones
- `docs/SETUP.md`: one-time setup steps (GitHub Pages, Supabase, iPhone install)
- `docs/mockups/`: the look mockups

## Running it on a computer
```bash
npm install
npm run dev      # starts a local copy at http://localhost:5173/We-Got-Lists/
npm test         # unit tests
npm run build    # type check + production build into dist/

# Walkthroughs on an emulated iPhone, against a pretend Supabase:
npx vite build && npx vite preview --port 4173 &
node e2e/lists.cjs
node e2e/sharing.cjs
```

## How the code is laid out
- `src/App.tsx`: the screen
- `src/scene/`: the meadow. `sprites.ts` is the pixel art, `meadow.ts` is the pure "where is everyone at time T" maths (unit-tested), `Meadow.tsx` draws it.
- `src/supabase.ts`, `src/config.ts`: connection to Supabase (shared Coconut-Water project, `wgl` schema)
- `src/lists/`: lists, items, sharing (`useListData.ts` keeps an open list live)
- `src/data/`: offline support. `ops.ts` (every change as data), `outbox.ts` (changes waiting for signal), `cache.ts` (saved copy)
- `supabase/*.sql`: database scripts, run in order in the Supabase SQL Editor
- `e2e/`: screenshot walkthroughs with a fake Supabase
