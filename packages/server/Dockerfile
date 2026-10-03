# syntax=docker/dockerfile:1

FROM node:22-slim AS runtime

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY tsconfig.json ./
COPY .yarn ./.yarn
COPY packages ./packages
COPY examples ./examples

RUN yarn install --immutable

RUN yarn build:sdk && yarn build:preflight && yarn build:server

EXPOSE 3810

CMD ["node", "packages/server/dist/index.js"]
