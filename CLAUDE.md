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
- [x] Prisma schema written, connected to a real hosted Postgres instance
- [x] /api/auth/register and /api/auth/login working (tested manually)
- [x] requireAuth middleware working
- [x] Bookmark CRUD endpoints working
- [ ] Tag filtering + search working
- [ ] React frontend built and talking to the local API
- [ ] Backend deployed (Railway/Render)
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Domain connected
- [ ] Sentry monitoring added

## Session notes — where we left off

### Session 1 — 2026-08-04
  
**Built:** Express skeleton with `/health`; Prisma schema (4 models) migrated to
a hosted Neon Postgres; `db.js` exporting a shared Prisma client; temporary
`/db-check` route proving Express→Postgres connectivity.

**Decisions:**
- **ESM (`"type": "module"`)** over CommonJS — one import syntax across server
  and the future React client.
- **Neon** over Supabase — Postgres only, no bundled auth/storage to ignore.
- **Explicit `BookmarkTag` join model** rather than Prisma's implicit m2m, so
  the table matches the documented data model and is visible in the SQL.
- **`Int` autoincrement ids** for simplicity; ownership checks in `requireAuth`
  will cover the enumeration risk that UUIDs would have avoided.
- Added two indexes beyond the spec: `bookmarks.user_id` and
  `bookmark_tags.tag_id`. Postgres does *not* auto-index FK columns, and both
  are on the hot path for `GET /api/bookmarks`.
- `sslmode=verify-full` in `DATABASE_URL` (was `require`) — keeps certificate
  verification when the `pg` driver changes its defaults.

**Prisma 7 gotchas (differ from every tutorial):**
- Client is generated to `server/generated/prisma`, not `node_modules`.
  Import is `from './generated/prisma/client.ts'` — **not** `@prisma/client`.
  The `.ts` extension is real; Node 24 strips types at load.
- `new PrismaClient()` throws without a **driver adapter**. Must pass
  `new PrismaPg({ connectionString: process.env.DATABASE_URL })`.
- Connection URL lives in `prisma.config.ts` for the CLI; the app passes it
  separately at runtime.
- `prisma migrate dev` does *not* run `prisma generate` — run it yourself.
- `start` script is `node --env-file=.env index.js`; there is no `dotenv` in
  the app's runtime path.

**Recurring friction:** wrong working directory (npm/npx act on the current
folder — `npx` offering to install something already installed means you're in
the wrong place), and unsaved editor buffers reported as saved. Verify state
rather than assuming a command applied.

**Next:** `/api/auth/register` — password hashing with bcryptjs, then JWT
issuing and the httpOnly cookie. Remove `/db-check` once auth routes exist.

### Session 2 — 2026-08-06

**Built:** `POST /api/auth/register` and `POST /api/auth/login`, both tested
manually in Postman. Added `express.json()` and `cookie-parser` to
`index.js`; routes moved into `routes/auth.js` behind an `express.Router()`
mounted at `/api/auth`. Extracted `lib/auth.js` holding `TOKEN_TTL_MS`,
`COOKIE_OPTIONS` and `issueAuthCookie(res, userId)`.

**Decisions:**
- **`bcryptjs`** over `bcrypt` — pure JS, no native compile step, no Windows
  toolchain risk. Cost factor 10.
- **Router + `/api/auth` mount prefix** rather than routes in `index.js` —
  prefix lives in one place; `/health` stays outside `/api` since the host's
  monitoring pings it and it isn't part of the API surface.
- **`lib/auth.js` extracted at two call sites**, driven by a concrete need:
  `res.clearCookie()` in logout must be passed options matching `res.cookie()`
  exactly or it silently fails to clear. Three consumers, one definition.
- **`select` on `create`** so `passwordHash` never leaves Postgres. Chosen over
  `omit` because an allowlist doesn't leak fields added to the schema later.
- **Register returns a specific 409** ("Email already registered") but **login
  returns a generic 401** for both unknown-email and wrong-password. Deliberate
  asymmetry: usability on register, no account-enumeration oracle on login.
  Accepted that register itself leaks existence — fine for this app, noted.
- **Duplicate check is `findUnique` then `create`** — a TOCTOU race in
  principle. The `@unique` constraint is the real guarantee; the check exists
  only to produce a good error message.

**Gotchas hit:**
- Mounted the router at `/auth` instead of `/api/auth` → 404. Full path is
  mount prefix + route path; check both files plus the client URL.
- `data: { password: passwordHash }` → Prisma "Argument `passwordHash` is
  missing". Field is `passwordHash` (Prisma) / `password_hash` (Postgres) via
  `@map`; there is no `password` field anywhere by design.
- Duplicate email produced a **500**, not a 409 — Express 5 auto-catches
  rejected promises from async handlers and returns a generic 500. A safety
  net, not error handling. Proper error handling still owed.
- `import issueAuthCookie from` (default) against a module with only **named**
  exports. ESM resolves imports statically, so this fails at startup with a
  clear message rather than a runtime `undefined`.
- Pasted an illustrative snippet containing `...` literally into a file.

**Still owed:**
- Error handling — the duplicate-email race can still surface as a 500.
- `sameSite: 'lax'` will block the cookie once the frontend is on a different
  site from the API. Deployment will need `sameSite: 'none'` + `secure: true`
  + matching CORS. Deliberately deferred to hit it in context.

**Recurring friction (again):** `npm start` run against an unsaved buffer
produced a `does not provide an export named` error describing a state the file
wasn't in. When an error contradicts what's on screen, suspect the save first.
`node --watch` avoids this.

**Next:** `requireAuth` middleware — read `req.cookies.token`, `jwt.verify`,
attach `req.user`, 401 otherwise. Then `/api/auth/me` and `/api/auth/logout`
fall out of it cheaply. `/db-check` still needs removing from `index.js`.

### Session 3 — 2026-08-18

**Built:** `requireAuth` in `lib/auth.js`; `GET /api/auth/me` behind it.
`/db-check` removed. Verified manually in Postman — valid cookie returns the
user, deleted cookie returns 401, one character changed in the token payload
returns 401. The cookie round trip is now proven end to end.

**Decisions:**
- **`requireAuth` lives in `lib/auth.js`** next to `issueAuthCookie` — the read
  side and write side of the same token, sharing a secret and a cookie name.
  Changing one puts the other on screen.
- **Not `async`.** `jwt.verify` is synchronous CPU work. Deliberate contrast
  with `bcrypt.compare`: HMAC is fast by design because it runs on *every*
  authenticated request; bcrypt is slow by design because it guards a stolen
  hash. Never put bcrypt on a hot path.
- **`req.userId`, not the conventional `req.user`.** Honest about holding only
  an id — `req.user.email` returning `undefined` is a trap. Cost: diverges
  from ecosystem convention (Passport et al. set `req.user`). **Must be used
  consistently across all bookmark routes.**
- **`next()` sits outside the `try`.** `next()` invokes the rest of the chain
  synchronously, so a downstream synchronous throw would unwind into
  `requireAuth`'s `catch` and be reported as `401 Invalid token` — an auth
  error for a bug three files away. The assignment stays inside the `try`;
  only `next()` moved out, which keeps `decoded` scoped to where it's used.
- **Two distinct 401 messages** — "Authentication required" (no token) vs
  "Invalid token" (rejected). Distinguishing *absent* from *rejected* leaks
  nothing; the caller knows what they sent. The distinction worth hiding is
  *why* a token failed — expired vs forged — and both map to one message.
- **`/me` returns 401, not 404**, when the token verifies but the user row is
  gone. Status codes describe what the client should do next, and the remedy
  is identical to not-being-logged-in: bin the session, go to login.

**JWT facts that drove the above:**
- Payload is base64, **not encrypted** — anyone holding the token can read it.
  Never put anything secret in it.
- `verify` checks signature *and* expiry, returns the decoded payload
  (`{ userId, iat, exp }`; timestamps in Unix **seconds**, not ms), and
  **throws** rather than returning null. Hence the `try`/`catch` — without it
  Express 5 turns a forged token into a 500.
- `jwt.decode()` skips signature verification entirely. Never in an auth path.
- Stateless means **tokens cannot be revoked** — a deleted user's token stays
  valid until `exp`. That is precisely why `/me` needs its null check.
- Cookies are scoped by domain and path, **not port**. Everything on
  `localhost` shares one jar.

**Still owed:**
- **`POST /api/auth/logout`** — designed, not written. `res.clearCookie('token',
  COOKIE_OPTIONS)` must be passed options identical to `res.cookie()` or it
  silently fails to clear. Decided it should *not* sit behind `requireAuth`:
  logout must still work when the token has already expired.
- `/me` doesn't `clearCookie` on the user-not-found path, so a dead cookie
  keeps being sent on every subsequent request.
- Error handling — still owed from session 2 (duplicate-email race → 500).
- `sameSite: 'lax'` → deployment will need `'none'` + `secure` + CORS.

**JS/Node ground covered** (don't re-explain, do build on): what `req`/`res`
actually are, `res` as a mutable response builder that only flushes on
`json`/`send`, why helpers take `res` as a parameter, cookies as the
`Set-Cookie` header, functions as values (`requireAuth` vs `requireAuth()`),
middleware factories (`cookieParser()`) vs plain middleware, `try`/`catch`,
and middleware chains as an ordered list per route.

**Next:** write `logout`, then step 5 — bookmark CRUD, one endpoint at a time,
each tested in Postman before starting the next. `POST /api/bookmarks` first;
tags make it the most involved of the four, so consider `GET` first instead.

### Session 4 — 2026-08-23/24

**Built:** `POST /api/auth/logout`; `/me` now clears the cookie on the
user-not-found path. `routes/bookmark.js` — all four CRUD endpoints, mounted at
`/api/bookmarks`, every route behind a single `router.use(requireAuth)`. Tags
working end to end on create and update. Three helpers extracted in the route
file: `formatBookmark`, `BOOKMARK_SELECT`, `buildcleanedTagNames`. Added a
`dev` script using `node --watch`.

**Decisions:**
- **Logout is not behind `requireAuth`.** It must be idempotent — calling it
  with no token, a bad token or an expired one all succeed. Gating it would
  strand a dead cookie in the browser with no way to remove it.
- **`clearCookie` is passed `COOKIE_OPTIONS`.** Cookie identity is name +
  domain + path; a mismatch expires a *different* cookie and fails silently
  with a 200. Express hard-codes `expires` last and strips `maxAge` itself.
- **Endpoint order was GET → POST → DELETE → PUT**, not spec order. Each step
  introduced exactly one new idea: ownership scoping, then tags, then URL
  params, then tag replacement. Debugging two new things at once is the thing
  to avoid.
- **`router.use(requireAuth)` at router level**, unlike `auth.js` where it's
  per-route. Protect at the broadest level where the rule is uniform — every
  bookmark route is authenticated with no exceptions, so state it once where
  it can't be forgotten on the fifth endpoint.
- **Tag names normalised: trim → lowercase → drop empties → dedupe via `Set`.**
  `tags.name` is globally `@unique`, so `"React"` and `"react"` would become
  two rows and split every filter. Dedupe matters because duplicate names in
  one request would write two identical join rows and violate the composite
  primary key.
- **Tags are a shared global vocabulary**, not per-user — that's what the
  session-1 schema says. Consequences accepted: never expose a global tag list
  (no such endpoint exists), and tag rows orphaned by a delete are harmless.
- **The API field is `tags: ["a","b"]`, flat strings.** `formatBookmark` is the
  seam that keeps `bookmarkTags` and the join table out of the API. Fields are
  copied explicitly rather than spread, so it doubles as a second allowlist —
  a column added later cannot leak into a response.
- **`BOOKMARK_SELECT` extracted** because `formatBookmark` *depends* on it: it
  reads `bookmark.bookmarkTags`, which only exists if the select asked for it.
  Two definitions can drift; one cannot.
- **Ownership is enforced inside the write, never as a separate check.**
  DELETE uses `deleteMany({ where: { id, userId } })` and treats `count === 0`
  as 404. PUT uses `update` with both keys in `where`. A `findFirst`-then-write
  pair would reintroduce the TOCTOU gap from session 2.
- **PUT had to use `update`, not `updateMany`** — `updateMany` cannot perform
  nested relation writes, so it can't touch tags. `update` accepts extra
  non-unique filters alongside the unique one, which is what makes the
  ownership check possible there.
- **404, not 403**, when a row exists but belongs to someone else. 403 is an
  existence oracle for anyone walking sequential ids. Same reasoning as
  login's deliberately generic 401.
- **PUT is full replacement, not partial.** Missing `notes`/`tags` means
  "clear it", not "leave it". PATCH semantics were declined specifically to
  avoid needing to distinguish *omitted* from *explicitly cleared* per field.
- **Tag replacement is `bookmarkTags: { deleteMany: {}, create: [...] }`** in a
  single nested write.
- **POST returns 201 + the created resource** (the client can't know `id` or
  `createdAt`; returning them saves a full re-fetch per create).
  **DELETE returns 204 + `.end()`** — nothing the client couldn't infer.

**Prisma facts that drove the above:**
- **A nested write is one transaction.** Prisma wraps the whole tree in
  `BEGIN`/`COMMIT`, so bookmark + tags + join rows commit together or not at
  all. Four sequential `await`s would be four independent transactions, any of
  which could be the last one to succeed.
- `connectOrCreate` is find-or-create; its `where` must name a unique field.
- Nested `create` on a relation takes **one object per join row**. Mapping at
  the wrong level — one join row holding an array of tags — is the classic
  error and the one hit here.
- Relation fields (`Bookmark.bookmarkTags`, `Tag.bookmarkTags`) are **virtual
  navigation properties, not columns**. Both sides name the same join table
  traversed from opposite ends. Prisma Studio renders model fields, so its
  column counts don't match Postgres; `migration.sql` is ground truth.
- Nested `deleteMany: {}` means "all join rows for this parent".
- Error codes matter: `P2025` is record-not-found on update. Catch the code you
  know; never blanket-catch, or a database outage reports as a 404.
- **`undefined` means "don't set this field"; `null` means "set it to NULL".**
  Invisible on create, decisive on update.

**Gotchas hit:**
- `awaitprisma` — missing space. `await` is only a keyword as its own token, so
  this parsed as a legal identifier and surfaced as a generic 500.
- `url.trim()` placed *above* the null guard → `TypeError` on a missing field,
  making the 400 branch unreachable for the exact case it was written for.
  Fixed with `?.`. **Validate before operating on anything from `req.body`.**
- `req.tags` instead of `req.body.tags` — failed **silently**: 201, no tags
  written, every test apparently passing. It also masked two bugs downstream
  (`tag.name` on a string array, missing `.toLowerCase()`) that only appeared
  once it was fixed. Silent no-ops hide everything after them.
- `.map(...).filter(...).toLowerCase()` — a string method called on an array.
  Track the type at each link of a chain; `.map`/`.filter` always yield arrays.
- `[cleanedNames.map(...)]` — `.map()` already returns an array, so the extra
  brackets produced `[[...]]`.
- `isInteger(x)` bare → `ReferenceError`. `isNaN` is a legacy **global**;
  `isInteger` exists only as `Number.isInteger`. The ES2015 numeric checks all
  live on `Number`, and the `Number.*` versions don't coerce.
- `isNaN` passes `4.5` and `Infinity` through to Prisma as a 500;
  `Number.isInteger` rejects all three cases in one test.
- `res.status(204).json({message})` — Express strips the body for 204, so the
  message was silently discarded. `.end()` says what actually happens.
- JSON body key `bookmark_tags` instead of `tags`: destructuring ignores
  unknown keys, so a wrongly-named field is indistinguishable from an omitted
  one — 201, data dropped, no error. **Three vocabularies in play:**
  `bookmark_tags` (Postgres table), `bookmarkTags` (Prisma relation), `tags`
  (API field).
- Prisma Studio insert with `user_id: 2` failed on FK constraint
  `bookmarks_user_id_fkey` — no such user (ids are 1, 4, 5). Studio showed an
  empty "Error Details" panel; Postgres would have named the constraint.
  SERIAL sequences don't roll back, so id gaps are normal and mean nothing.

**Recurring friction, resolved:** unsaved editor buffers, five separate times —
tests run against a file that doesn't match the screen. Fixed structurally by
adding `"dev": "node --watch --env-file=.env index.js"`; the restart line in
the terminal is now the save confirmation. `start` left clean for production,
where watching is the host's job.

**Still owed:**
- **Error handling.** PUT's `catch` discards the `error` object with no
  logging — a 3am debug with empty logs. `console.error(error)` is the minimum,
  and that line is where the Sentry capture goes later. There is still no
  error-handling middleware in `index.js`, so anything unhandled returns
  Express's default HTML page complete with stack trace and file paths. Owed
  since session 2.
- `sameSite: 'lax'` → deployment needs `'none'` + `secure: true` + CORS.
- Minor: `buildcleanedTagNames` → `buildCleanedTagNames`; the `connectOrCreate`
  map is duplicated in POST and PUT.

**JS/Node ground covered** (don't re-explain, do build on): `const`/`let`/`var`
and why a bare assignment throws in ESM — sloppy mode would create an implicit
global, i.e. one variable shared across concurrent requests; arrow functions,
concise vs block body, implicit return, and why `=> ({...})` needs parentheses;
`.map()`, `.filter()`, `new Set()`, spread `[...x]`, `Array.isArray`, optional
chaining `?.`, `??` vs `||`, shorthand property syntax `{ bookmarks }`; objects
passed by reference and spread as a shallow copy; `return` in a handler exits
the function but does **not** send the response — `res.json()` does, Express
ignores the return value, and a missing `return` in a non-final branch gives
"Cannot set headers after they are sent"; route params are always strings;
reading a stack trace (first frame in your own file; `ReferenceError` = name
doesn't exist, `TypeError` = it exists but the operation is invalid).

**Postgres ground covered:** `RETURNING` on INSERT and why it beats
insert-then-select; `$1` parameter placeholders as the structural reason Prisma
is injection-safe; foreign keys and referential integrity; `ON DELETE CASCADE`
cleaning up join rows automatically; composite primary keys; SERIAL sequence
gaps.

**Next:** step 6 — `?tag=` and `?search=` on `GET /api/bookmarks`. Both are
query-string filters on the existing route, so no new endpoint. Two decisions
to settle first: which fields `?search=` covers (title only, or title + notes +
url) and case sensitivity (Postgres `LIKE` is case-sensitive; Prisma has
`mode: 'insensitive'`). `?tag=` filters *through* a relation —
`where: { bookmarkTags: { some: { tag: { name } } } }`. After that, the
error-handling middleware, then the React frontend.

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