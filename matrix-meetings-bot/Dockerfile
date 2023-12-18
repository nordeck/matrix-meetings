# We use Debian for build and Alpine to run because the s390x Alpine container has issues running yarn
FROM node:20-bullseye AS node_modules
WORKDIR /build
COPY package.json yarn.lock ./
COPY matrix-meetings-bot/package.json ./matrix-meetings-bot/
COPY resolutions/matrix-sdk-crypto-nodejs ./resolutions/matrix-sdk-crypto-nodejs/
RUN yarn install --production --frozen-lockfile --network-timeout 1000000

FROM node:20-alpine3.19
ENV NODE_ENV=production
WORKDIR /app
RUN set -x\
    && mkdir /app/storage \
    && chown -R 101:0 /app/storage \
    && chmod -R g+w /app/storage
USER 101
COPY --from=node_modules /build/node_modules/ ./node_modules
COPY matrix-meetings-bot/conf ./conf
COPY matrix-meetings-bot/lib ./lib
CMD ["node", "./lib/index.js"]
