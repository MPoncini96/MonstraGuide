# Ruflo Capture-to-Guide Audit

> Read-only audit of the Monstra Guide codebase (`C:\guide`) to scope an
> AI-assisted capture-to-structured-guide vertical slice. Synthesized by the
> architect from three parallel investigations (backend/data-layer, frontend,
> and AI-pipeline) plus a high-level architecture pass. All file paths are
> repo-relative unless stated otherwise.

## 1. Current architecture and conventions

Monstra Guide is a **Next.js 16 App Router** application (React 19) written in
**TypeScript** (strict mode, `@/*` path alias to `src/*`, `tsconfig.json`). It is
a Phase-1 authenticated product shell: manual guide authoring, review/publish
lifecycle, team/role management, a published-guide viewer, and a deterministic
keyword assistant.

Conventions observed across the codebase:

- **Server-first rendering.** Every page under `src/app` is an async React Server
  Component. The only `"use client"` component in the app surface is
  `src/components/app/app-shell.tsx` (uses `usePathname` + Clerk `UserButton`).
- **Mutations are exclusively React Server Actions.** All ~25 actions live in
  `src/lib/app-actions.ts` (`'use server'`), invoked via `<form action={...}>`.
  There is **no client-side fetch/onSubmit/useState** in app pages and **no REST
  API** except the Clerk webhook at `src/app/api/webhooks/clerk/route.ts`
  (confirmed by glob — no `api/captures` or `api/guides` handlers exist).
- **Directory layout.** `src/app` = routes; `src/components/{app,sections,ui,auth,
  assistant,brand}` = components by role (`app` = authenticated primitives,
  `sections` = marketing, `ui` = design-system primitives); `src/lib/{auth,guides,
  workspace,team,validation,assistant,db}` = domain logic.
- **Validation.** Zod schemas in `src/lib/validation/*` parse `FormData` at the
  action boundary. (Note: env is *not* Zod-validated — see §9.)
- **Styling.** Tailwind v4 utility classes + CSS custom properties
  (`var(--accent-strong)`, etc.), a `cn()` helper (`src/lib/utils.ts`), shared
  `.app-input`/`.app-card` classes; rounded-full buttons / rounded-3xl cards.
- **Testing.** Lightweight logic-focused unit tests via `tsx --test src/**/*.test.ts`
  (`npm test`). Existing tests: `slug.test.ts`, `guards.test.ts`,
  `policy.test.ts`, `clerk-sync.test.ts`, `placeholder-assistant.test.ts`. **No
  database-backed integration tests, no component/E2E tests.**
- **Data access.** Prisma 6 client singleton (`src/lib/db/prisma.ts`,
  `global.__monstraPrisma` dev cache). PostgreSQL. No Prisma middleware / RLS —
  workspace isolation is enforced per-call-site in the auth helpers (§4).

## 2. Existing capture and guide functionality

**Guide authoring (real, production-shaped, end-to-end):**

- Create → edit → review → publish → public view all work against Prisma.
- `createGuideAction` (`src/lib/app-actions.ts:154`) and `/app/guides/new` create a
  Guide plus first step/prereq/mistake. The editor
  (`src/app/app/guides/[guideId]/edit/page.tsx`) is the most complete surface:
  full CRUD on metadata, steps, prerequisites, common mistakes, reordering, and
  status transitions, all role- and transition-gated.
- Guide lifecycle is a real, role-gated state machine
  (`allowedGuideTransitions`, `src/lib/auth/permissions.ts:33`):
  `DRAFT→IN_REVIEW→PUBLISHED→ARCHIVED→DRAFT`, only ADMIN publishes.
- Publishing (`changeGuideStatusAction`, `src/lib/app-actions.ts:369`) enforces a
  readiness gate (`buildGuideReadyState`, `src/lib/guides/policy.ts`) then, inside
  a `$transaction`, bumps `version`, sets `publishedAt`/`reviewedById`, and
  **upserts an immutable `GuideVersion` snapshot** (`buildGuideSnapshot`,
  `src/lib/guides/snapshots.ts`) keyed on `(guideId, version)`.
- Published viewer `/g/[workspaceSlug]/[guideSlug]` renders published guides from
  the DB (with an authorization nuance — see §4).

**Capture (a metadata shell only — no ingestion):**

- `/app/record` (`src/app/app/record/page.tsx`) is a **placeholder**: a manual
  form (title, description, read-only "Manual upload" mode, privacy checkbox) that
  calls `createCaptureAction` (`src/lib/app-actions.ts:101`) to insert an empty
  `CaptureSession` row. Its own copy states: *"Desktop recording, screenshot
  analysis, and AI generation come later."*
- Capture detail (`src/app/app/captures/[captureId]/page.tsx`) shows real session
  metadata but three hardcoded dashed-border placeholder cards ("Screenshot
  uploads… will land in a later phase", etc.). The one working action is "Create
  draft guide shell".
- **No capture ingestion of any kind exists.** The frontend investigator grepped
  all of `src` for `getDisplayMedia`/`getUserMedia`/`MediaRecorder`/`multipart`/
  `presigned`/`s3`/`blob`/`FileReader`/`upload` → zero matches in app source.
  `screenshotUrl` is a **free-text `<input>`** stored as a raw string; there is no
  file upload, no object storage, and the public viewer renders every step's
  screenshot as a dashed "Screenshot placeholder" box.

**Assistant (deterministic keyword retrieval, not AI):**

- `PlaceholderGuideAssistant` (`src/lib/assistant/placeholder-assistant.ts`)
  tokenizes the question and term-frequency-ranks steps (step text weight 3,
  supporting text weight 1) over **PUBLISHED guides in the active workspace only**,
  returning the top-3 step excerpts or a canned fallback. No LLM, no embeddings,
  no vector search — literal substring/term overlap. The panel
  (`src/components/assistant/assistant-panel.tsx`) is purely presentational and
  posts `q` as a GET search param.

## 3. Current Prisma models and relationships

`prisma/schema.prisma` defines **14 models and 7 enums** (backend investigator
diffed every field/index/FK). Core graph:

- **User** — `clerkUserId String? @unique`, `normalizedEmail @unique`, plus
  composite `@@unique([email, clerkUserId])`. Owns workspaces created, memberships,
  invitations sent, captures, guides (creator + reviewer), guide versions,
  conversations.
- **Workspace** — `slug @unique`; `createdBy` `onDelete: Restrict`. Owns
  memberships, invitations, captureSessions, guides, conversations.
- **WorkspaceMembership** — `@@unique([workspaceId,userId])`,
  `@@index([userId,workspaceId])`; both FKs Cascade.
- **WorkspaceInvitation** — `token @unique`, `@@index([workspaceId,status])`.
- **CaptureSession** — `status CaptureStatus @default(DRAFT)`,
  `captureMode CaptureMode @default(MANUAL_UPLOAD)`, `startedAt?`, `completedAt?`,
  `description?`. Workspace Cascade, `createdBy` Restrict, `guides[]` backref.
  **No `@@index([workspaceId, …])`** — capture-list queries scan by `workspaceId`
  unindexed (perf note for the slice, which will read/write this table).
  **No child model holds captured content** (no screenshots, events, transcript).
- **Guide** — `@@unique([workspaceId,slug])`,
  `@@index([workspaceId,status,updatedAt])`; `sourceCaptureId?` → CaptureSession
  `onDelete: SetNull`; `version Int @default(1)`. Owns steps, prerequisites,
  commonMistakes, outgoing/incoming relations, versions, conversations.
- **GuideStep / GuidePrerequisite / GuideCommonMistake** — each Cascade on guide
  + `@@unique([guideId, position])` (ordered lists). Step has optional
  `explanation`, `warning`, `screenshotUrl` (text).
- **GuideRelation** — self-relation, `@@unique([sourceGuideId,targetGuideId,relationType])`.
- **GuideVersion** — `@@unique([guideId,version])`, `snapshot Json`.
- **AssistantConversation / AssistantMessage** (+ `AssistantRole` enum) — fully
  schema'd and migrated but have **zero application code** referencing them. These
  are dormant, forward-looking tables — the natural home for persisted
  AI/assistant conversations.

Enums: `WorkspaceRole`, `InvitationStatus`, `CaptureStatus{DRAFT,READY,PROCESSING,
COMPLETED,FAILED,ARCHIVED}`, `CaptureMode{MANUAL_UPLOAD,DESKTOP_RECORDING}`,
`GuideStatus`, `GuideRelationType`, `AssistantRole`. Note the `CaptureStatus` and
`CaptureMode` enums already anticipate a processing pipeline and desktop
recording, but no code sets any value beyond the defaults.

## 4. Authentication and workspace-isolation patterns

**Auth (Clerk → local User):** Two sync paths funnel through the same
OR-match-and-upsert logic:

1. Interactive — `requireUser()` (`src/lib/auth/session.ts:10`) runs on every
   authed request: `isClerkConfigured()` gate, `auth()`→`userId`, `currentUser()`,
   then upserts a local `User` matched by `OR[{clerkUserId},{normalizedEmail}]`.
   This is a **write-on-read** pattern (a User write on every page load).
2. Webhook — `src/app/api/webhooks/clerk/route.ts` + `syncClerkUserRecord`
   (`src/lib/auth/clerk-sync.ts`). Signature is **verified** via `verifyWebhook()`;
   any failure returns 400. `user.deleted` soft-detaches (`clerkUserId = null`),
   preserving the row so `Restrict` FKs survive.

**Workspace isolation (guard-centric, per-call-site):** `src/lib/auth/session.ts`
is the single chokepoint:

- `requireActiveWorkspace()` (`:77`) loads the user's memberships and resolves the
  active workspace from the `monstra_active_workspace` cookie (httpOnly, sameSite
  lax, secure-in-prod; `src/lib/workspace/active-workspace.ts`), **falling back to
  the first membership** if the cookie is invalid — so the active workspace is
  always one the user actually belongs to.
- `requireWorkspaceRole(roles)` (`:96`) → `notFound()` on role mismatch.
- `requireGuideAccess` / `requireGuideEditor` / `requireCaptureAccess` /
  `requirePublishedGuideViewer` re-scope every query with
  `where: { id, workspaceId: context.workspace.id }` and layer
  `canViewGuide`/`canEditGuide` (`src/lib/auth/permissions.ts`). This is the
  correct and consistent pattern.

**Two isolation nuances to carry forward:**

- **Published viewer is not truly public.** `requirePublishedGuideViewer`
  (`src/lib/auth/session.ts:154`) calls `requireActiveWorkspace()` and then
  requires `context.workspace.slug === workspaceSlug`. A published guide is thus
  only viewable by a signed-in member **whose active workspace matches the URL's
  slug** — not by anonymous visitors, and not cross-workspace. Whether that is the
  intended product behavior is worth confirming.
- **No Clerk middleware.** There is **no `src/middleware.ts`** anywhere in the
  project. Clerk's App Router integration normally expects `clerkMiddleware()` for
  session resolution and edge-level route protection. Its absence means route
  protection is **100% in-page guard-based**, and it should be verified that
  `auth()`/`currentUser()` resolve correctly in this Next 16 setup without it.
  (Flagged by backend-investigator; reviewer to verify against the running app.)

## 5. Incomplete, mocked, or placeholder functionality

All three investigators independently converged on the same core gap: **there is
no AI anywhere in `src`.** Grep (case-insensitive) for
`anthropic|openai|@anthropic-ai|chat completion|generateText|llm` across `src`
returns zero matches; `package.json` has no AI SDK. The only such hits repo-wide
are in ruflo/claude-flow dev tooling (`.claude-flow/*`, `CLAUDE.md`), not app code.

Concretely placeholder/incomplete:

- **`generateGuideFromCaptureAction`** (`src/lib/app-actions.ts:122`) — the sole
  capture→guide code path. It *does* create a Guide linked via `sourceCaptureId`
  (so the relation is exercised) but copies the capture's title/description
  verbatim and **hardcodes a single placeholder step** ("Review captured
  material" / "Add the first approved step…", `:140`). On-screen copy:
  *"Automated guide generation is intentionally deferred… Phase 2 will automate
  draft generation."* No capture content is analyzed — and captures hold no
  analyzable content anyway (§2, §3).
- **`/app/record`** — manual metadata form, no recording/upload (§2).
- **Capture detail placeholder cards** — screenshot/timeline/generation panels are
  static copy (`src/app/app/captures/[captureId]/page.tsx`).
- **Step screenshots** — `screenshotUrl` is free text; the viewer renders dashed
  placeholders.
- **Assistant** — deterministic keyword retrieval, not AI (§2).
- **`AssistantConversation`/`AssistantMessage` tables** — migrated but unused.
- **`auth-placeholder.tsx`** — graceful-degradation card shown when Clerk keys are
  absent (`login`/`sign-up` pages when `!isClerkConfigured()`). Reachable in
  production if deployed without Clerk envs; it surfaces dev-oriented "add keys to
  .env.local" copy to end users. Not a data mock, but a misconfiguration leak.

What is **real and production-shaped** (do not rebuild): the guide authoring
lifecycle, role/permission model, review→publish state machine with versioned
snapshots, workspace/team/invitation management, and the readiness/visibility
policy helpers.

## 6. Smallest viable capture-to-structured-guide vertical slice

**Goal:** turn a capture into a *structured, multi-step DRAFT guide* (title,
summary, ordered steps, prerequisites, common mistakes) via an LLM, landing in
`DRAFT` so the existing (real) review/publish/versioning machinery gates it —
**zero downstream changes required.**

**The clean seam** (all three investigators agree): replace the hardcoded step
block inside `generateGuideFromCaptureAction` (`src/lib/app-actions.ts:122-152`)
with an LLM call that produces content conforming to the guide Zod shape in
`src/lib/validation/guide.ts` (`title` 3–140, `summary` 10–400, `steps[]`
`{title, instruction ≤2000, explanation?, warning?}`, `prerequisites[]`,
`commonMistakes[]`).

**The upstream blocker** (flagged by pipeline- and backend-investigators):
captures currently carry only `title` + `description` (`createCaptureSchema`,
`src/lib/validation/capture.ts`), so there is no rich substrate to generate from.
Two honest options:

- **Option A — minimal proof (no migration).** Generate a structured multi-step
  draft from just the capture's `title` + `description`. Truly minimal, exercises
  the full LLM→Zod→Prisma→DRAFT→review path, but low input fidelity.
- **Option B — thin substrate then generate (small migration).** Add a text
  `notes`/`transcript` field (or a lightweight `CaptureNote`/`CaptureArtifact`
  child) to `CaptureSession` so an author can paste steps/observations, then
  generate from that. Higher value; requires one additive migration (§8).

**Recommended slice:** **Option A first** as the vertical proof — it validates the
entire pipeline (new AI dependency → structured output → Zod validation →
transactional multi-row insert → DRAFT guide → existing review/publish) with the
least surface area and no migration, no storage, no media ingest. Then layer
Option B as the immediate follow-up once the seam is proven. **Explicitly out of
scope for the first slice:** screen/desktop recording, screenshot upload/object
storage, embeddings/semantic search, and replacing the Q&A assistant.

**Important distinction (pipeline-investigator):** the published-guide **Q&A
assistant** (`GuideAssistant` interface, `src/lib/assistant/types.ts` — cleanly
swappable) is a *separate concern* from the **capture→guide generator**. This
slice targets the generator, not the assistant. Do not conflate them.

## 7. Exact files likely to change

**Modify (existing):**

- `src/lib/app-actions.ts` — rewrite `generateGuideFromCaptureAction` (`:122`) to
  call the new generator and transactionally insert the returned steps /
  prerequisites / common mistakes (mirroring the multi-row create in
  `createGuideAction`). Keep the `sourceCaptureId` link and `DRAFT` status.
- `src/lib/validation/guide.ts` — add a schema for the LLM's **structured output**
  (reuse/extend existing step/list shapes) so the model response is Zod-validated
  before it touches Prisma (boundary validation).
- `package.json` — add an AI SDK dependency (e.g. `@anthropic-ai/sdk`).
- `src/lib/env.ts` — add the model API key (and ideally introduce fail-fast Zod
  env validation while here — see §9).
- `src/app/app/captures/[captureId]/page.tsx` — update copy / button state to
  reflect real generation (and, for Option B, add the notes input).
- `.env` example / `README.md` — document the new required env var.
- *(Option B only)* `prisma/schema.prisma` + new migration; `src/lib/validation/
  capture.ts` to accept the notes field; `createCaptureAction`.

**New:**

- `src/lib/guides/generation.ts` (or `src/lib/ai/guide-generator.ts`) — the
  generator module: builds the prompt from capture content, calls the model,
  parses + Zod-validates structured output, returns a normalized draft. Keep it
  behind a small interface so it is swappable/testable (mirror the
  `GuideAssistant` pattern).
- `src/lib/guides/generation.test.ts` — unit tests for prompt construction and
  (mocked) output parsing/validation (§10).

*(New model files are Option-B-only and depend on the migration decision in §8.)*

## 8. Is a database migration necessary?

**Option A: No.** The recommended minimal slice needs no schema change. The
backend investigator diffed `prisma/migrations/20260722_init_phase1/migration.sql`
line-by-line against `prisma/schema.prisma` and found **zero drift** — all 7 enums,
14 tables, every column/type/nullability/default, every index, unique, and FK
`onDelete` rule match exactly, and the schema has not been hand-edited since the
init migration. The baseline is clean and in-sync. Generating multiple
`GuideStep`/`GuidePrerequisite`/`GuideCommonMistake` rows and a `DRAFT` `Guide`
uses only existing tables, so **Option A requires no migration**.

**Option B: Yes — one additive migration.** Adding a `notes`/`transcript` field
(or a `CaptureNote`/`CaptureArtifact` child model) to carry generation substrate
requires a **new** migration (there is no pending/un-applied change to piggyback
on). If you touch `CaptureSession` anyway, strongly consider adding the missing
`@@index([workspaceId, …])` in the same migration (§3). Any future work wiring up
the dormant `AssistantConversation`/`AssistantMessage` tables would also be a new
migration, but that is out of scope for this slice.

**Recommendation:** ship Option A with **no migration**, then do a single small
additive migration for Option B as the follow-up.

## 9. Security and authorization risks (reviewer-verified)

**Existing code — confirmed findings:**

- **Cross-workspace child-mutation IDOR (moderate, confirmed).** Three `update*`
  guide-child actions call `requireGuideEditor(guideId)` (which correctly scopes the
  *parent* guide to the caller's active workspace), then write the child row by
  primary key **only**, with no `guideId` (and therefore no workspace) constraint:
  - `updateGuidePrerequisiteAction` — `prisma.guidePrerequisite.update({ where: { id: parsed.itemId } })` (`src/lib/app-actions.ts:228`)
  - `updateGuideMistakeAction` — `prisma.guideCommonMistake.update({ where: { id: parsed.itemId } })` (`:252`)
  - `updateGuideStepAction` — `prisma.guideStep.update({ where: { id: parsed.stepId } })` (`:347`)

  Because the `where` targets a global PK, a user who is a legitimate editor of *any*
  guide in *their* workspace can pass their own `guideId` (to satisfy the guard) plus
  a `stepId`/`itemId` belonging to a **different guide in a different workspace** and
  overwrite that record's text/instruction/warning. It is a **blind cross-tenant
  write** (data tampering / integrity), not a read primitive — nothing is returned to
  the attacker. Practical exploitability is limited because ids are `@default(cuid())`
  (non-sequential, not enumerable), so an attacker needs to obtain a target id out of
  band; this lowers likelihood but does not remove the flaw, and defense-in-depth
  requires scoping. Severity **moderate** is correct. By contrast the sibling paths
  are already safe: `remove*` use `deleteMany({ where: { id, guideId } })`
  (`:236`, `:260`, `:364`) and `moveGuideItemAction` loads items with
  `findMany({ where: { guideId } })` before swapping (`:273`, `:285`, `:297`).
  **Fix:** make each child write scoped, e.g. `updateMany({ where: { id, guideId }, data })`
  and treat a zero-row result as `notFound()`. This code path currently has **no test
  coverage of any kind** (see §10).

- **Webhook signature verification is present and correct (checked — NOT a vuln).**
  `src/app/api/webhooks/clerk/route.ts:8` calls `verifyWebhook(request)` from
  `@clerk/nextjs/webhooks` before trusting any payload, and the surrounding
  `try/catch` returns **400** on any verification failure (`:29-30`). The commonly-seen
  "unauthenticated Clerk webhook writes arbitrary users" vulnerability does **not**
  exist here. (Caveat below re: `CLERK_WEBHOOK_SECRET` config detection.)

- **No Clerk middleware — route protection is 100% in-page guard-based (confirmed).**
  There is **no `src/middleware.ts`/`middleware.js`** anywhere in the project (glob
  matches only `node_modules/**` and `.next/**` build artifacts). Every protected
  surface therefore depends on an in-page `requireUser()` / `requireWorkspaceRole()` /
  `requireGuideEditor()` call; any future route added without one is silently
  unauthenticated. Additionally, current Clerk App Router releases document
  `clerkMiddleware()` as a prerequisite for `auth()`/`currentUser()` to resolve — its
  absence should be verified against the **running** app (could not be exercised in
  this static read-only audit). If `auth()` in fact throws or returns empty without
  the middleware, `requireUser()` would fail closed (redirect to `/login`), which is
  safe-by-accident but fragile.

- **Env is not validated / not fail-fast (confirmed).** `src/lib/env.ts` uses `?? ""`
  fallbacks for every key, and `isClerkConfigured()` (`:9-11`) checks only
  `clerkPublishableKey && clerkSecretKey` — it does **not** check
  `CLERK_WEBHOOK_SECRET`. The app can therefore consider itself "configured" and serve
  traffic while every Clerk webhook silently 400s (user sync quietly broken). Adding an
  AI API key (§7) is the moment to introduce fail-fast Zod env parsing.

- **`auth-placeholder` misconfiguration leak (confirmed, low).**
  `src/components/auth/auth-placeholder.tsx` renders dev-oriented copy ("Add Clerk keys
  to `.env.local` … listed in `.env.example`") and is shown on `/login` / `sign-up`
  whenever `!isClerkConfigured()`. If deployed without Clerk envs it surfaces internal
  setup instructions to end users. Informational only (no data exposure), but should
  fail to a neutral error page in production.

- **Privilege-granting dev script (confirmed present, adequately gated — informational).**
  `src/scripts/bootstrap-dev-admin.ts` upserts a `WorkspaceMembership` with role
  `ADMIN` for an arbitrary email. It is **not** a web route (CLI-only, needs DB access)
  and is double-gated: it throws when `NODE_ENV === "production"` (`:13-14`) **and**
  requires `MONSTRA_ALLOW_DEV_BOOTSTRAP === "true"` (`:16-17`). Not remotely reachable;
  no action needed beyond ensuring the flag is never set in a prod-like env. (Note:
  `MONSTRA_ALLOW_DEV_BOOTSTRAP` appears in `.env.example` — read via `process.env`
  directly, it is intentionally not surfaced through `src/lib/env.ts`.)

- **Secrets hygiene (confirmed clean).** The only tracked env file is `.env.example`
  (`git ls-files`), and it contains empty placeholders only
  (`DATABASE_URL=`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=`, `CLERK_SECRET_KEY=`,
  `CLERK_WEBHOOK_SECRET=`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`,
  `MONSTRA_ALLOW_DEV_BOOTSTRAP=false`) — no real credentials committed.

**New AI-slice risks introduced by wiring `generateGuideFromCaptureAction` to an LLM:**

- **Model output is currently un-validated at this seam.** Unlike `createGuideAction`
  (which parses `createGuideSchema`), `generateGuideFromCaptureAction`
  (`src/lib/app-actions.ts:122-152`) uses **no Zod schema** — it reads the capture and
  builds the guide directly. There is today **no schema for generated guide content**.
  When the hardcoded step block (`:139-146`) is replaced by an LLM call, the model's
  JSON **must** be parsed through a new Zod schema (mirroring the existing
  `title`/`summary`/step length bounds in `src/lib/validation/guide.ts`) before it
  reaches `prisma.*.create` — never trust model output shape, length, or count.
- **Prompt injection (untrusted input).** Capture `title`/`description` (and any future
  `notes`) are user-authored and flow into the prompt. Treat them as hostile: delimit
  them clearly, never let them dictate system instructions, and never echo model output
  into a privileged action without the Zod gate above.
- **PII / privacy.** Monstra is positioned "privacy-first"; sending capture content to
  an external model provider is a new data-egress path that needs an explicit product
  decision and likely a per-capture consent/ack (the `/app/record` form already has a
  `privacyAcknowledged` checkbox — extend that contract, do not bypass it).
- **Cost / DoS.** Keep the generation action role-gated
  (`requireWorkspaceRole([ADMIN, AUTHOR])` — already the pattern at `:123`) and add
  rate/size limiting so a member cannot loop expensive generations.
- **Secret handling.** The model API key must be **server-only** (added to
  `src/lib/env.ts`, never `NEXT_PUBLIC_`) and only referenced inside the `'use server'`
  generator module.

## 10. Focused tests to add (reviewer-verified)

**Current coverage (reviewer read all five test files):** the existing suite is real
and meaningful — not stubs. `guards.test.ts` (invitation states, final-admin
protection), `policy.test.ts` (role permissions, all lifecycle transitions, readiness
gate, library-`where` scoping), `clerk-sync.test.ts` (create/update/no-email paths via
an in-memory mock db — a good boundary-mock pattern to reuse for the AI generator),
`placeholder-assistant.test.ts` (ranking order + empty case), and `slug.test.ts`
(normalize/reserved/increment). **The gap is location, not quality:** every test targets
a *pure helper*. **Zero tests exercise `src/lib/app-actions.ts` or `src/lib/auth/
session.ts`** — so the entire server-action layer, including the confirmed IDOR, the
publish `$transaction`, and all workspace-isolation guards, is untested. Recommended
additions, in priority order (all `tsx --test`, colocated `*.test.ts`, node mocks — no
DB, no network — unless noted):

1. **IDOR regression guard (highest priority — covers a live bug).** Extract the child
   write into a small testable helper (or inject the Prisma client) and assert that
   `updateGuideStep/Prerequisite/Mistake` issue a `where` containing **both** `id`
   **and** `guideId`, and that a mismatched `(guideId, itemId)` pair updates **zero
   rows** / raises `notFound()`. Guards against regression once §9's fix lands.
2. **Generator output validation (new Zod schema).** Feed representative and adversarial
   model outputs — missing `title`/`summary`, over-length `instruction` (>2000),
   empty `steps[]`, extra/unknown keys, and prompt-injection control text — through the
   new generated-guide schema; assert precise accept/reject. This is the safety net that
   stops untrusted model JSON reaching Prisma.
3. **Generator mocked at the boundary.** Inject a fake model client (mirror
   `clerk-sync.test.ts`'s mock-db style) so `generateGuideFromCaptureAction` runs with
   no network; assert it (a) creates a `DRAFT` guide with `sourceCaptureId` set,
   (b) inserts N validated steps/prereqs/mistakes transactionally, and (c) on invalid
   model output throws **before** any write (no partial guide).
4. **Prompt construction / injection hardening.** Assert capture
   `title`/`description`/`notes` are included in the prompt and wrapped in explicit
   untrusted-content delimiters, and that capture text cannot smuggle system-role
   instructions.
5. **Readiness gate still applies to generated drafts.** A generated `DRAFT` must still
   fail `buildGuideReadyState` (`src/lib/guides/policy.ts`) when title/summary/step are
   missing, so an empty AI draft cannot skip straight to `IN_REVIEW`/`PUBLISHED`.
6. **Capture→guide authorization.** Assert `generateGuideFromCaptureAction` and
   `createCaptureAction` reject a `TRAINEE` (only `ADMIN`/`AUTHOR` pass
   `requireWorkspaceRole`), and that a `captureId` from another workspace resolves to
   "Capture not found." (the `findFirst({ where: { id, workspaceId } })` scope at
   `src/lib/app-actions.ts:125-127`).
7. **(DB integration tier, if introduced)** cross-workspace isolation end-to-end (the
   IDOR, plus `requirePublishedGuideViewer` slug-scoping), and the publish
   `$transaction` + `GuideVersion` snapshot upsert (`app-actions.ts:403-430`) against a
   real Postgres — none of which the current logic-only suite can reach (README
   acknowledges the absence of DB-backed tests).

## Reviewer Verification

Independent read-only verification by the reviewer (security/testing). No application
source was modified; only this doc was edited.

**Files personally opened and checked:**

- `prisma/schema.prisma` (full) and `prisma/migrations/20260722_init_phase1/migration.sql`
  (full) — compared model-by-model, index-by-index, FK-by-FK.
- `src/lib/app-actions.ts` (full, all ~25 actions).
- `src/lib/auth/session.ts`, `src/lib/auth/permissions.ts`, `src/lib/auth/clerk-sync.ts`.
- `src/app/api/webhooks/clerk/route.ts`.
- `src/components/auth/auth-placeholder.tsx`.
- `src/lib/workspace/active-workspace.ts`, `src/lib/team/guards.ts`, `src/lib/env.ts`.
- `src/lib/validation/capture.ts`, `guide.ts`, `workspace.ts`.
- All five test files: `slug.test.ts`, `guards.test.ts`, `policy.test.ts`,
  `clerk-sync.test.ts`, `placeholder-assistant.test.ts`.
- `src/scripts/bootstrap-dev-admin.ts` (found while tracing an env var).
- `.env.example` via `git show` (direct read blocked by tooling permissions); confirmed
  `git ls-files` tracks no other env file.
- Greps: AI-SDK usage across `src`; `middleware.*` glob; `sourceCaptureId`/`captureId`
  references; `MONSTRA_ALLOW_DEV_BOOTSTRAP`.

**Verdict:** the draft is **accurate**; all seven flagged claims held up under
independent inspection (no AI in `src` — the lone grep hit was the substring "llm"
inside "enro**llm**ent"; single hardcoded placeholder step; the IDOR; no
`src/middleware.ts`; non-public published viewer; **zero** migration drift; env not
fail-fast). Changes I made were refinements and depth, not reversals:

- **Corrected line references for the IDOR** — the draft cited the function *declaration*
  lines (`225`/`249`/`336`); the actual unscoped `.update({ where: { id } })` calls are
  at `228`/`252`/`347`. Cited both the safe siblings (`remove*` `:236/:260/:364`,
  `moveGuideItem` `:273/:285/:297`) as evidence the pattern is inconsistent.
- **Refined IDOR characterization** — clarified it is a *blind cross-workspace write*
  (tampering, not read), practically gated by non-enumerable `cuid` ids, and noted the
  path is entirely untested. Severity "moderate" confirmed as fair.
- **Affirmed the Clerk webhook is safe** — `verifyWebhook` + 400-on-failure is present
  and correct; explicitly recorded this as a checked-and-clear item (it is the "common
  real vulnerability" this review was asked to rule out).
- **Corrected the hardcoded-step line span** — `:139-146`, not `:140`; and added that
  `generateGuideFromCaptureAction` uses **no Zod schema** today, which is exactly the
  seam where AI output validation must be added.
- **Added two items the draft omitted** — the properly-gated `bootstrap-dev-admin.ts`
  privilege-granting script, and confirmation that `.env.example` holds only empty
  placeholders (no committed secrets).
- **Rewrote §10** to record that the existing tests are genuinely meaningful (not stubs)
  but that the whole server-action/auth-guard layer — including the IDOR — is untested,
  and reprioritized the recommended tests accordingly.

**Could not verify (out of scope for a static audit):** whether `auth()`/`currentUser()`
resolve at runtime without `clerkMiddleware()` in this Next 16 setup — flagged in §9 as
needing a live-app check.

---

*Prepared by architect from backend-investigator, frontend-investigator, and
pipeline-investigator reports; sections 9–10 independently deepened and the whole
document fact-checked by the reviewer.*
