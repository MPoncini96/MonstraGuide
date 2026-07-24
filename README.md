# Monstra Guide

Monstra Guide is a privacy-first AI training product that turns approved computer tasks into step-by-step operational guides. The current codebase contains the Phase 1 authenticated application shell, role-aware guide flows, a published guide viewer, knowledge search, invitation management, and a deterministic placeholder assistant.

## Phase 1 scope

Included in the current implementation:
- Clerk-backed authentication wiring
- Workspace onboarding and switching
- Users, memberships, invitations, and role-aware navigation
- Manual capture sessions
- Guide library, detail view, and editor shell
- Guide review and publication lifecycle
- Published guide viewer at `/g/[workspaceSlug]/[guideSlug]`
- Knowledge search over published guide content
- Deterministic approved-guide assistant
- Team management and settings foundation
- Prisma schema, initial migration, and seed workflow

Still out of scope for Phase 1:
- Native desktop capture
- Screenshot upload or object storage
- LLM guide generation
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

Initial migration committed in this repo:
- `prisma/migrations/20260722_init_phase1/migration.sql`

Useful migration commands when a real database is available:
```bash
npx prisma migrate dev --name init_phase1
npx prisma migrate status
```

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

A separate database-backed integration test database has not been configured in this workspace yet.

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

## Requires external credentials or services

Not verified in this workspace because the local environment did not contain real credentials or a reachable Postgres server:
- real PostgreSQL connection
- `npx prisma migrate status` against a live database
- applying migrations to a real database
- running the seed against a real database
- live Clerk sign-up/sign-in/sign-out flows
- live Clerk webhook delivery
- browser-based role verification
- cross-workspace isolation against a real seeded second workspace
- publication idempotency under real concurrent requests
- responsive QA in a browser
- accessibility QA in a browser

## Known limitations and launch risks

- no `.env` or `.env.local` was present during this validation pass
- no reachable PostgreSQL server was available locally
- no live Clerk credentials were available locally
- automated tests are not yet database-backed integration tests
- guide publication concurrency was not validated against a real database transaction workload

## Vercel deployment notes

- set Clerk keys and `DATABASE_URL` in Vercel environment variables
- ensure `NEXT_PUBLIC_APP_URL` reflects the deployed host
- configure Clerk webhook delivery to the deployed `/api/webhooks/clerk` route

## Phase 2 handoff

Planned later-phase work includes:
- desktop capture and richer screenshot review
- upload/storage integration for screenshots
- AI-generated guide drafting
- embeddings and semantic retrieval
- richer assistant conversations and persistence
- expanded audit logging and enterprise controls