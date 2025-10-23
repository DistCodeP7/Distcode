# Use the official Node.js 22 Slim image as a base for better compatibility
FROM node:22-slim AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package manifests and install all dependencies
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app

# Define build-time arguments for environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG GLITHUB_CLIENT_ID
ARG GLITHUB_CLIENT_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG POSTGRES_DB
ARG POSTGRES_PASSWORD
ARG POSTGRES_USER
ARG RABBITMQ_URL
ARG RABBITMQ_EXCHANGE
ARG RABBITMQ_EXCHANGETYPE
ARG RABBITMQ_QUEUE
ARG RABBITMQ_ROUTING_KEY

# Set environment variables for the build process
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV GLITHUB_CLIENT_ID=$GLITHUB_CLIENT_ID
ENV GLITHUB_CLIENT_SECRET=$GLITHUB_CLIENT_SECRET
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV POSTGRES_DB=$POSTGRES_DB
ENV POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENV POSTGRES_USER=$POSTGRES_USER
ENV RABBITMQ_URL=$RABBITMQ_URL
ENV RABBITMQ_EXCHANGE=$RABBITMQ_EXCHANGE
ENV RABBITMQ_EXCHANGETYPE=$RABBITMQ_EXCHANGETYPE
ENV RABBITMQ_QUEUE=$RABBITMQ_QUEUE
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

# Create a non-root user for security (Debian-style)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# We only need production dependencies to run the app
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN corepack enable pnpm && pnpm i --prod --frozen-lockfile


# Define build-time arguments for environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG GLITHUB_CLIENT_ID
ARG GLITHUB_CLIENT_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG POSTGRES_DB
ARG POSTGRES_PASSWORD
ARG POSTGRES_USER
ARG RABBITMQ_URL
ARG RABBITMQ_EXCHANGE
ARG RABBITMQ_EXCHANGETYPE
ARG RABBITMQ_QUEUE
ARG RABBITMQ_ROUTING_KEY

# Set environment variables for the build process
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV GLITHUB_CLIENT_ID=$GLITHUB_CLIENT_ID
ENV GLITHUB_CLIENT_SECRET=$GLITHUB_CLIENT_SECRET
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV POSTGRES_DB=$POSTGRES_DB
ENV POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENV POSTGRES_USER=$POSTGRES_USER
ENV RABBITMQ_URL=$RABBITMQ_URL
ENV RABBITMQ_EXCHANGE=$RABBITMQ_EXCHANGE
ENV RABBITMQ_EXCHANGETYPE=$RABBITMQ_EXCHANGETYPE
ENV RABBITMQ_QUEUE=$RABBITMQ_QUEUE
ENV RABBITMQ_ROUTING_KEY=$RABBITMQ_ROUTING_KEY

# Copy the built application from the builder stage, setting ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json .

# Switch to the non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000

# Start the Next.js server using pnpm start (which runs `next start`)
CMD ["pnpm", "start"]