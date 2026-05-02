# KUPI iMessage AI Wingman — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build KUPI — an iMessage AI wingman that remembers each "chat folder" per person, generates reply suggestions, and provides interest/flag/compatibility analysis, with billing managed entirely in iMessage via Polar.sh.

**Architecture:** Monorepo (npm workspaces) with a Next.js web app for onboarding, a long-running Node.js bot process using spectrum-ts for iMessage, and Convex as the shared backend. All post-signup interaction happens in iMessage — no web dashboard.

**Tech Stack:** Next.js 15 (App Router), Convex, spectrum-ts, OpenAI GPT-4o mini (vision + chat), Polar.sh webhooks, Vitest, TypeScript 5, Railway (bot), Vercel (web)

---

## File Map

```
razzy/
  package.json                          ← npm workspaces root
  tsconfig.base.json                    ← shared TS config
  .env.example                          ← env var reference
  convex/
    schema.ts                           ← all table definitions
    users.ts                            ← user mutations/queries
    chatFolders.ts                      ← folder mutations/queries
    analyses.ts                         ← analysis mutations/queries
    tokenUsage.ts                       ← token logging mutations/queries
    subscriptions.ts                    ← subscription mutations/queries
    http.ts                             ← HTTP router (Polar webhook)
  apps/
    bot/
      package.json
      tsconfig.json
      vitest.config.ts
      index.ts                          ← entry point, message loop
      config.ts                         ← wingmanName, AI model, trial settings
      providers/
        imessage.ts                     ← spectrum-ts iMessage config
        terminal.ts                     ← terminal provider for local dev
      convex/
        client.ts                       ← ConvexHttpClient singleton
        users.ts                        ← user lookup helpers
        chatFolders.ts                  ← folder find/create/update helpers
        tokenUsage.ts                   ← log usage helpers
        subscriptions.ts                ← subscription check helpers
      ai/
        client.ts                       ← OpenAI client singleton
        vision.ts                       ← screenshot OCR + extraction
        reply.ts                        ← reply suggestion generation
        analysis.ts                     ← interest/flags/compatibility
        wrap.ts                         ← conversation wrap summary
      handlers/
        onMessage.ts                    ← message router
        screenshot.ts                   ← screenshot flow
        commands.ts                     ← text command handlers
        billing.ts                      ← trial/subscription gate
      __tests__/
        vision.test.ts
        reply.test.ts
        analysis.test.ts
        wrap.test.ts
        billing.test.ts
        screenshot.test.ts
        commands.test.ts
    web/
      package.json
      tsconfig.json
      next.config.ts
      app/
        page.tsx                        ← landing page
        onboard/
          page.tsx                      ← onboarding form page
          success/
            page.tsx                    ← deep link + instructions
      components/
        OnboardForm.tsx                 ← form with Convex mutation
      lib/
        convex.ts                       ← ConvexProvider + client
```

---

## Phase 1: Foundation

### Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Create: `apps/bot/package.json`
- Create: `apps/bot/tsconfig.json`
- Create: `apps/bot/vitest.config.ts`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "razzy",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev:web": "npm run dev --workspace=apps/web",
    "dev:bot": "npm run dev --workspace=apps/bot",
    "dev:convex": "npx convex dev"
  }
}
```

- [ ] **Step 2: Create shared tsconfig base**

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 3: Create .env.example**

```bash
# .env.example
# Bot (apps/bot/.env)
CONVEX_URL=https://your-deployment.convex.cloud
OPENAI_API_KEY=sk-...
SPECTRUM_PROJECT_ID=
SPECTRUM_PROJECT_SECRET=

# Web (apps/web/.env.local)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_KUPI_PHONE=+1XXXXXXXXXX
POLAR_WEBHOOK_SECRET=
```

- [ ] **Step 4: Create apps/bot/package.json**

```json
{
  "name": "@razzy/bot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch --experimental-vm-modules dist/index.js",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "spectrum-ts": "latest",
    "openai": "^4.0.0",
    "convex": "^1.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 5: Create apps/bot/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": ".",
    "paths": {
      "convex/_generated/*": ["../../convex/_generated/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 6: Create apps/bot/vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
});
```

- [ ] **Step 7: Create apps/web/package.json**

```json
{
  "name": "@razzy/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "convex": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

- [ ] **Step 8: Create apps/web/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "convex/_generated/*": ["../../convex/_generated/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 9: Install all dependencies**

```bash
npm install
```

- [ ] **Step 10: Init Convex**

```bash
npx convex dev --once
```

Expected: creates `convex/` directory with `_generated/` folder.

- [ ] **Step 11: Commit**

```bash
git add package.json tsconfig.base.json .env.example apps/
git commit -m "feat: monorepo scaffold with bot + web packages"
```

---

### Task 2: Convex Schema

**Files:**
- Create: `convex/schema.ts`

- [ ] **Step 1: Write the schema**

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    gender: v.string(),
    phone: v.string(),          // E.164 format, used as Spectrum identifier
    plan: v.union(
      v.literal("trial"),
      v.literal("basic"),
      v.literal("pro")
    ),
    trialEndsAt: v.number(),    // Unix ms
    createdAt: v.number(),
  }).index("by_phone", ["phone"]),

  chatFolders: defineTable({
    userId: v.id("users"),
    personName: v.string(),
    platform: v.string(),       // "tinder" | "instagram" | "whatsapp" | "other"
    messageCount: v.number(),
    interestLevel: v.number(),  // 0-100
    compatibilityScore: v.number(),
    redFlagsCount: v.number(),
    greenFlagsCount: v.number(),
    lastUpdated: v.number(),
  }).index("by_userId", ["userId"]),

  analyses: defineTable({
    chatFolderId: v.id("chatFolders"),
    userId: v.id("users"),
    type: v.string(),           // "reply" | "wrap" | "red_flags" | "interest" | "bio"
    result: v.any(),
    tokensUsed: v.number(),
    createdAt: v.number(),
  }).index("by_chatFolder", ["chatFolderId"]),

  tokenUsage: defineTable({
    userId: v.id("users"),
    month: v.string(),          // "2026-05"
    tokensUsed: v.number(),
    limit: v.number(),          // default 2_000_000
  }).index("by_user_month", ["userId", "month"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    plan: v.string(),
    status: v.string(),         // "active" | "cancelled" | "past_due"
    currentPeriodEnd: v.number(),
  }).index("by_userId", ["userId"]),
});
```

- [ ] **Step 2: Push schema to Convex**

```bash
npx convex dev --once
```

Expected: No errors. `convex/_generated/` updated with new types.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts convex/_generated/
git commit -m "feat: add Convex schema (users, chatFolders, analyses, tokenUsage, subscriptions)"
```

---

## Phase 2: Convex Backend

### Task 3: Convex — Users

**Files:**
- Create: `convex/users.ts`

- [ ] **Step 1: Write users mutations and queries**

```ts
// convex/users.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_phone", q => q.eq("phone", phone))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    gender: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { name, gender, phone }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", q => q.eq("phone", phone))
      .first();
    if (existing) return existing._id;

    const trialEndsAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    return await ctx.db.insert("users", {
      name,
      gender,
      phone,
      plan: "trial",
      trialEndsAt,
      createdAt: Date.now(),
    });
  },
});

export const updatePlan = mutation({
  args: {
    userId: v.id("users"),
    plan: v.union(v.literal("trial"), v.literal("basic"), v.literal("pro")),
  },
  handler: async (ctx, { userId, plan }) => {
    await ctx.db.patch(userId, { plan });
  },
});
```

- [ ] **Step 2: Push to Convex**

```bash
npx convex dev --once
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add convex/users.ts
git commit -m "feat: Convex users queries and mutations"
```

---

### Task 4: Convex — Chat Folders

**Files:**
- Create: `convex/chatFolders.ts`

- [ ] **Step 1: Write chatFolders mutations and queries**

```ts
// convex/chatFolders.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const findByUserAndName = query({
  args: { userId: v.id("users"), personName: v.string() },
  handler: async (ctx, { userId, personName }) => {
    const folders = await ctx.db
      .query("chatFolders")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
    return folders.find(
      f => f.personName.toLowerCase() === personName.toLowerCase()
    ) ?? null;
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("chatFolders")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    personName: v.string(),
    platform: v.string(),
  },
  handler: async (ctx, { userId, personName, platform }) => {
    return await ctx.db.insert("chatFolders", {
      userId,
      personName,
      platform,
      messageCount: 0,
      interestLevel: 50,
      compatibilityScore: 50,
      redFlagsCount: 0,
      greenFlagsCount: 0,
      lastUpdated: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    folderId: v.id("chatFolders"),
    messageCount: v.optional(v.number()),
    interestLevel: v.optional(v.number()),
    compatibilityScore: v.optional(v.number()),
    redFlagsCount: v.optional(v.number()),
    greenFlagsCount: v.optional(v.number()),
  },
  handler: async (ctx, { folderId, ...fields }) => {
    const patch: Record<string, unknown> = { lastUpdated: Date.now() };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(folderId, patch);
  },
});
```

- [ ] **Step 2: Push to Convex**

```bash
npx convex dev --once
```

- [ ] **Step 3: Commit**

```bash
git add convex/chatFolders.ts
git commit -m "feat: Convex chatFolders queries and mutations"
```

---

### Task 5: Convex — Analyses & Token Usage

**Files:**
- Create: `convex/analyses.ts`
- Create: `convex/tokenUsage.ts`

- [ ] **Step 1: Write analyses mutations/queries**

```ts
// convex/analyses.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    chatFolderId: v.id("chatFolders"),
    userId: v.id("users"),
    type: v.string(),
    result: v.any(),
    tokensUsed: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyses", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listByFolder = query({
  args: { chatFolderId: v.id("chatFolders") },
  handler: async (ctx, { chatFolderId }) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_chatFolder", q => q.eq("chatFolderId", chatFolderId))
      .order("desc")
      .take(20);
  },
});
```

- [ ] **Step 2: Write tokenUsage mutations/queries**

```ts
// convex/tokenUsage.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const log = mutation({
  args: { userId: v.id("users"), tokensUsed: v.number() },
  handler: async (ctx, { userId, tokensUsed }) => {
    const month = currentMonth();
    const existing = await ctx.db
      .query("tokenUsage")
      .withIndex("by_user_month", q => q.eq("userId", userId).eq("month", month))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tokensUsed: existing.tokensUsed + tokensUsed,
      });
    } else {
      await ctx.db.insert("tokenUsage", {
        userId,
        month,
        tokensUsed,
        limit: 2_000_000,
      });
    }
  },
});

export const getForMonth = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const month = currentMonth();
    return await ctx.db
      .query("tokenUsage")
      .withIndex("by_user_month", q => q.eq("userId", userId).eq("month", month))
      .first();
  },
});
```

- [ ] **Step 3: Push to Convex**

```bash
npx convex dev --once
```

- [ ] **Step 4: Commit**

```bash
git add convex/analyses.ts convex/tokenUsage.ts
git commit -m "feat: Convex analyses and tokenUsage mutations"
```

---

### Task 6: Convex — Subscriptions + Polar Webhook

**Files:**
- Create: `convex/subscriptions.ts`
- Create: `convex/http.ts`

- [ ] **Step 1: Write subscriptions mutations/queries**

```ts
// convex/subscriptions.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    plan: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        polarSubscriptionId: args.polarSubscriptionId,
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
      });
    } else {
      await ctx.db.insert("subscriptions", args);
    }

    // sync plan on user record
    if (args.status === "active") {
      await ctx.db.patch(args.userId, {
        plan: args.plan as "basic" | "pro",
      });
    }
  },
});
```

- [ ] **Step 2: Write Polar webhook HTTP action**

```ts
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { createHmac } from "crypto";

const http = httpRouter();

http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (!secret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get("webhook-signature") ?? "";
    const expected = createHmac("sha256", secret).update(body).digest("hex");

    if (signature !== `sha256=${expected}`) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    if (
      event.type === "subscription.created" ||
      event.type === "subscription.updated"
    ) {
      const { customer, subscription } = event.data;
      // phone stored as customer metadata during Polar checkout
      const phone = customer.metadata?.phone as string | undefined;
      if (!phone) return new Response("No phone in metadata", { status: 400 });

      const user = await ctx.runQuery(api.users.getByPhone, { phone });
      if (!user) return new Response("User not found", { status: 404 });

      await ctx.runMutation(api.subscriptions.upsert, {
        userId: user._id,
        polarCustomerId: customer.id,
        polarSubscriptionId: subscription.id,
        plan: subscription.product.name.toLowerCase(),
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end).getTime(),
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

- [ ] **Step 3: Push to Convex**

```bash
npx convex dev --once
```

- [ ] **Step 4: Commit**

```bash
git add convex/subscriptions.ts convex/http.ts
git commit -m "feat: Convex subscriptions + Polar webhook HTTP action"
```

---

## Phase 3: Bot

### Task 7: Bot Config + Providers

**Files:**
- Create: `apps/bot/config.ts`
- Create: `apps/bot/providers/imessage.ts`
- Create: `apps/bot/providers/terminal.ts`
- Create: `apps/bot/convex/client.ts`

- [ ] **Step 1: Create config.ts**

```ts
// apps/bot/config.ts
export const config = {
  wingmanName: "KUPI",           // change name here only
  ai: {
    model: "gpt-4o-mini" as const,
    visionModel: "gpt-4o-mini" as const,
    maxTokens: 1000,
  },
  trial: {
    daysAllowed: 7,
    warningDaysBeforeEnd: 2,
  },
  tokenLimitDefault: 2_000_000,
} as const;
```

- [ ] **Step 2: Create providers/imessage.ts**

```ts
// apps/bot/providers/imessage.ts
import { imessage } from "spectrum-ts/providers/imessage";

export function getIMessageProvider() {
  return imessage.config();
}

export { imessage };
```

- [ ] **Step 3: Create providers/terminal.ts**

```ts
// apps/bot/providers/terminal.ts
import { terminal } from "spectrum-ts/providers/terminal";

export function getTerminalProvider() {
  return terminal.config();
}
```

- [ ] **Step 4: Create convex/client.ts**

```ts
// apps/bot/convex/client.ts
import { ConvexHttpClient } from "convex/http";

if (!process.env.CONVEX_URL) {
  throw new Error("CONVEX_URL is not set");
}

export const convex = new ConvexHttpClient(process.env.CONVEX_URL);
```

- [ ] **Step 5: Commit**

```bash
git add apps/bot/config.ts apps/bot/providers/ apps/bot/convex/client.ts
git commit -m "feat: bot config, providers, and Convex client"
```

---

### Task 8: Bot Convex Helpers

**Files:**
- Create: `apps/bot/convex/users.ts`
- Create: `apps/bot/convex/chatFolders.ts`
- Create: `apps/bot/convex/tokenUsage.ts`
- Create: `apps/bot/convex/subscriptions.ts`

- [ ] **Step 1: Create convex/users.ts**

```ts
// apps/bot/convex/users.ts
import { convex } from "./client.js";
import { api } from "../../../convex/_generated/api.js";
import type { Doc } from "../../../convex/_generated/dataModel.js";

export type User = Doc<"users">;

export async function getUserByPhone(phone: string): Promise<User | null> {
  return await convex.query(api.users.getByPhone, { phone });
}
```

- [ ] **Step 2: Create convex/chatFolders.ts**

```ts
// apps/bot/convex/chatFolders.ts
import { convex } from "./client.js";
import { api } from "../../../convex/_generated/api.js";
import type { Doc, Id } from "../../../convex/_generated/dataModel.js";

export type ChatFolder = Doc<"chatFolders">;

export async function findOrCreateFolder(
  userId: Id<"users">,
  personName: string,
  platform: string
): Promise<ChatFolder> {
  const existing = await convex.query(api.chatFolders.findByUserAndName, {
    userId,
    personName,
  });
  if (existing) return existing;

  const id = await convex.mutation(api.chatFolders.create, {
    userId,
    personName,
    platform,
  });

  return (await convex.query(api.chatFolders.findByUserAndName, {
    userId,
    personName,
  }))!;
}

export async function updateFolder(
  folderId: Id<"chatFolders">,
  fields: {
    messageCount?: number;
    interestLevel?: number;
    compatibilityScore?: number;
    redFlagsCount?: number;
    greenFlagsCount?: number;
  }
) {
  await convex.mutation(api.chatFolders.update, { folderId, ...fields });
}

export async function listFolders(userId: Id<"users">): Promise<ChatFolder[]> {
  return await convex.query(api.chatFolders.listByUser, { userId });
}
```

- [ ] **Step 3: Create convex/tokenUsage.ts**

```ts
// apps/bot/convex/tokenUsage.ts
import { convex } from "./client.js";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";

export async function logTokens(
  userId: Id<"users">,
  tokensUsed: number
): Promise<void> {
  await convex.mutation(api.tokenUsage.log, { userId, tokensUsed });
}
```

- [ ] **Step 4: Create convex/subscriptions.ts**

```ts
// apps/bot/convex/subscriptions.ts
import { convex } from "./client.js";
import { api } from "../../../convex/_generated/api.js";
import type { Doc, Id } from "../../../convex/_generated/dataModel.js";

export type Subscription = Doc<"subscriptions">;

export async function getSubscription(
  userId: Id<"users">
): Promise<Subscription | null> {
  return await convex.query(api.subscriptions.getByUser, { userId });
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/bot/convex/
git commit -m "feat: bot Convex helper modules"
```

---

### Task 9: AI Client + Vision

**Files:**
- Create: `apps/bot/ai/client.ts`
- Create: `apps/bot/ai/vision.ts`
- Create: `apps/bot/__tests__/vision.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/bot/__tests__/vision.test.ts
import { describe, it, expect, vi } from "vitest";
import { extractScreenshot } from "../ai/vision.js";

const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
};

vi.mock("../ai/client.js", () => ({ openai: mockOpenAI }));

describe("extractScreenshot", () => {
  it("returns extracted person name, platform, and messages", async () => {
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              personName: "Lisa",
              platform: "tinder",
              messages: [
                { sender: "them", text: "hey" },
                { sender: "me", text: "hey" },
              ],
            }),
          },
        },
      ],
      usage: { total_tokens: 200 },
    });

    const result = await extractScreenshot(Buffer.from("fake-image"));
    expect(result.personName).toBe("Lisa");
    expect(result.platform).toBe("tinder");
    expect(result.messages).toHaveLength(2);
    expect(result.tokensUsed).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/bot && npm test -- vision.test.ts
```

Expected: FAIL — `extractScreenshot` not defined.

- [ ] **Step 3: Create ai/client.ts**

```ts
// apps/bot/ai/client.ts
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

- [ ] **Step 4: Create ai/vision.ts**

```ts
// apps/bot/ai/vision.ts
import { openai } from "./client.js";
import { config } from "../config.js";

export interface ExtractedScreenshot {
  personName: string;
  platform: string;
  messages: Array<{ sender: "me" | "them"; text: string }>;
  tokensUsed: number;
}

export async function extractScreenshot(
  imageBuffer: Buffer
): Promise<ExtractedScreenshot> {
  const base64 = imageBuffer.toString("base64");

  const response = await openai.chat.completions.create({
    model: config.ai.visionModel,
    max_tokens: config.ai.maxTokens,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this chat screenshot and return a JSON object with:
- personName: the name of the person being chatted with (string)
- platform: one of "tinder", "instagram", "whatsapp", "other"
- messages: array of { sender: "me" | "them", text: string } in order

Return ONLY valid JSON, no markdown.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64}` },
          },
        ],
      },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);

  return {
    personName: parsed.personName ?? "Unknown",
    platform: parsed.platform ?? "other",
    messages: parsed.messages ?? [],
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd apps/bot && npm test -- vision.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/bot/ai/client.ts apps/bot/ai/vision.ts apps/bot/__tests__/vision.test.ts
git commit -m "feat: AI client + vision screenshot extraction"
```

---

### Task 10: AI Reply Generation

**Files:**
- Create: `apps/bot/ai/reply.ts`
- Create: `apps/bot/__tests__/reply.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/bot/__tests__/reply.test.ts
import { describe, it, expect, vi } from "vitest";
import { generateReplies } from "../ai/reply.js";

const mockOpenAI = {
  chat: { completions: { create: vi.fn() } },
};
vi.mock("../ai/client.js", () => ({ openai: mockOpenAI }));

describe("generateReplies", () => {
  it("returns 3 reply suggestions and tokensUsed", async () => {
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              replies: [
                "Long walks on the beach? Hope you can keep up!",
                "I enjoy the occasional argument too — we'd get along.",
                "Sense of humor? That's already checked. When are we meeting?",
              ],
            }),
          },
        },
      ],
      usage: { total_tokens: 350 },
    });

    const result = await generateReplies({
      userName: "Jake",
      userGender: "male",
      personName: "Lisa",
      recentMessages: [
        { sender: "them", text: "I enjoy long walks on the beach" },
      ],
      previousContext: null,
    });

    expect(result.replies).toHaveLength(3);
    expect(result.tokensUsed).toBe(350);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/bot && npm test -- reply.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create ai/reply.ts**

```ts
// apps/bot/ai/reply.ts
import { openai } from "./client.js";
import { config } from "../config.js";

interface ReplyInput {
  userName: string;
  userGender: string;
  personName: string;
  recentMessages: Array<{ sender: "me" | "them"; text: string }>;
  previousContext: string | null;  // summary from prior analyses
}

export interface ReplyResult {
  replies: string[];
  tokensUsed: number;
}

export async function generateReplies(input: ReplyInput): Promise<ReplyResult> {
  const convo = input.recentMessages
    .map(m => `${m.sender === "me" ? input.userName : input.personName}: ${m.text}`)
    .join("\n");

  const systemPrompt = `You are ${config.wingmanName}, a sharp and authentic dating wingman for ${input.userName} (${input.userGender}).
Your job is to suggest real, natural replies — not generic pickup lines.
Match the tone of the conversation. Be confident, playful, and human.
${input.previousContext ? `Context about ${input.personName}: ${input.previousContext}` : ""}`;

  const response = await openai.chat.completions.create({
    model: config.ai.model,
    max_tokens: config.ai.maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here's the conversation:\n${convo}\n\nGive me 3 reply options as JSON: { "replies": ["...", "...", "..."] }. Return ONLY valid JSON.`,
      },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);

  return {
    replies: parsed.replies ?? [],
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/bot && npm test -- reply.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bot/ai/reply.ts apps/bot/__tests__/reply.test.ts
git commit -m "feat: AI reply generation"
```

---

### Task 11: AI Analysis

**Files:**
- Create: `apps/bot/ai/analysis.ts`
- Create: `apps/bot/__tests__/analysis.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/bot/__tests__/analysis.test.ts
import { describe, it, expect, vi } from "vitest";
import { analyzeConversation } from "../ai/analysis.js";

const mockOpenAI = { chat: { completions: { create: vi.fn() } } };
vi.mock("../ai/client.js", () => ({ openai: mockOpenAI }));

describe("analyzeConversation", () => {
  it("returns interest, compatibility, red and green flags", async () => {
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              interestLevel: 75,
              compatibilityScore: 68,
              redFlags: ["Limited emotional depth in some interactions"],
              greenFlags: ["Openness about personal matters"],
            }),
          },
        },
      ],
      usage: { total_tokens: 400 },
    });

    const result = await analyzeConversation({
      personName: "Lisa",
      messages: [
        { sender: "them", text: "I enjoy long walks on the beach" },
        { sender: "me", text: "Hope you can keep up!" },
        { sender: "them", text: "haha I love that energy" },
      ],
    });

    expect(result.interestLevel).toBe(75);
    expect(result.compatibilityScore).toBe(68);
    expect(result.redFlags).toHaveLength(1);
    expect(result.greenFlags).toHaveLength(1);
    expect(result.tokensUsed).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/bot && npm test -- analysis.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create ai/analysis.ts**

```ts
// apps/bot/ai/analysis.ts
import { openai } from "./client.js";
import { config } from "../config.js";

interface AnalysisInput {
  personName: string;
  messages: Array<{ sender: "me" | "them"; text: string }>;
}

export interface AnalysisResult {
  interestLevel: number;       // 0-100
  compatibilityScore: number;  // 0-100
  redFlags: string[];
  greenFlags: string[];
  tokensUsed: number;
}

export async function analyzeConversation(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const convo = input.messages
    .map(m => `${m.sender === "me" ? "User" : input.personName}: ${m.text}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: config.ai.model,
    max_tokens: config.ai.maxTokens,
    messages: [
      {
        role: "system",
        content: `You are ${config.wingmanName}, an expert at reading romantic conversations.
Analyze the conversation and return a JSON object with:
- interestLevel: 0-100 (how interested the other person is)
- compatibilityScore: 0-100
- redFlags: string[] (concerning patterns, max 5)
- greenFlags: string[] (positive signals, max 5)
Return ONLY valid JSON.`,
      },
      { role: "user", content: convo },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);

  return {
    interestLevel: parsed.interestLevel ?? 50,
    compatibilityScore: parsed.compatibilityScore ?? 50,
    redFlags: parsed.redFlags ?? [],
    greenFlags: parsed.greenFlags ?? [],
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/bot && npm test -- analysis.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bot/ai/analysis.ts apps/bot/__tests__/analysis.test.ts
git commit -m "feat: AI conversation analysis (interest, flags, compatibility)"
```

---

### Task 12: AI Chat Wrap

**Files:**
- Create: `apps/bot/ai/wrap.ts`
- Create: `apps/bot/__tests__/wrap.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/bot/__tests__/wrap.test.ts
import { describe, it, expect, vi } from "vitest";
import { generateWrap } from "../ai/wrap.js";

const mockOpenAI = { chat: { completions: { create: vi.fn() } } };
vi.mock("../ai/client.js", () => ({ openai: mockOpenAI }));

describe("generateWrap", () => {
  it("returns a wrap summary with stats", async () => {
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Lisa is vibing with you. She's been responsive and playful.",
              verdict: "She's interested. Don't overthink it — ask her out.",
            }),
          },
        },
      ],
      usage: { total_tokens: 300 },
    });

    const result = await generateWrap({
      personName: "Lisa",
      interestLevel: 75,
      compatibilityScore: 68,
      redFlagsCount: 1,
      greenFlagsCount: 3,
      messageCount: 24,
    });

    expect(result.summary).toContain("Lisa");
    expect(result.verdict).toBeTruthy();
    expect(result.tokensUsed).toBe(300);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/bot && npm test -- wrap.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create ai/wrap.ts**

```ts
// apps/bot/ai/wrap.ts
import { openai } from "./client.js";
import { config } from "../config.js";

interface WrapInput {
  personName: string;
  interestLevel: number;
  compatibilityScore: number;
  redFlagsCount: number;
  greenFlagsCount: number;
  messageCount: number;
}

export interface WrapResult {
  summary: string;
  verdict: string;
  tokensUsed: number;
}

export async function generateWrap(input: WrapInput): Promise<WrapResult> {
  const response = await openai.chat.completions.create({
    model: config.ai.model,
    max_tokens: config.ai.maxTokens,
    messages: [
      {
        role: "system",
        content: `You are ${config.wingmanName}. Give an honest, direct wrap-up of a conversation.`,
      },
      {
        role: "user",
        content: `Give me a wrap on my conversation with ${input.personName}.
Stats:
- Messages exchanged: ${input.messageCount}
- Their interest level: ${input.interestLevel}/100
- Compatibility: ${input.compatibilityScore}/100
- Red flags: ${input.redFlagsCount}
- Green flags: ${input.greenFlagsCount}

Return JSON: { "summary": "...", "verdict": "..." }. Return ONLY valid JSON.`,
      },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);

  return {
    summary: parsed.summary ?? "",
    verdict: parsed.verdict ?? "",
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/bot && npm test -- wrap.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bot/ai/wrap.ts apps/bot/__tests__/wrap.test.ts
git commit -m "feat: AI chat wrap generation"
```

---

## Phase 4: Bot Handlers

### Task 13: Billing Handler

**Files:**
- Create: `apps/bot/handlers/billing.ts`
- Create: `apps/bot/__tests__/billing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/bot/__tests__/billing.test.ts
import { describe, it, expect, vi } from "vitest";
import { checkBilling } from "../handlers/billing.js";
import type { Space } from "spectrum-ts";

const mockSpace = { send: vi.fn() } as unknown as Space;

describe("checkBilling", () => {
  it("returns true for users on active trial", async () => {
    const user = {
      _id: "user1" as any,
      plan: "trial" as const,
      trialEndsAt: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days from now
      name: "Jake",
    } as any;

    const result = await checkBilling(mockSpace, user);
    expect(result).toBe(true);
    expect(mockSpace.send).not.toHaveBeenCalled();
  });

  it("returns false and sends nudge when trial expired", async () => {
    const user = {
      _id: "user1" as any,
      plan: "trial" as const,
      trialEndsAt: Date.now() - 1000, // expired
      name: "Jake",
    } as any;

    vi.mock("../convex/subscriptions.js", () => ({
      getSubscription: vi.fn().mockResolvedValue(null),
    }));

    const result = await checkBilling(mockSpace, user);
    expect(result).toBe(false);
    expect(mockSpace.send).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/bot && npm test -- billing.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create handlers/billing.ts**

```ts
// apps/bot/handlers/billing.ts
import type { Space } from "spectrum-ts";
import type { User } from "../convex/users.js";
import { getSubscription } from "../convex/subscriptions.js";
import { config } from "../config.js";

const POLAR_CHECKOUT_URL = process.env.POLAR_CHECKOUT_URL ?? "https://polar.sh/kupi/plans";

export async function checkBilling(space: Space, user: User): Promise<boolean> {
  // Active paid subscription — always pass
  if (user.plan !== "trial") {
    const sub = await getSubscription(user._id);
    if (sub && sub.status === "active") return true;
  }

  // Trial still active
  if (user.plan === "trial" && Date.now() < user.trialEndsAt) {
    // Warn 2 days before trial ends
    const daysLeft = Math.ceil((user.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= config.trial.warningDaysBeforeEnd) {
      await space.send(
        `⏳ Heads up ${user.name} — your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Pick a plan to keep the momentum: ${POLAR_CHECKOUT_URL}`
      );
    }
    return true;
  }

  // Trial expired, no active subscription
  await space.send(
    `Hey ${user.name}, your free trial ended 🔒\n\nPick a plan and let's get back to it:\n${POLAR_CHECKOUT_URL}`
  );
  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/bot && npm test -- billing.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bot/handlers/billing.ts apps/bot/__tests__/billing.test.ts
git commit -m "feat: billing handler (trial check + Polar nudge)"
```

---

### Task 14: Screenshot Handler

**Files:**
- Create: `apps/bot/handlers/screenshot.ts`
- Create: `apps/bot/__tests__/screenshot.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/bot/__tests__/screenshot.test.ts
import { describe, it, expect, vi } from "vitest";
import { handleScreenshot } from "../handlers/screenshot.js";

vi.mock("../ai/vision.js", () => ({
  extractScreenshot: vi.fn().mockResolvedValue({
    personName: "Lisa",
    platform: "tinder",
    messages: [
      { sender: "them", text: "hey" },
      { sender: "me", text: "hey" },
    ],
    tokensUsed: 200,
  }),
}));

vi.mock("../ai/reply.js", () => ({
  generateReplies: vi.fn().mockResolvedValue({
    replies: ["Reply 1", "Reply 2", "Reply 3"],
    tokensUsed: 300,
  }),
}));

vi.mock("../ai/analysis.js", () => ({
  analyzeConversation: vi.fn().mockResolvedValue({
    interestLevel: 70,
    compatibilityScore: 65,
    redFlags: [],
    greenFlags: ["Responsive"],
    tokensUsed: 250,
  }),
}));

vi.mock("../convex/chatFolders.js", () => ({
  findOrCreateFolder: vi.fn().mockResolvedValue({
    _id: "folder1",
    personName: "Lisa",
    platform: "tinder",
    messageCount: 0,
    interestLevel: 50,
    compatibilityScore: 50,
    redFlagsCount: 0,
    greenFlagsCount: 0,
  }),
  updateFolder: vi.fn(),
}));

vi.mock("../convex/tokenUsage.js", () => ({ logTokens: vi.fn() }));
vi.mock("../convex/analyses.js", () => ({ saveAnalysis: vi.fn() }));

const mockSpace = { send: vi.fn(), responding: vi.fn(fn => fn()) } as any;
const mockMessage = {
  content: { type: "attachment", data: Buffer.from("img"), mimeType: "image/jpeg", name: "ss.jpg" },
} as any;
const mockUser = { _id: "user1", name: "Jake", gender: "male" } as any;

describe("handleScreenshot", () => {
  it("extracts screenshot, generates replies, and sends them", async () => {
    await handleScreenshot(mockSpace, mockMessage, mockUser);
    expect(mockSpace.send).toHaveBeenCalledWith(
      expect.stringContaining("Lisa")
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/bot && npm test -- screenshot.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create handlers/screenshot.ts**

```ts
// apps/bot/handlers/screenshot.ts
import type { Space, Message } from "spectrum-ts";
import type { User } from "../convex/users.js";
import { extractScreenshot } from "../ai/vision.js";
import { generateReplies } from "../ai/reply.js";
import { analyzeConversation } from "../ai/analysis.js";
import { findOrCreateFolder, updateFolder } from "../convex/chatFolders.js";
import { logTokens } from "../convex/tokenUsage.js";
import { convex } from "../convex/client.js";
import { api } from "../../../convex/_generated/api.js";
import { config } from "../config.js";

export async function handleScreenshot(
  space: Space,
  message: Message,
  user: User
): Promise<void> {
  if (message.content.type !== "attachment") return;

  await space.responding(async () => {
    const imageBuffer = message.content.data;

    // 1. Extract screenshot content
    const extracted = await extractScreenshot(imageBuffer);
    let totalTokens = extracted.tokensUsed;

    // 2. Find or create chat folder
    const folder = await findOrCreateFolder(
      user._id,
      extracted.personName,
      extracted.platform
    );

    // 3. Load previous analyses for context
    const previousAnalyses = await convex.query(api.analyses.listByFolder, {
      chatFolderId: folder._id,
    });
    const previousContext =
      previousAnalyses.length > 0
        ? `Interest: ${folder.interestLevel}/100, Compatibility: ${folder.compatibilityScore}/100`
        : null;

    // 4. Generate replies and analysis in parallel
    const [replyResult, analysisResult] = await Promise.all([
      generateReplies({
        userName: user.name,
        userGender: user.gender,
        personName: extracted.personName,
        recentMessages: extracted.messages,
        previousContext,
      }),
      analyzeConversation({
        personName: extracted.personName,
        messages: extracted.messages,
      }),
    ]);

    totalTokens += replyResult.tokensUsed + analysisResult.tokensUsed;

    // 5. Update folder stats
    await updateFolder(folder._id, {
      messageCount: folder.messageCount + extracted.messages.length,
      interestLevel: analysisResult.interestLevel,
      compatibilityScore: analysisResult.compatibilityScore,
      redFlagsCount: folder.redFlagsCount + analysisResult.redFlags.length,
      greenFlagsCount: folder.greenFlagsCount + analysisResult.greenFlags.length,
    });

    // 6. Save analysis
    await convex.mutation(api.analyses.create, {
      chatFolderId: folder._id,
      userId: user._id,
      type: "reply",
      result: { replies: replyResult.replies, analysis: analysisResult },
      tokensUsed: totalTokens,
    });

    // 7. Log tokens
    await logTokens(user._id, totalTokens);

    // 8. Send reply suggestions
    const repliesText = replyResult.replies
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n\n");

    await space.send(
      `📁 ${extracted.personName} (${extracted.platform})\n` +
      `💫 Interest: ${analysisResult.interestLevel}/100\n\n` +
      `Here are your moves:\n\n${repliesText}`
    );

    // 9. Send a flag if any red flags detected
    if (analysisResult.redFlags.length > 0) {
      await space.send(
        `🚩 Heads up — ${analysisResult.redFlags[0]}`
      );
    }
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/bot && npm test -- screenshot.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bot/handlers/screenshot.ts apps/bot/__tests__/screenshot.test.ts
git commit -m "feat: screenshot handler (vision + reply + analysis)"
```

---

### Task 15: Commands Handler

**Files:**
- Create: `apps/bot/handlers/commands.ts`
- Create: `apps/bot/__tests__/commands.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/bot/__tests__/commands.test.ts
import { describe, it, expect, vi } from "vitest";
import { handleCommand } from "../handlers/commands.js";
import { config } from "../config.js";

vi.mock("../convex/chatFolders.js", () => ({
  listFolders: vi.fn().mockResolvedValue([
    {
      _id: "folder1",
      personName: "Lisa",
      platform: "tinder",
      interestLevel: 75,
      compatibilityScore: 68,
      redFlagsCount: 1,
      greenFlagsCount: 3,
      messageCount: 24,
    },
  ]),
}));

vi.mock("../ai/wrap.js", () => ({
  generateWrap: vi.fn().mockResolvedValue({
    summary: "Lisa is vibing with you.",
    verdict: "Ask her out.",
    tokensUsed: 200,
  }),
}));

vi.mock("../convex/tokenUsage.js", () => ({ logTokens: vi.fn() }));
vi.mock("../convex/analyses.js", () => ({ saveAnalysis: vi.fn() }));

const mockSpace = { send: vi.fn(), responding: vi.fn(fn => fn()) } as any;
const mockUser = { _id: "user1", name: "Jake", gender: "male" } as any;

describe("handleCommand", () => {
  it("responds to 'wrap' command with wrap summary", async () => {
    const msg = { content: { type: "text", text: "wrap" } } as any;
    await handleCommand(mockSpace, msg, mockUser);
    expect(mockSpace.send).toHaveBeenCalledWith(expect.stringContaining("Lisa"));
  });

  it("responds to 'help' with command list", async () => {
    const msg = { content: { type: "text", text: "help" } } as any;
    await handleCommand(mockSpace, msg, mockUser);
    expect(mockSpace.send).toHaveBeenCalledWith(
      expect.stringContaining(config.wingmanName)
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/bot && npm test -- commands.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create handlers/commands.ts**

```ts
// apps/bot/handlers/commands.ts
import type { Space, Message } from "spectrum-ts";
import type { User } from "../convex/users.js";
import { listFolders } from "../convex/chatFolders.js";
import { logTokens } from "../convex/tokenUsage.js";
import { generateWrap } from "../ai/wrap.js";
import { convex } from "../convex/client.js";
import { api } from "../../../convex/_generated/api.js";
import { config } from "../config.js";

export async function handleCommand(
  space: Space,
  message: Message,
  user: User
): Promise<void> {
  if (message.content.type !== "text") return;
  const text = message.content.text.toLowerCase().trim();

  if (text === "help" || text === "?") {
    await handleHelp(space);
    return;
  }

  if (text.startsWith("wrap")) {
    await handleWrap(space, user);
    return;
  }

  if (text.includes("red flag") || text.includes("red flags")) {
    await handleRedFlags(space, user);
    return;
  }

  if (text.includes("analysis") || text.includes("analyse") || text.includes("analyze")) {
    await handleAnalysis(space, user);
    return;
  }

  // Default: prompt to send a screenshot
  await space.send(
    `Send me a screenshot of your chat and I'll get to work 📸\n\nOr type "help" for all commands.`
  );
}

async function handleHelp(space: Space): Promise<void> {
  await space.send(
    `Hey, I'm ${config.wingmanName} — your wingman 🔥\n\n` +
    `Here's what I can do:\n\n` +
    `📸 Send a screenshot → get reply suggestions + vibe check\n` +
    `"wrap" → full summary on whoever you're talking to\n` +
    `"red flags" → red flags detected across your chats\n` +
    `"analysis" → interest level, compatibility, flags breakdown\n` +
    `"help" → this menu`
  );
}

async function handleWrap(space: Space, user: User): Promise<void> {
  await space.responding(async () => {
    const folders = await listFolders(user._id);
    if (folders.length === 0) {
      await space.send("No chats yet — send me a screenshot first 📸");
      return;
    }

    // Wrap the most recently updated folder
    const folder = folders[0];
    const wrap = await generateWrap({
      personName: folder.personName,
      interestLevel: folder.interestLevel,
      compatibilityScore: folder.compatibilityScore,
      redFlagsCount: folder.redFlagsCount,
      greenFlagsCount: folder.greenFlagsCount,
      messageCount: folder.messageCount,
    });

    await logTokens(user._id, wrap.tokensUsed);

    await space.send(
      `📊 Wrap: ${folder.personName}\n\n` +
      `${wrap.summary}\n\n` +
      `💬 ${folder.messageCount} messages\n` +
      `💫 Interest: ${folder.interestLevel}/100\n` +
      `🔗 Compatibility: ${folder.compatibilityScore}/100\n` +
      `🚩 Red flags: ${folder.redFlagsCount}\n` +
      `✅ Green flags: ${folder.greenFlagsCount}\n\n` +
      `Verdict: ${wrap.verdict}`
    );
  });
}

async function handleRedFlags(space: Space, user: User): Promise<void> {
  await space.responding(async () => {
    const folders = await listFolders(user._id);
    if (folders.length === 0) {
      await space.send("No chats yet — send me a screenshot first 📸");
      return;
    }

    const withFlags = folders.filter(f => f.redFlagsCount > 0);
    if (withFlags.length === 0) {
      await space.send("No red flags detected so far. Looks clean 🟢");
      return;
    }

    const lines = withFlags
      .map(f => `🚩 ${f.personName}: ${f.redFlagsCount} flag${f.redFlagsCount > 1 ? "s" : ""}`)
      .join("\n");

    await space.send(`Red flag summary:\n\n${lines}`);
  });
}

async function handleAnalysis(space: Space, user: User): Promise<void> {
  await space.responding(async () => {
    const folders = await listFolders(user._id);
    if (folders.length === 0) {
      await space.send("No chats yet — send me a screenshot first 📸");
      return;
    }

    const folder = folders[0];
    await space.send(
      `📊 Analysis: ${folder.personName}\n\n` +
      `💫 Interest level: ${folder.interestLevel}/100\n` +
      `🔗 Compatibility: ${folder.compatibilityScore}/100\n` +
      `🚩 Red flags: ${folder.redFlagsCount}\n` +
      `✅ Green flags: ${folder.greenFlagsCount}\n` +
      `💬 Messages tracked: ${folder.messageCount}`
    );
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/bot && npm test -- commands.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bot/handlers/commands.ts apps/bot/__tests__/commands.test.ts
git commit -m "feat: commands handler (wrap, red flags, analysis, help)"
```

---

### Task 16: Message Router + Main Loop

**Files:**
- Create: `apps/bot/handlers/onMessage.ts`
- Create: `apps/bot/index.ts`

- [ ] **Step 1: Create handlers/onMessage.ts**

```ts
// apps/bot/handlers/onMessage.ts
import type { Space, Message } from "spectrum-ts";
import { getUserByPhone } from "../convex/users.js";
import { checkBilling } from "./billing.js";
import { handleScreenshot } from "./screenshot.js";
import { handleCommand } from "./commands.js";
import { config } from "../config.js";

export async function onMessage(space: Space, message: Message): Promise<void> {
  const phone = message.sender.id;

  // Only handle text and attachments
  if (
    message.content.type !== "text" &&
    message.content.type !== "attachment"
  ) {
    return;
  }

  const user = await getUserByPhone(phone);

  if (!user) {
    await space.send(
      `Hey! I'm ${config.wingmanName}, your iMessage wingman 🔥\n\n` +
      `Sign up to get started: ${process.env.WEB_URL ?? "https://kupi.app"}`
    );
    return;
  }

  const billingOk = await checkBilling(space, user);
  if (!billingOk) return;

  if (message.content.type === "attachment") {
    await handleScreenshot(space, message, user);
    return;
  }

  await handleCommand(space, message, user);
}
```

- [ ] **Step 2: Create index.ts**

```ts
// apps/bot/index.ts
import "dotenv/config";
import { Spectrum } from "spectrum-ts";
import { getIMessageProvider } from "./providers/imessage.js";
import { getTerminalProvider } from "./providers/terminal.js";
import { onMessage } from "./handlers/onMessage.js";

const isLocal = process.env.NODE_ENV === "development";

const spectrumConfig = isLocal
  ? { providers: [getTerminalProvider()] }
  : {
      projectId: process.env.SPECTRUM_PROJECT_ID!,
      projectSecret: process.env.SPECTRUM_PROJECT_SECRET!,
      providers: [getIMessageProvider()],
    };

const app = await Spectrum(spectrumConfig);

console.log(`${isLocal ? "Terminal" : "iMessage"} bot running...`);

for await (const [space, message] of app.messages) {
  onMessage(space, message).catch(err => {
    console.error("Error handling message:", err);
  });
}
```

- [ ] **Step 3: Run all bot tests**

```bash
cd apps/bot && npm test
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add apps/bot/handlers/onMessage.ts apps/bot/index.ts
git commit -m "feat: message router and bot entry point"
```

---

## Phase 5: Web App

### Task 17: Web App Scaffold + Convex Client

**Files:**
- Create: `apps/web/next.config.ts`
- Create: `apps/web/lib/convex.ts`
- Create: `apps/web/app/layout.tsx`

- [ ] **Step 1: Create next.config.ts**

```ts
// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 2: Create lib/convex.ts**

```ts
// apps/web/lib/convex.ts
"use client";

import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);
```

- [ ] **Step 3: Create app/layout.tsx**

```tsx
// apps/web/app/layout.tsx
import type { Metadata } from "next";
import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex";

export const metadata: Metadata = {
  title: "KUPI — Your iMessage Wingman",
  description: "AI-powered dating wingman that lives in iMessage",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexProvider client={convex}>{children}</ConvexProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat: Next.js web app scaffold + Convex provider"
```

---

### Task 18: Onboarding Form + Convex Mutation

**Files:**
- Create: `apps/web/components/OnboardForm.tsx`
- Add to: `convex/users.ts` — `onboard` mutation

- [ ] **Step 1: Add onboard mutation to convex/users.ts**

Open `convex/users.ts` and add this mutation after the existing ones:

```ts
export const onboard = mutation({
  args: {
    name: v.string(),
    gender: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { name, gender, phone }) => {
    // Normalise phone to E.164 (basic: strip spaces/dashes)
    const normalised = phone.replace(/[\s\-\(\)]/g, "");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", q => q.eq("phone", normalised))
      .first();

    if (existing) return { userId: existing._id, alreadyExists: true };

    const trialEndsAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const userId = await ctx.db.insert("users", {
      name,
      gender,
      phone: normalised,
      plan: "trial",
      trialEndsAt,
      createdAt: Date.now(),
    });

    return { userId, alreadyExists: false };
  },
});
```

- [ ] **Step 2: Push updated schema**

```bash
npx convex dev --once
```

- [ ] **Step 3: Create OnboardForm.tsx**

```tsx
// apps/web/components/OnboardForm.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";

export default function OnboardForm() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onboard = useMutation(api.users.onboard);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onboard({ name, gender, phone });
      router.push(
        `/onboard/success?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`
      );
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <select value={gender} onChange={e => setGender(e.target.value)} required>
        <option value="">Select gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <input
        type="tel"
        placeholder="+1 (555) 000-0000"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
      />
      {error && <p>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Getting you set up..." : "Get Started →"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add convex/users.ts apps/web/components/OnboardForm.tsx
git commit -m "feat: onboarding form component + onboard Convex mutation"
```

---

### Task 19: Onboarding Page + Success Page

**Files:**
- Create: `apps/web/app/onboard/page.tsx`
- Create: `apps/web/app/onboard/success/page.tsx`

- [ ] **Step 1: Create apps/web/app/onboard/page.tsx**

```tsx
// apps/web/app/onboard/page.tsx
import OnboardForm from "@/components/OnboardForm";

export default function OnboardPage() {
  return (
    <main>
      <h1>Meet KUPI</h1>
      <p>Your AI wingman in iMessage. Sign up and start chatting in 30 seconds.</p>
      <OnboardForm />
    </main>
  );
}
```

- [ ] **Step 2: Create apps/web/app/onboard/success/page.tsx**

```tsx
// apps/web/app/onboard/success/page.tsx
import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export default function SuccessPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SuccessContent />
    </Suspense>
  );
}
```

- [ ] **Step 3: Create apps/web/app/onboard/success/SuccessContent.tsx**

```tsx
// apps/web/app/onboard/success/SuccessContent.tsx
"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";
  const kupiPhone = process.env.NEXT_PUBLIC_KUPI_PHONE ?? "";

  const deepLink = `sms:${kupiPhone}&body=Hey%20KUPI!`;

  return (
    <main>
      <h1>You're in, {name} 🔥</h1>
      <p>
        Tap the button below to open iMessage with KUPI.
        Send your first message to start your free trial.
      </p>
      <a href={deepLink}>
        Open iMessage with KUPI →
      </a>
      <p>
        Or text <strong>{kupiPhone}</strong> manually and say "Hey KUPI!"
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/onboard/
git commit -m "feat: onboarding page + success page with iMessage deep link"
```

---

### Task 20: Landing Page

**Files:**
- Create: `apps/web/app/page.tsx`

- [ ] **Step 1: Create landing page**

```tsx
// apps/web/app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      <section>
        <h1>KUPI — Your iMessage Wingman 🔥</h1>
        <p>
          Send screenshots. Get real replies. Track interest levels, red flags,
          and compatibility — all inside iMessage. No app download.
        </p>
        <Link href="/onboard">Get Started Free →</Link>
      </section>

      <section>
        <h2>How it works</h2>
        <ol>
          <li>Sign up with your name and phone number</li>
          <li>Tap the link to open iMessage with KUPI</li>
          <li>Send a screenshot of any conversation</li>
          <li>Get reply suggestions + vibe analysis instantly</li>
        </ol>
      </section>

      <section>
        <h2>What KUPI does</h2>
        <ul>
          <li>📸 Analyses chat screenshots — Tinder, Instagram, WhatsApp</li>
          <li>💬 Suggests authentic, personalised replies</li>
          <li>💫 Tracks interest levels over time</li>
          <li>🚩 Spots red flags and green flags</li>
          <li>📊 Chat wraps with compatibility scores</li>
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Start web dev server and verify pages load**

```bash
cd apps/web && npm run dev
```

Visit:
- `http://localhost:3000` — landing page loads
- `http://localhost:3000/onboard` — form loads
- `http://localhost:3000/onboard/success?name=Jake` — success page + deep link visible

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: landing page"
```

---

## Phase 6: Integration

### Task 21: End-to-End Smoke Test (Local)

**Goal:** Verify the full flow works locally using the terminal provider before deploying.

- [ ] **Step 1: Copy env files**

```bash
cp .env.example apps/bot/.env
cp .env.example apps/web/.env.local
```

Fill in:
- `CONVEX_URL` from `npx convex dev` output
- `OPENAI_API_KEY`

- [ ] **Step 2: Start Convex dev server**

```bash
npx convex dev
```

- [ ] **Step 3: Start bot in dev (terminal) mode**

```bash
cd apps/bot && NODE_ENV=development npm run build && npm start
```

Expected: `Terminal bot running...`

- [ ] **Step 4: Manually test commands in terminal**

The terminal provider will show a prompt. Type:
- `help` → should receive KUPI help menu
- `wrap` → should receive "No chats yet" message

- [ ] **Step 5: Create a test user directly in Convex dashboard**

Visit your Convex dashboard → Data → users table → insert:
```json
{
  "name": "Test",
  "gender": "male",
  "phone": "+15550000000",
  "plan": "trial",
  "trialEndsAt": <now + 7 days in ms>,
  "createdAt": <now in ms>
}
```

Note: terminal provider uses a fake phone; update the user's phone to match what terminal shows as `message.sender.id`.

- [ ] **Step 6: Start web and verify onboarding form submits**

```bash
cd apps/web && npm run dev
```

Open `http://localhost:3000/onboard`, fill the form, submit. Check Convex dashboard — new user should appear in `users` table. Redirect to success page with deep link should work.

- [ ] **Step 7: Commit final integration notes**

```bash
git add .
git commit -m "chore: local smoke test complete — ready for deployment"
```

---

## Deployment Checklist

### Bot → Railway

- [ ] Create Railway project, link repo, set `apps/bot` as root
- [ ] Set env vars: `CONVEX_URL`, `OPENAI_API_KEY`, `SPECTRUM_PROJECT_ID`, `SPECTRUM_PROJECT_SECRET`, `POLAR_CHECKOUT_URL`, `WEB_URL`
- [ ] Set start command: `npm run build && npm start`
- [ ] Deploy and tail logs

### Web → Vercel

- [ ] Import repo to Vercel, set `apps/web` as root directory
- [ ] Set env vars: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_KUPI_PHONE`, `POLAR_WEBHOOK_SECRET`
- [ ] Deploy

### Polar.sh

- [ ] Create products (basic, pro) in Polar dashboard
- [ ] Add webhook pointing to `https://your-convex.convex.site/webhooks/polar`
- [ ] Set `phone` in customer metadata on checkout creation (pass via URL param to Polar checkout link)
- [ ] Set `POLAR_CHECKOUT_URL` env var on Railway bot

### Convex Production

```bash
npx convex deploy
```

---

## Environment Variables Reference

| Variable | Used by | Description |
|---|---|---|
| `CONVEX_URL` | bot | Convex deployment URL |
| `NEXT_PUBLIC_CONVEX_URL` | web | Convex deployment URL (browser) |
| `OPENAI_API_KEY` | bot | OpenAI API key |
| `SPECTRUM_PROJECT_ID` | bot | Photon/Spectrum project ID |
| `SPECTRUM_PROJECT_SECRET` | bot | Photon/Spectrum project secret |
| `POLAR_WEBHOOK_SECRET` | convex | Polar.sh webhook signature secret |
| `POLAR_CHECKOUT_URL` | bot | Polar.sh checkout link for billing nudges |
| `NEXT_PUBLIC_KUPI_PHONE` | web | KUPI's iMessage phone number for deep link |
| `WEB_URL` | bot | Web app URL (shown to unregistered users) |
