@AGENTS.md

# Kape — project rules

A "Buy Me a Coffee" page for Filipino creators, with a mascot named **Tasa**. Portfolio piece: Next.js + Stripe end to end.

## Stack

- Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4
- `stripe` Node SDK (v23, API `2026-10-28.endive`) against a **Stripe sandbox only**
- Vitest for unit tests
- Deploys to Vercel. **No database, no auth provider.**

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm test` | Vitest, run once |
| `npm run test:watch` | Vitest, watch mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

`npm test`, `npm run typecheck` and `npm run build` must all pass before a commit.

## Architecture rules

- **Stripe is the database.** Completed Checkout Sessions are supporters, Subscriptions are members. Name, note, coffee count, tier and privacy travel as Checkout metadata (`metadata.app = "kape"`).
- **Prices live on the server.** The browser only sends `coffees` (1, 3 or 5) or `tier` (`regular`, `barista`). Everything goes through `src/lib/pricing.ts`. Never read an amount from a request.
- **Test keys only.** `src/lib/stripe.ts` refuses any key that doesn't start with `sk_test_` or `rk_test_`. Never add a live-key code path.
- **Graceful fallback.** Any missing key, bad key or Stripe error means demo mode: sample data plus sleepy Tasa. Pages must never throw because Stripe is down.
- Caching: `cacheComponents` is **off** on purpose so `/` can use `export const revalidate = 60` (see `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`). The webhook calls `revalidatePath('/')` and `revalidatePath('/dashboard')`.
- Never echo URL text onto a page. Notices map fixed query keys to fixed copy.
- Session ids from URLs or forms must match `cs_test_...` before use.

## Layout

```
src/app/            routes (/, /thanks, /dashboard, /api/*)
src/components/     UI (Tasa, cards, forms, chart)
src/lib/            pure logic + Stripe access (tested)
src/lib/*.test.ts   Vitest tests sit next to the code
```

## Conventions

- Pure logic in `src/lib`, no React there. Keep it testable without network.
- Server Components by default. Add `"use client"` only for interaction (coffee picker, notices).
- Forms are plain `<form method="post">` and must work without JavaScript. Route handlers answer with `303` redirects.
- Money is integer cents (USD) everywhere; format only at the edge with `formatUSD`.
- Design tokens live in `src/app/globals.css` under `@theme`. Use the palette names (`paper`, `milk`, `espresso`, `roast`, `crema`, `blush`, `line`), not raw hex.
- Fonts: Outfit (sans, everything), Instrument Serif italic (`font-serif italic`, accents only), JetBrains Mono (test banner and frame numbers only).
- Tasa is decorative (`aria-hidden`) everywhere except the favicon. All motion is off under `prefers-reduced-motion`.
- Grid children get `min-w-0`. No horizontal scroll at 360px.
- Commit after each phase in `PLAN.md` with a clear message. Never commit `.env*` files except `.env.example`.
