@AGENTS.md

# Neighborhood Gift Bank

A mobile-first personal notebook for a roving listener tracking neighbors' gifts, dreams, and connections. Single user, ~100 people in scope.

## Stack

- Next.js 16 (App Router) with TypeScript
- Neon (Postgres) for storage via `@neondatabase/serverless` — schema in `db/schema.sql`
- Simple password gate via `APP_PASSWORD` env var (single-user auth, cookie session)
- Anthropic Claude API via `@anthropic-ai/sdk` (server-side only, never expose the key client-side)
- Resend for the daily follow-up email digest, fired by a Vercel Cron
- Tailwind CSS with custom theme (paper/ink/terracotta/sage palette)
- Fonts: Fraunces (serif headings/names), DM Sans (body), Caveat (handwritten marginalia)
- Lucide React icons (heavier stroke weight)
- PWA-installable (manifest + icons), voice capture via the phone keyboard's dictation mic

## Project structure

- `src/app/` — Next.js App Router pages and API routes
- `src/app/api/` — server-side API routes (auth, parse-note, remember, people, notes, search, cron)
- `src/components/` — shared React components
- `src/lib/` — DB client (`db.ts`), auth helpers (`auth.ts`), types (`database.types.ts`), demo data, Resend
- `db/schema.sql` — Postgres schema; apply once to the Neon database

## Key conventions

- All Claude API calls go through server-side API routes (never client-side)
- The data model uses notes as source of truth — gifts, connections, and reminders always link back to their source note
- Gift kinds: head, heart, hand, teachable, dream (from McKnight/Block's ABCD framework)
- DB access only through `src/lib/db.ts`: `query(text, params)` with `$1`-style placeholders, plus `rowTo*` mappers. `isDbConfigured()` is false when `DATABASE_URL` is unset — routes then fall back to in-memory demo data.
- Timestamps/dates are stored as ISO-8601 **text** (not Postgres timestamptz) so they round-trip as plain strings and the app stays dialect-agnostic.
- Auth via cookie session; routes check `isAuthenticated()` / `isAuthenticatedReq()` from `src/lib/auth.ts`. If `APP_PASSWORD` is unset, auth is bypassed (demo mode).
- Reminders are inserted as a side-effect of saving a note when a follow-up has a `due_date`; Vercel Cron hits `/api/cron/send-reminders` daily at 15:00 UTC to send the digest.

## Aesthetic constraints

This is NOT a CRM, SaaS dashboard, or data management tool. It is a personal notebook.

- Background: cream/paper (#F8F1E4), not white
- Text: deep brown ink (#3B2A1E), not black
- No gradients, glass-morphism, neon, or "snappy fintech" motion
- Cards get subtle organic rotation (0.5-2 degrees) to feel like a real pile
- Empty states are warm and quiet, not corporate onboarding
- Tap targets at least 48px tall
- Motion is slow and gentle (fades, not slides)
- No decorative fonts on labels — high contrast for outdoor mobile use

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run seed     # seed demo data into the configured Neon DB
npx tsc --noEmit # type check
```

## Environment variables

See `.env.example`. Required for full functionality: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `APP_PASSWORD`. Leave `DATABASE_URL` and `APP_PASSWORD` blank locally for demo/no-auth mode.
