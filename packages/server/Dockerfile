# syntax=docker/dockerfile:1

# Stage 1: build the native FFI library with Rust
FROM rust:1.85 AS ffi-builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
# The example crate is a Cargo workspace member, so its manifest must be
# present for the workspace to load.
COPY examples/rust-native-agent-payment-governance ./examples/rust-native-agent-payment-governance

RUN cargo build --release -p limetry-ffi

# Stage 2: build TypeScript packages and run the server on Node
FROM node:22-slim AS runtime

ENV LIMETRY_AI_FFI_PATH=/app/target/release/liblimetry_ffi.so

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages ./packages
COPY examples ./examples

RUN yarn install

RUN yarn build:sdk && yarn build:preflight && yarn build:server

COPY --from=ffi-builder /app/target/release/liblimetry_ffi.so /app/target/release/liblimetry_ffi.so

EXPOSE 3810

CMD ["node", "packages/server/dist/index.js"]
