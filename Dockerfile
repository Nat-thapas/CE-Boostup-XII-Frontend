FROM node:20-alpine AS base

RUN npm i -g pnpm


FROM base AS dependencies

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


FROM base AS build

WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN pnpm run build
RUN pnpm prune --prod


FROM base AS deploy

RUN apk add --update curl && rm -rf /var/cache/apk/*

WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --chown=node:node package.json package.json
COPY --chown=node:node .env.production .env

USER node

ENV NODE_ENV=production
EXPOSE 5173
CMD ["node", "--env-file=.env", "build/index.js"]
