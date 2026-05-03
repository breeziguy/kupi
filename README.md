# KUPI — iMessage AI Wingman

AI-powered dating wingman that lives in iMessage. Users sign up on the web, then interact entirely through iMessage — no app download needed.

## Architecture

```
apps/web/   → Next.js 15 (Vercel) — landing page + onboarding
apps/bot/   → Node.js spectrum-ts process (Railway) — iMessage bot
convex/     → Shared backend (database, mutations, HTTP webhooks)
```

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A [Convex](https://convex.dev) account
- An [OpenAI](https://platform.openai.com) API key
- A [Photon/Spectrum](https://app.photon.codes) project (for iMessage)
- A [Polar.sh](https://polar.sh) account (for billing)

### 2. Install dependencies

```bash
npm install
```

### 3. Initialize Convex

```bash
npx convex dev
```

This creates `convex/_generated/` with TypeScript types. Keep this running in a terminal while developing.

### 4. Set up environment variables

Copy the example and fill in your credentials:

```bash
# For the bot
cp .env.example apps/bot/.env

# For the web app
cp .env.example apps/web/.env.local
```

Required variables:

| Variable | Where | Description |
|---|---|---|
| `CONVEX_URL` | `apps/bot/.env` | From `npx convex dev` output |
| `OPENAI_API_KEY` | `apps/bot/.env` | OpenAI API key |
| `SPECTRUM_PROJECT_ID` | `apps/bot/.env` | From Photon dashboard |
| `SPECTRUM_PROJECT_SECRET` | `apps/bot/.env` | From Photon dashboard |
| `POLAR_CHECKOUT_URL` | `apps/bot/.env` | Your Polar.sh checkout link |
| `WEB_URL` | `apps/bot/.env` | Your deployed web URL |
| `NEXT_PUBLIC_CONVEX_URL` | `apps/web/.env.local` | Same as CONVEX_URL |
| `NEXT_PUBLIC_KUPI_PHONE` | `apps/web/.env.local` | KUPI's iMessage phone number |
| `POLAR_WEBHOOK_SECRET` | Convex dashboard env vars | From Polar.sh webhook settings |

### 5. Run locally

```bash
# Terminal 1 — Convex
npx convex dev

# Terminal 2 — Web
npm run dev:web

# Terminal 3 — Bot (uses terminal provider in dev mode)
cd apps/bot && npm run build && NODE_ENV=development npm start
```

The bot will run in terminal mode locally — you type messages and see responses without needing iMessage credentials.

## Testing

```bash
cd apps/bot && npx vitest run
```

21 tests covering billing logic, screenshot handling, command routing, and all AI modules.

## Deployment

### Bot → Railway

1. Create a new Railway project, connect this repo
2. Set root directory to `apps/bot`
3. Set start command: `npm run build && npm start`
4. Add all bot env vars (see table above)

### Web → Vercel

1. Import this repo to Vercel
2. Set root directory to `apps/web`
3. Add web env vars (`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_KUPI_PHONE`)

### Convex → Production

```bash
npx convex deploy
```

Add `POLAR_WEBHOOK_SECRET` in the Convex dashboard under Settings → Environment Variables.

### Polar.sh Webhook

Point the webhook to: `https://your-convex-deployment.convex.site/webhooks/polar`

Pass `phone` in customer metadata when creating the Polar checkout link (so the webhook can match the payment to a user).

## Customisation

### Change the wingman name

Edit `apps/bot/config.ts`:
```ts
wingmanName: "KUPI",  // ← change this
```

### Change the AI model

Edit `apps/bot/config.ts`:
```ts
ai: {
  model: "gpt-4o-mini",       // ← text model
  visionModel: "gpt-4o-mini", // ← vision model
}
```

### Add a new command

1. Add handler in `apps/bot/handlers/commands.ts`
2. Register trigger phrase in `handleCommand()`
3. Add any new AI logic in `apps/bot/ai/`
4. Add tests in `apps/bot/__tests__/`

### Add a new billing tier

1. Create the product in Polar.sh
2. The Polar webhook handles it automatically — `subscription.product.name.toLowerCase()` becomes the plan name
3. Add plan-specific logic in `apps/bot/handlers/billing.ts`
