# We must use Ubuntu as Debian has issues(??) with the matrix-rust-sdk-crypto-nodejs
# build process, being unable to fetch the required crates.io dependencies when
# entering the napi build phase.
FROM ubuntu:23.10 AS custom_build

WORKDIR /build
COPY matrix-meetings-bot/build-s390x.sh ./build-s390x.sh
RUN chmod +x ./build-s390x.sh
# Make sure the folder is there, even if remains empty
RUN mkdir -p ./node_modules

ARG TARGETPLATFORM
# Run custom build script if we are building for linux/s390x
RUN if [ "$TARGETPLATFORM" = "linux/s390x" ] ; then \
    /bin/bash -c './build-s390x.sh'; \
    fi

# Use a matching node image for the node_modules build
FROM node:20-bookworm-slim AS node_modules

WORKDIR /build
# Get the node_modules from the custom build stage, if any
COPY --from=custom_build /build/node_modules/ ./node_modules
COPY package.json yarn.lock ./
COPY matrix-meetings-bot/package.json ./matrix-meetings-bot/
COPY packages/calendar/package.json ./packages/calendar/package.json
COPY packages/calendar/lib ./packages/calendar/lib
RUN yarn install --production --frozen-lockfile --network-timeout 1000000

# Runner image
FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app
RUN set -x\
    && mkdir /app/storage \
    && chown -R 101:0 /app/storage \
    && chmod -R g+w /app/storage
USER 101
COPY --from=node_modules /build/node_modules/ ./node_modules
COPY --from=node_modules /build/packages/calendar/ ./packages/calendar/
COPY matrix-meetings-bot/conf ./conf
COPY matrix-meetings-bot/lib ./lib
CMD ["node", "./lib/index.js"]
