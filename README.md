# Monstra Guide

Monstra Guide is a privacy-first AI training product that turns approved computer tasks into step-by-step operational guides. The current codebase contains the Phase 1 authenticated application shell, role-aware guide flows, a published guide viewer, knowledge search, invitation management, and a deterministic placeholder assistant.

## Phase 1 scope

Included in the current implementation:
- Clerk-backed authentication wiring
- Workspace onboarding and switching
- Users, memberships, invitations, and role-aware navigation
- Manual capture sessions
- Browser-based screen recording (start/pause/private/stop) for manual captures
- Private Cloudflare R2 screenshot storage for manual capture sessions
- AI-assisted draft guide generation from a capture's title and notes
- Guide library, detail view, and editor shell
- Guide review and publication lifecycle
- Published guide viewer at `/g/[workspaceSlug]/[guideSlug]`
- Knowledge search over published guide content
- Deterministic approved-guide assistant
- Team management and settings foundation
- Prisma schema, migrations, and seed workflow

Still out of scope for Phase 1:
- Native desktop capture (OS-level, per-application exclusion)
- Recording/audio upload storage (screenshots only so far)
- Embeddings or semantic search
- Autonomous actions
- Enterprise retention enforcement

## Architecture

- Next.js App Router with server components and server actions
- TypeScript
- Clerk for authentication
- PostgreSQL with Prisma
- Zod for validation
- Tailwind CSS with Monstra Guide UI primitives
- Cloudflare R2 (S3-compatible, via AWS SDK v3) for private screenshot storage
- Anthropic API for AI-assisted guide drafting

## Route map

Public routes:
- `/`
- `/early-access`
- `/privacy`
- `/terms`
- `/login`
- `/sign-up`
- `/accept-invite`

Authenticated app routes:
- `/app`
- `/app/onboarding`
- `/app/record`
- `/app/captures`
- `/app/captures/[captureId]`
- `/app/guides`
- `/app/guides/new`
- `/app/guides/[guideId]`
- `/app/guides/[guideId]/edit`
- `/app/knowledge`
- `/app/team`
- `/app/settings`

Published guide viewer:
- `/g/[workspaceSlug]/[guideSlug]`

Webhook route:
- `/api/webhooks/clerk`

## Database model summary

Core Phase 1 models:
- `User`
- `Workspace`
- `WorkspaceMembership`
- `WorkspaceInvitation`
- `CaptureSession`
- `Guide`
- `GuideStep`
- `GuidePrerequisite`
- `GuideCommonMistake`
- `GuideRelation`
- `GuideVersion`
- `AssistantConversation`
- `AssistantMessage`
- `CaptureAsset`

Important database constraints represented in schema and initial migration:
- unique `User.clerkUserId`
- unique `User.normalizedEmail`
- unique `Workspace.slug`
- one membership per user/workspace
- unique guide slug within a workspace
- stable step ordering per guide
- unique guide version per guide/version number
- unique invitation token

Invariants still enforced in application code rather than the database:
- reserved workspace slug rejection
- final-admin removal and demotion protection
- duplicate active invitation rejection by status/expiry logic
- cross-workspace authorization checks
- publication readiness rules
- related guide self-link prevention if added later in UI

## Role matrix

- `ADMIN`: full workspace access, publishing, team management, workspace settings
- `AUTHOR`: capture creation, guide creation/editing, submit for review, personal settings
- `TRAINEE`: published guides, knowledge search, published viewer, assistant, personal settings

## Guide lifecycle

Supported server-enforced transitions:
- `DRAFT -> IN_REVIEW`
- `IN_REVIEW -> DRAFT`
- `IN_REVIEW -> PUBLISHED`
- `PUBLISHED -> ARCHIVED`
- `ARCHIVED -> DRAFT`

Publishing behavior:
- requires title, summary, and at least one meaningful step
- sets `publishedAt`
- writes a `GuideVersion` snapshot
- stores ordered prerequisites, common mistakes, steps, warnings, screenshot placeholders, and related guide metadata in the snapshot

Current limitation:
- publication uses a version-keyed upsert for the snapshot record, which protects against duplicate version rows but has not yet been stress-tested against true concurrent duplicate publish submissions with a live database

## Assistant behavior

The Phase 1 assistant:
- searches only published guides
- stays inside the active workspace
- ranks deterministic text matches across guide metadata and steps
- returns source guide links and step excerpts
- falls back safely when no approved answer exists

## Environment variables

Required:
```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Required for AI-assisted guide generation:
```env
ANTHROPIC_API_KEY=
```

Required for screenshot storage (see "Screenshot storage (Cloudflare R2)" below). The app runs fine without these — the screenshots panel shows a "storage isn't configured" notice instead of erroring:
```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_REGION=auto
```

Optional development-only helper:
```env
MONSTRA_ALLOW_DEV_BOOTSTRAP=false
```

## Clerk setup

- Add Clerk keys in `.env.local`
- Point Clerk webhook delivery to `/api/webhooks/clerk`
- The webhook route uses Clerk signature verification and returns `400` when verification fails
- Local user sync is handled through `requireUser()` during app use and `syncClerkUserRecord()` for webhook events

## PostgreSQL and Prisma

Install dependencies:
```bash
npm install
```

Format the schema:
```bash
npx prisma format
```

Validate the schema:
```bash
npx prisma validate
```

Generate the client:
```bash
npx prisma generate
```

Migrations committed in this repo:
- `prisma/migrations/20260722_init_phase1/migration.sql`
- `prisma/migrations/20260724_capture_assets/migration.sql` (adds `CaptureAsset` for R2 screenshot storage; applied and confirmed against the real database — see "Verified locally on July 24, 2026")

`prisma.config.ts` loads `.env.local` via `dotenv` before Prisma resolves its datasource, so the commands below pick up local env vars automatically — no need to pass `DATABASE_URL` manually.

Useful migration commands when a real database is available:
```bash
npx prisma migrate deploy
npx prisma migrate status
```

## Screenshot storage (Cloudflare R2)

Manual captures can attach screenshots. Files are stored **privately** in Cloudflare R2 and are never proxied through Next.js or Vercel — the browser uploads directly to R2 using a short-lived presigned URL, and reads happen the same way.

### R2 setup

1. In the Cloudflare dashboard, create an R2 bucket (e.g. `monstra-guide-screenshots`).
2. **Do not enable public access** and do not attach a public R2.dev/custom domain to this bucket. It must stay private; all access goes through presigned URLs generated by the server.
3. Create an R2 API token scoped to **object read/write on this bucket only** (Account -> R2 -> Manage API Tokens). Note the Access Key ID, Secret Access Key, and your Cloudflare Account ID.
4. Configure the bucket's CORS policy (Cloudflare dashboard -> R2 -> bucket -> Settings -> CORS Policy, or `aws s3api put-bucket-cors` against the R2 S3-compatible endpoint) so the browser is allowed to `PUT` directly to presigned URLs from the app's origin(s):
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.example"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
   Presigning only proves the caller was authorized to request the URL — it does not exempt the browser's cross-origin request from CORS, so this step is required or uploads will fail in the browser even with a valid presigned URL.

### Required credentials

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_REGION=auto
```

Add these to `.env.local` for local development. The app checks `isR2Configured()` before rendering upload UI or calling R2 — without credentials, the screenshots panel shows a "storage isn't configured" notice instead of throwing.

### Upload flow

1. Authenticated client requests upload authorization for a given capture (`createScreenshotUploadAction`).
2. Server calls `requireCaptureAccess(captureId)`, which verifies active workspace membership and capture permissions (ADMIN/AUTHOR only).
3. Server validates MIME type (PNG/JPEG/WebP only) and size (10 MB max), generates a random object-key ID, and creates a `PENDING` `CaptureAsset` row with a server-computed object key — never the original filename.
4. Server returns a presigned `PUT` URL (5-minute expiry) for that exact key. The URL itself is never persisted to the database.
5. Browser uploads the file bytes directly to R2 using the presigned URL (XHR, so upload progress is available).
6. Client calls a completion action (`completeScreenshotUploadAction`).
7. Server re-fetches the object via `HeadObject`, confirms it actually exists, and re-validates its real size/content-type against the same MIME/size rules.
8. On success, the asset flips to `READY` (and to `FAILED` if verification fails, the object is missing, or the presigned window expired before completion).

Reads and deletes follow the same pattern: every `CaptureAsset` lookup goes through `requireCaptureAccess(captureId)` plus a workspace+capture ownership check (`assertAssetOwnership`) before a presigned `GET` URL is minted (15-minute expiry, generated fresh per request, never stored) or the R2 object is deleted.

### Security decisions

- Bucket is private; no public bucket access, no public custom domain.
- R2 credentials live only in server-side env vars (`R2_*`, no `NEXT_PUBLIC_` prefix) and are never sent to the client.
- Presigned URLs are generated on demand and are never written to the database — only the object key is stored.
- Object keys are server-generated (`workspaces/{workspaceId}/captures/{captureId}/raw/{assetId}.{extension}`), never derived from the original filename, and validated against a strict alphanumeric pattern before use.
- Every read and delete is scoped server-side by both workspace and capture ownership, not just by asset ID.
- Uploaded content is validated twice: once at authorization time (declared MIME/size) and again after upload via `HeadObject` (actual MIME/size on the object), so a client can't lie about what it uploaded.
- File bytes never pass through Next.js or a Vercel function — only short-lived signing happens server-side; the browser talks to R2 directly for both PUT and GET.

### Local development

- Without R2 credentials configured, the app runs normally; the screenshots panel just shows a configuration notice and upload is disabled.
- With credentials configured, run `npm run dev` and use the screenshots panel on `/app/captures/[captureId]`.
- This project's automated tests do not hit a real R2 bucket — the storage client is behind the `ObjectStorage` interface (`src/lib/storage/types.ts`) specifically so the authorization/validation logic can be unit-tested without live credentials. See "Requires external credentials or services" below for what has and has not been exercised against a real bucket.

## Seed workflow

Seed the development database:
```bash
npm run prisma:seed
```

The seed is intended to provide:
- one fictional workspace
- one admin
- one author
- one trainee
- two capture sessions
- one draft guide
- one guide in review
- two published guides
- ordered steps, prerequisites, common mistakes, and a related procedure
- one pending invitation

Seeded Clerk IDs are placeholders. After a real user signs in once, attach that local user record to the seeded workspace with the development bootstrap command.

## Development bootstrap

Development-only admin attach command:
```bash
MONSTRA_ALLOW_DEV_BOOTSTRAP=true npm run dev:bootstrap-admin -- --email you@example.com --workspace northwind-ops
```

Behavior:
- disabled in production
- requires explicit opt-in through `MONSTRA_ALLOW_DEV_BOOTSTRAP=true`
- does not expose any browser route
- operates only on an already-created local user record

## Local development

Run the app:
```bash
npm run dev
```

Run lint:
```bash
npm run lint
```

Run tests:
```bash
npm test
```

Build for production:
```bash
npm run build
```

## Testing

Current automated coverage is lightweight and logic-focused. It covers:
- workspace slug generation and reserved slug behavior
- role permissions and guide transitions
- guide readiness checks
- guide-library role scoping
- invitation and final-admin guards
- Clerk user sync helper behavior
- assistant ranking behavior
- AI guide-generation prompt construction and structured-output validation (mocked model client)
- screenshot upload validation: MIME type allowlist, size limits, safe object-key generation, workspace/capture ownership isolation, status/expiry guards

A separate database-backed integration test database has not been configured in this workspace yet, and no test hits a real R2 bucket or Anthropic API - the storage and generator clients are both behind interfaces specifically so this logic is testable without live credentials.

## Workspace isolation design

Workspace-owned queries are expected to include `workspaceId` in the database filter. This is enforced in the shared auth/session helpers and reused by app routes and server actions.

## Invitations and settings

- personal settings are available to all signed-in users
- workspace settings are admin-only
- invitation links are created for local testing and can be accepted at `/accept-invite`
- final-admin removal and demotion are blocked server-side

## Verified locally on July 22, 2026

Verified in this workspace:
- `npm test`
- `npm run lint`
- `npm run build`
- `npx prisma format` with a temporary local placeholder `DATABASE_URL`
- `npx prisma validate` with a temporary local placeholder `DATABASE_URL`
- `npx prisma generate` with a temporary local placeholder `DATABASE_URL`
- initial migration SQL generation from the current schema using `prisma migrate diff`
- Clerk webhook route exists on disk and compiles

## Verified locally on July 24, 2026 (R2 screenshot storage)

First pass, no live credentials available:
- `npx prisma format`, `npx prisma validate`, `npx prisma generate`
- `npm test` (53 tests, including the new capture-asset validation/authorization suite)
- `npm run lint`, `npm run build`
- `prisma/migrations/20260724_capture_assets/migration.sql` was hand-authored (no reachable database to run `prisma migrate dev`/`diff` against)

**Follow-up pass, with real `DATABASE_URL` and R2 credentials added to `.env.local`:**
- Added `prisma.config.ts` (loads `.env.local` via `dotenv` before Prisma resolves its datasource) so `prisma` CLI commands pick up local env vars the same way `next build`/`next dev` already do - this had been the source of the "needs a temporary placeholder DATABASE_URL" friction in the July 22 and first-pass July 24 notes above.
- `npx prisma migrate status` against the real database surfaced that it's a **shared Postgres instance** already hosting ~30 migrations for unrelated Monstra products (Stripe Connect, creator payouts, portfolio automation, push notifications, etc.) - confirmed intentional by the user before proceeding.
- `npx prisma migrate deploy` **applied `20260724_capture_assets` to the real database successfully.** `npx prisma migrate status` confirms "Database schema is up to date." A follow-up query against `information_schema.columns` confirmed the `CaptureAsset` table exists with the exact expected column set and is queryable via Prisma Client.
- **A full live round-trip against the real R2 bucket passed**: presigned PUT URL generated -> file uploaded directly to R2 -> `HeadObject` confirmed it landed with the correct size/content-type -> presigned GET URL generated -> file downloaded and matched byte-for-byte -> object deleted -> `HeadObject` confirmed it no longer exists. This exercised the actual `R2ObjectStorage` implementation, not a mock.

**Still not verified:**
- CORS behavior for direct browser-to-R2 uploads has not been exercised in a real browser (the round-trip above used a Node script calling `fetch` directly against the presigned URLs, which doesn't enforce browser CORS).
- Upload progress, thumbnail rendering, notes, ordering, and privacy toggles have not been exercised in a running browser against real data.
- Live Clerk flows and live Anthropic API guide generation remain unverified (see below).

## Requires external credentials or services

Not verified in this workspace:
- live Clerk sign-up/sign-in/sign-out flows
- live Clerk webhook delivery
- browser-based role verification
- cross-workspace isolation against a real seeded second workspace
- publication idempotency under real concurrent requests
- responsive QA in a browser
- accessibility QA in a browser
- browser-based R2 upload (CORS enforcement specifically - the server-side round-trip is verified, see above)
- live Anthropic API guide generation
- running the seed against the real database

## Known limitations and launch risks

- no live Clerk credentials were available locally
- automated tests are not yet database-backed integration tests
- guide publication concurrency was not validated against a real database transaction workload
- the shared Postgres instance hosts several unrelated Monstra products' tables alongside this app's — additive migrations only, never assume this schema is isolated to Monstra Guide
- browser-side R2 upload behavior (CORS, real XHR progress, thumbnail rendering) has not been exercised in an actual browser, only the server-side storage round-trip (PUT/HeadObject/GET/delete) against the real bucket

## Vercel deployment notes

- set Clerk keys and `DATABASE_URL` in Vercel environment variables
- set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_REGION`, and `ANTHROPIC_API_KEY` in Vercel environment variables
- ensure `NEXT_PUBLIC_APP_URL` reflects the deployed host, and add that host to the R2 bucket's CORS `AllowedOrigins`
- configure Clerk webhook delivery to the deployed `/api/webhooks/clerk` route

## Phase 2 handoff

Planned later-phase work includes:
- native desktop capture with true OS-level per-application exclusion (not achievable from a web page)
- recording/audio upload storage (video is explicitly out of scope until screenshots are proven correct)
- richer screenshot review workflows (annotations, redaction)
- embeddings and semantic retrieval
- richer assistant conversations and persistence
- expanded audit logging and enterprise controls