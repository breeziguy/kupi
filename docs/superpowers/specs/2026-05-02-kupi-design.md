# KUPI — iMessage AI Wingman: Design Spec

**Date:** 2026-05-02  
**Status:** Approved  
**Stack:** Next.js 15 + Convex + spectrum-ts + OpenAI + Polar.sh  
**Deployment:** Web → Vercel, Bot → Railway  

---

## Overview

KUPI is an AI wingman that lives in iMessage. Users sign up on a landing page, tap a deep link to start the conversation, then interact with KUPI entirely through iMessage — no app, no login. Users send screenshots of their chats; KUPI remembers each person they're talking to as a "chat folder", builds context over time, and provides reply suggestions, interest-level analysis, red/green flags, compatibility scores, and chat wraps.

Billing is managed entirely in iMessage — KUPI notifies users when their trial ends and sends a Polar.sh payment link. No web dashboard.

---

## Architecture

```
razzy/  (monorepo)
  apps/
    web/        ← Next.js 15 App Router — landing page + onboarding only
    bot/        ← Node.js spectrum-ts process — long-running
  convex/       ← shared schema, mutations, queries, HTTP actions
  docs/
    superpowers/specs/   ← design specs (this file)
```

### Request Flow — Bot

```
iMessage → spectrum-ts → bot/index.ts
                           ↓
                   lookup user in Convex
                           ↓
               check trial/subscription status
                           ↓
         screenshot? → GPT-4o mini vision (OCR + extract person)
                           ↓
              find/create chat folder in Convex
                           ↓
         generate reply suggestions or analysis (GPT-4o mini)
                           ↓
              log token usage in Convex
                           ↓
                   reply via spectrum-ts
```

### Request Flow — Onboarding

```
Landing page → form (name, gender, phone)
  → Convex onboardUser mutation
  → user record created (free trial starts)
  → success page: deep link  sms:+1XXXXXXXXXX&body=Hey KUPI!
  → user taps link → iMessage opens → user sends first message
  → KUPI replies with welcome message
```

### Request Flow — Billing (all in iMessage)

```
Bot checks trial/subscription before each message
  → trial expired → KUPI sends: "Your trial ended — pick a plan 👇 [Polar link]"
  → user pays → Polar.sh webhook → Convex HTTP action updates subscription
  → KUPI confirms: "You're live, let's get it 🔥"
```

---

## Modularity

The wingman name, AI model, and trial config all live in one file — `apps/bot/config.ts`. Changing the name of the wingman, swapping the AI provider, or adjusting trial length requires editing one place only.

```ts
// apps/bot/config.ts
export const config = {
  wingmanName: "KUPI",           // change name here only
  ai: {
    model: "gpt-4o-mini",
    visionModel: "gpt-4o-mini",  // swap AI provider here only
  },
  trial: {
    daysAllowed: 7,
  },
}
```

Adding a new command or analysis type = add a file in `handlers/` or `ai/`, register it in `onMessage.ts`. No other files need to change.

---

## Bot File Structure

```
apps/bot/
  index.ts              ← entry: wires spectrum-ts providers + message loop
  config.ts             ← wingmanName, AI model, trial settings
  
  handlers/
    onMessage.ts        ← routes incoming messages to correct handler
    screenshot.ts       ← handles screenshot messages
    commands.ts         ← "wrap", "red flags", "analysis", "help", etc.
    billing.ts          ← trial expiry checks, plan nudges, Polar links
  
  ai/
    client.ts           ← OpenAI client (swap provider here only)
    vision.ts           ← extract person name + messages from screenshot
    reply.ts            ← generate reply suggestions
    analysis.ts         ← interest level, red/green flags, compatibility
    wrap.ts             ← chat wrap / conversation summary
  
  convex/
    users.ts            ← user lookup / create helpers
    chatFolders.ts      ← folder find / create / update
    tokenUsage.ts       ← log usage per user per month
  
  providers/
    imessage.ts         ← spectrum-ts iMessage config (cloud mode)
    terminal.ts         ← terminal provider for local dev
```

---

## Web App File Structure

```
apps/web/
  app/
    page.tsx            ← landing page: hero, features, CTA
    onboard/
      page.tsx          ← form: name, gender, phone number
      success/
        page.tsx        ← "Tap below to start chatting with KUPI" + deep link
  components/
    OnboardForm.tsx     ← calls Convex onboardUser mutation
  lib/
    convex.ts           ← Convex browser client
```

---

## Data Model (Convex)

### `users`
| Field | Type | Notes |
|---|---|---|
| `_id` | ConvexId | |
| `name` | string | from onboarding form |
| `gender` | string | from onboarding form |
| `phone` | string | E.164 format |
| `spectrumId` | string | user's phone in E.164 (used as Spectrum identifier) |
| `plan` | `"trial" \| "basic" \| "pro"` | expandable |
| `trialEndsAt` | timestamp | set at onboarding |
| `createdAt` | timestamp | |

### `chatFolders`
One folder per person the user is chatting with. Created/matched on screenshot upload.

| Field | Type | Notes |
|---|---|---|
| `_id` | ConvexId | |
| `userId` | ConvexId | owner |
| `personName` | string | extracted from screenshot |
| `platform` | string | `"tinder" \| "instagram" \| "whatsapp" \| "other"` |
| `messageCount` | number | total messages seen across screenshots |
| `interestLevel` | number | 0–100, updated each analysis |
| `compatibilityScore` | number | 0–100 |
| `redFlagsCount` | number | cumulative |
| `greenFlagsCount` | number | cumulative |
| `lastUpdated` | timestamp | |

### `analyses`
Every AI result stored for context and history.

| Field | Type | Notes |
|---|---|---|
| `_id` | ConvexId | |
| `chatFolderId` | ConvexId | |
| `userId` | ConvexId | |
| `type` | string | `"reply" \| "wrap" \| "red_flags" \| "interest" \| "bio"` |
| `result` | any | JSON blob, schema varies by type |
| `tokensUsed` | number | |
| `createdAt` | timestamp | |

### `tokenUsage`
For cost visibility — no hard blocking in beta.

| Field | Type | Notes |
|---|---|---|
| `_id` | ConvexId | |
| `userId` | ConvexId | |
| `month` | string | `"2026-05"` |
| `tokensUsed` | number | cumulative for the month |
| `limit` | number | default `2_000_000`, overridable per plan |

### `subscriptions`
Updated via Polar.sh webhook → Convex HTTP action.

| Field | Type | Notes |
|---|---|---|
| `_id` | ConvexId | |
| `userId` | ConvexId | |
| `polarCustomerId` | string | |
| `polarSubscriptionId` | string | |
| `plan` | string | plan name from Polar |
| `status` | string | `"active" \| "cancelled" \| "past_due"` |
| `currentPeriodEnd` | timestamp | |

---

## KUPI Commands (in iMessage)

Users interact via natural language or short commands:

| User sends | KUPI does |
|---|---|
| Screenshot | Vision OCR → match/create chat folder → suggest replies |
| `wrap` | Chat wrap for current folder (summary, stats, interest level) |
| `red flags` | List red flags detected across all screenshots for that person |
| `analysis` | Full breakdown: interest, compatibility, flags |
| `help` | Lists available commands |
| Bio screenshot | Analyse dating profile bio → suggest openers |

Commands are registered in `handlers/commands.ts` — adding a new command is one file.

---

## Billing Flow Detail

1. **Trial:** 7 days from onboarding. Full access.
2. **Trial ending (2 days before):** KUPI sends a heads-up in iMessage.
3. **Trial expired:** Every message from user triggers a billing nudge with Polar.sh checkout link (rich link preview). No other response until subscribed.
4. **Payment:** Polar.sh webhook hits `convex/http.ts` → updates `subscriptions` + `users.plan`.
5. **Confirmation:** KUPI sends confirmation message in iMessage.
6. **Future tiers:** Pluggable — `users.plan` is a string, new tiers just need a Polar product + a plan check in `handlers/billing.ts`.

---

## AI — OpenAI GPT-4o mini

All AI calls go through `ai/client.ts`. Swapping provider = edit that file only.

- **Vision:** Screenshot → extract person's name, platform, recent messages
- **Reply generation:** Context-aware suggestions (not generic lines)
- **Analysis:** Interest level scoring, red/green flag detection, compatibility
- **Wrap:** Conversation summary with stats pulled from Convex

Token usage is logged to `tokenUsage` after every call. No hard gate in beta — used for cost monitoring and future plan enforcement.

---

## External Services

| Service | Purpose | Notes |
|---|---|---|
| Spectrum / Photon | iMessage delivery | One shared number, cloud mode |
| OpenAI | Vision + chat AI | GPT-4o mini for both |
| Polar.sh | Billing + webhooks | Primary, pluggable for others |
| Convex | Database + backend | Real-time, serverless |
| Vercel | Web hosting | Next.js app |
| Railway | Bot hosting | Long-running Node process |

---

## Contributing

### Getting started

```bash
git clone <repo>
cd razzy
npm install        # installs all workspaces
```

### Running locally

```bash
# Terminal 1 — Convex dev server
npx convex dev

# Terminal 2 — Web app
cd apps/web && npm run dev

# Terminal 3 — Bot (uses terminal provider locally)
cd apps/bot && npm run dev
```

### Adding a new command

1. Add handler function in `apps/bot/handlers/commands.ts`
2. Register the trigger phrase in `onMessage.ts`
3. Add any new AI logic in `apps/bot/ai/`
4. Add any new Convex queries/mutations in `convex/`

### Changing the wingman name

Edit `apps/bot/config.ts` → `wingmanName`.

### Adding a new payment provider

Add alongside Polar in `handlers/billing.ts`. The `subscriptions` table is provider-agnostic.

### Environment variables

```
# apps/bot/.env
CONVEX_URL=
OPENAI_API_KEY=
SPECTRUM_PROJECT_ID=
SPECTRUM_PROJECT_SECRET=

# apps/web/.env
NEXT_PUBLIC_CONVEX_URL=
POLAR_WEBHOOK_SECRET=
```
