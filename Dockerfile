# Use the official Node.js 22 Alpine image as a base
FROM node:22-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy only pnpm-related files and install dependencies
COPY package.json pnpm-lock.yaml* .npmrc* ./
# Install ALL dependencies, including dev dependencies needed for `next build`
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app

# Define build-time arguments for environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL
# ... (all your other ARGs remain the same)
ARG RABBITMQ_ROUTING_KEY

# Set environment variables for the build process
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
# ... (all your other ENVs remain the same)
ENV RABBITMQ_ROUTING_KEY=$RABBITMQ_ROUTING_KEY

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application using pnpm
RUN corepack enable pnpm && pnpm run build

# Stage 3: Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# We only need production dependencies to run the app
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN corepack enable pnpm && pnpm i --prod --frozen-lockfile

# Copy the built application from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to the non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000

# Start the Next.js server using pnpm start (which runs `next start`)
CMD ["pnpm", "start"]