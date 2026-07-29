# CLAUDE.md

This file provides context for Claude Code sessions working on this project.
Read this before writing or suggesting any code.

---

## What this project is

A minimal bookmark manager: log in, save bookmarks with tags, search and
filter them. The app itself is not the point — this is the "learn to deploy
end-to-end" project, done before starting a bigger portfolio project (a
meal-planning app). The priority is understanding every layer, not speed.

The builder has some programming background — coursework, tutorials and
hobby projects — but has **never used JavaScript or Node.js before**, has
never built a full application end to end, and has **never deployed
anything to production**. Two gaps, then, and the project exists to close
both: the JavaScript/Node ecosystem itself, and the path from
works-on-my-laptop to running-on-the-internet.

Pace accordingly. Getting there slowly with understanding intact beats
getting there quickly with a working app the builder can't explain.

---

## Stack — do not deviate from these

- **Backend:** Node.js + Express
- **Database:** PostgreSQL (hosted free tier — Neon or Supabase), via Prisma ORM
- **Auth:** JWT stored in an httpOnly cookie, hashed passwords via bcrypt — hand-rolled, not a hosted auth provider (the point is to understand the mechanics)
- **Frontend:** React via Vite, plain CSS (no UI framework)
- **Hosting:** Railway or Render (backend), Vercel or Netlify (frontend)
- **Monitoring:** Sentry free tier

Do not suggest swapping any of these for something "better" — the goal is
depth on one stack, not the optimal stack.

---

## Data model — three tables only

```
users
  id, email, password_hash, created_at

bookmarks
  id, url, title, notes, user_id (FK -> users), created_at

tags
  id, name (unique)

bookmark_tags (join table, many-to-many)
  bookmark_id (FK -> bookmarks), tag_id (FK -> tags)
```

Do not add tables, columns, or features (favorites, folders, sharing, etc.)
unless explicitly asked. Scope creep here defeats the purpose — this needs
to ship, not become its own project.

---

## Endpoints — full list

### Auth (public)
- POST /api/auth/register — email + password, sets auth cookie
- POST /api/auth/login — email + password, sets auth cookie
- POST /api/auth/logout — clears auth cookie
- GET /api/auth/me — returns current user from cookie

### Bookmarks (authenticated only)
- GET /api/bookmarks — list, supports ?tag= and ?search=
- POST /api/bookmarks — create (url, title, notes?, tags[])
- PUT /api/bookmarks/:id — update
- DELETE /api/bookmarks/:id — delete

---

## Auth implementation

- All bookmark routes go through a `requireAuth` middleware that verifies the JWT from the cookie
- JWT payload contains just `userId` and an expiry
- Client never touches the token directly — it's httpOnly, sent automatically by the browser
- Server is stateless — no session table, everything derives from the JWT

---

## Deployment — the actual point of this project

1. Push to GitHub (one repo, `server/` and `client/` folders)
2. Backend to Railway or Render, env vars set there (never committed)
3. Frontend to Vercel or Netlify, pointed at the deployed backend URL
4. Buy a real domain, point it at the frontend, update backend CORS to match
5. Add Sentry to the backend for error tracking

Each of these is a checkpoint to understand, not rush past — the whole
reason this project exists is to have done this once before it matters.

---

## Coding guidelines

- Keep route files thin — business logic in helper functions if it grows
- Validate request bodies — return 400 with `{ "error": "message" }` on missing fields
- Use environment variables for all secrets (DATABASE_URL, JWT_SECRET) — never commit them
- Prefer boring, explicit code over clever code — this is a learning project

---

## What NOT to do

- Do not add features beyond the endpoint list above without being asked
- Do not suggest a hosted auth provider (Clerk, Auth0, etc.) — the hand-rolled version is the point
- Do not suggest Docker/containerization — out of scope for this project
- Do not generate large blocks of code unprompted — see Mentoring context below
- Do not skip ahead to deployment steps before the local app fully works

---

## Recommended build order

1. Express app skeleton — confirm `/health` returns JSON, runs locally
2. Prisma schema + local Postgres connection (Neon/Supabase) — first real "does this connect" checkpoint
3. `/api/auth/register` and `/api/auth/login` — password hashing, JWT issuing, cookie setting
4. `requireAuth` middleware — protecting a route and proving the cookie round-trips correctly
5. Bookmark CRUD endpoints — one at a time, testing each in Postman/Insomnia before moving on
6. Tag filtering + search on GET /api/bookmarks
7. React frontend — auth pages first, then the bookmark list/form once login works end to end
8. Deploy backend, then frontend, then connect a domain, then add monitoring

---

## Current status

Track progress here as the project develops. Update this section as each
phase is completed.

- [x] Express app initialised, /health working
- [ ] Prisma schema written, connected to a real hosted Postgres instance
- [ ] /api/auth/register and /api/auth/login working (tested manually)
- [ ] requireAuth middleware working
- [ ] Bookmark CRUD endpoints working
- [ ] Tag filtering + search working
- [ ] React frontend built and talking to the local API
- [ ] Backend deployed (Railway/Render)
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Domain connected
- [ ] Sentry monitoring added

## Session notes — where we left off

(Nothing yet — starting from scratch. Update this section at the end of
each session: what got built, what decisions got made and why, what's next.)

---

## Mentoring context

- **Treat the builder as a junior developer fresh out of college.** Explain
  the *why* behind every decision before writing any code — what problem it
  solves, what would go wrong without it.
- **The builder understands syntax but lacks production experience** —
  connect patterns to real-world engineering reasoning: what breaks under
  load, what the person debugging this at 3am needs, why the convention
  exists at all. Note that "syntax" here means general programming
  constructs carried over from coursework and hobby projects; **JavaScript
  and Node specifically are new**, so JS idioms still need introducing (see
  next bullet). Never built or shipped a full application before.
- **Do not assume JavaScript knowledge.** Explain JS syntax and idioms the
  first time each appears rather than using them in passing: `const`/`let`,
  arrow functions, callbacks, promises and `async`/`await`, destructuring,
  template literals, ES modules vs CommonJS, `module.exports` vs `export`.
- **Do not assume ecosystem knowledge.** The same goes for tooling: what npm
  is, what `package.json` and `node_modules` actually do, what a dependency
  is, what a dev dependency is, why JSON syntax is strict.
- **Do not assume environment fluency.** PATH, shells, execution policies and
  editor restarts have all been real friction. When something doesn't run,
  check the machine's actual state rather than assuming a setup step worked.
- **Do NOT write code directly into files** — guide the builder to write it
  themselves; only paste short inline snippets in chat to illustrate
  concepts. Review what they write rather than pre-writing it for them.
- Go one step at a time, following the build order above. Don't jump ahead
  to later steps even if it would be faster.
- When something breaks, resist the urge to just supply the fix — ask what
  they've checked so far and guide them toward finding it, unless they're
  genuinely stuck and ask directly for the answer.
- It's fine to give a short, direct answer to a factual question (e.g. "what
  does `httpOnly` mean") — mentoring mode is about not doing the *building*
  for them, not about being cagey with information.