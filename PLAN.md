# Kape — build plan

Each phase ends with `npm test`, `npm run typecheck` and `npm run build` passing, then a commit.

## Phase 1 — Foundations
- `CLAUDE.md`, `PLAN.md`, `.env.example`, scripts (`test`, `typecheck`), Vitest config.
- Turn off `cacheComponents` so route segment `revalidate` works.

**Acceptance:** `npm test` runs (no tests yet is OK), typecheck and build pass.

## Phase 2 — Core logic (`src/lib`)
- `config.ts`: Mara Santos content, goal, coffee price, tiers.
- `pricing.ts`: validate coffees (1/3/5) and tier ids (own-property only), trim name (40) and note (280).
- `stripe.ts`: lazy client, refuses non-test keys.
- `checkout.ts`: build Checkout params with inline `price_data`, metadata, success/cancel URLs.
- `supporters.ts`: Checkout Session → Support (unpaid dropped, refunded flagged, private masked); Subscription → Member.
- `stats.ts`: lifetime, this month, coffees, active members, MRR, 30-day series, goal progress.
- `sample.ts`: demo supporters and members.

**Acceptance:** tests reject 2 coffees, tampered amounts, unknown tiers including `toString`; Checkout params carry correct cents and metadata; mapping and stats tests pass.

## Phase 3 — API routes
- `POST /api/checkout` (form post → 303 to Stripe, `?error=invalid`, `?paused=1`).
- `POST /api/stripe/webhook` (raw-body signature check, revalidate `/` and `/dashboard` on the six events, idempotent).
- `POST /api/portal` (portal config created once with `metadata.app = "kape"`, reused).
- `data.ts`: load supports, members and invoices from Stripe, fall back to sample data.

**Acceptance:** webhook test: valid signature → 200 and revalidates; forged or missing signature → 400.

## Phase 4 — Design system + Tasa
- Fonts via `next/font/google`, palette tokens, grain, motion utilities, reduced-motion kill switch.
- `<Tasa mood size steam hop wiggle />` with idle, happy and sleepy moods. Favicon from Tasa's face.
- Layout: skip link, test-mode banner, header, footer.

**Acceptance:** build passes; Tasa renders in all three moods.

## Phase 5 — Creator page `/`
- Hero, goal card, support card (no-JS form, live counter, Tasa reacts), recent rolls strip, memberships, supporter wall, notices, payments-napping fallback.
- `export const revalidate = 60`.

**Acceptance:** loads in demo mode with no keys; no horizontal scroll at 360px.

## Phase 6 — Thanks page `/thanks`
- Reads Checkout Session by validated `session_id`. Happy Tasa, coffee-bean confetti (≤1.5s), summary, Manage membership button.

**Acceptance:** bad or missing session id shows a friendly generic thanks and never trusts URL amounts.

## Phase 7 — Dashboard `/dashboard`
- Password login (SHA-256 cookie, `timingSafeEqual`, httpOnly, lax, secure on https, 8h). Sample data open.
- Stat tiles, 30-day SVG bar chart, supports and members tables, idle-Tasa empty states.

**Acceptance:** wrong password rejected; demo mode browsable without login.

## Phase 8 — Docs and polish
- README (Mermaid flow, why Stripe is the DB, setup, test checklist, Vercel, sandbox expiry, limits, What I learned).
- Accessibility and responsive pass.

**Acceptance:** all three checks pass; README covers every required section.
