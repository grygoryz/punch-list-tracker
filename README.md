# Punch List Tracker

A small web app for tracking construction punch lists — the defects found at the end of a
project that have to be cleared before closeout. Superintendents create projects, log
defects with a location/description/photo, assign them to workers, and watch the
completion dashboard fill in.

## What's in here

- **Next.js 16** (App Router, Server Actions, React 19) — pages, mutations, and the API
  layer all live in one place.
- **Supabase** for Postgres, email+password / magic-link auth, and photo storage
  (private bucket, 1-hour signed URLs).
- **Prisma 6** ORM against the Supabase Postgres instance.
- **Tailwind 4** + a small local set of UI primitives for styling.
- **Vitest** for the unit tests around the workflow rules and dashboard math.

## The domain

Three tables:

- **Project** — `name`, `address`, `status`, items.
- **PunchItem** — belongs to a project. Has `location`, `description`, `priority`,
  `status`, `assignedTo`, `photo`, timestamps.
- **Profile** — mirrors `auth.users` so `assignedTo` / `createdBy` reference real people
  instead of free-text strings.

## How it works

1. Sign in (email + password or magic link). A `Profile` row is created on first login.
2. Create a project. Open it to see the dashboard and an empty item list.
3. Add punch items. Each item captures location, description, priority, and an optional
   photo uploaded to Supabase Storage.
4. Assign an item to a worker. From that point on, **only that worker** can advance the
   item through the workflow.
5. The dashboard shows overall completion %, plus breakdowns by status, priority,
   location, and assignee. Numbers update on every mutation via `revalidatePath`.

## Workflow rules (enforced server-side)

The schema stores `status` as a plain string and `assignedTo` as nullable, so nothing in
the database stops an illegal state. The rules are enforced in `src/lib/workflow.ts` and
`src/actions/items.ts`:

- **Forward-only state machine.** `open → in_progress → complete`. No skipping
  (`open → complete` is rejected), no regression (`complete → *` and `in_progress → open`
  are rejected), no re-transition to the same state.
- **Assignment gates progress.** An item cannot move past `open` until it has an
  assignee. The check lives in `assertValidTransition` and runs on every status mutation.
- **Assignment is one-shot.** Once an item is assigned, the assignee is locked in. This
  is enforced with a conditional `updateMany … WHERE assignedTo IS NULL`, so two users
  racing to claim the same item can't both win.
- **Only the assignee can advance status.** The server action compares the session user
  against `item.assignedTo` before calling the workflow guard.
- **Status writes are conditional.** `updateItemStatus` writes with
  `WHERE status = <value it validated>`, so a stale read never corrupts the row.

The UI disables buttons for invalid actions (e.g. no "Start work" button until an
assignee is picked), but the server is the source of truth — direct calls with bad
payloads are rejected with a clear error message.

## Project layout

```
prisma/schema.prisma              Data model
src/lib/workflow.ts               State machine + transition guard
src/lib/dashboard.ts              Aggregation math (pure, unit-tested)
src/lib/storage.ts                Supabase photo upload + signed URLs
src/lib/auth.ts                   requireProfile() — session → Profile row
src/lib/supabase/{server,client,admin,middleware}.ts
src/actions/projects.ts           createProject server action
src/actions/items.ts              createItem / assignItem / updateItemStatus
src/components/dashboard.tsx      Completion % + breakdown cards
src/components/punch-item-row.tsx Item row with status transition controls
src/app/projects/…                List / create / detail pages
src/app/login/page.tsx            Sign-in
proxy.ts                          Next 16 middleware (session refresh + guard)
```

## Running locally

```bash
cp .env.example .env              # fill in Supabase + DB credentials
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

`npm test` runs the Vitest suite (workflow guard + dashboard aggregation).

`npm run build` produces a production build.
