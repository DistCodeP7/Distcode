# 1. Install dependencies only when needed
FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 2. Rebuild the source code only when needed
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# 3. Production image
FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm ts-node typescript

COPY package.json pnpm-lock.yaml* ./
COPY node_modules ./node_modules
COPY public ./public
COPY .next ./.next

# Copy Drizzle schema and config
COPY drizzle ./drizzle
COPY drizzle.config.ts ./drizzle.config.ts

EXPOSE 3000
CMD ["pnpm", "start"]