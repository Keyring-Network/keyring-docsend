# Multi-stage build producing a small standalone Next.js server.
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# AUTH_SECRET is only needed at runtime, but the build wants it present.
ENV AUTH_SECRET=build-time-placeholder
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Default the JSON store to a mounted volume.
ENV DATA_DIR=/app/.data
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
