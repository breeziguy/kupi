FROM node:22-alpine

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Copy bot source
COPY apps/bot ./apps/bot

# Copy convex generated types (needed for build + runtime)
COPY convex/_generated ./convex/_generated
COPY convex/schema.ts ./convex/schema.ts
COPY convex/analyses.ts ./convex/analyses.ts
COPY convex/chatFolders.ts ./convex/chatFolders.ts
COPY convex/http.ts ./convex/http.ts
COPY convex/subscriptions.ts ./convex/subscriptions.ts
COPY convex/tokenUsage.ts ./convex/tokenUsage.ts
COPY convex/users.ts ./convex/users.ts

# Symlink so runtime module resolution works: apps/convex/_generated -> convex/_generated
RUN mkdir -p apps/convex && ln -s /app/convex/_generated /app/apps/convex/_generated

# Install deps
RUN npm ci --workspace=apps/bot

# Build
RUN npm run build --workspace=apps/bot

WORKDIR /app/apps/bot

CMD ["node", "dist/index.js"]
