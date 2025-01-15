FROM aquasec/trivy:latest AS scanner

# Copy yarn.lock to run SBOM scan
COPY yarn.lock /tmp
RUN trivy fs --format spdx-json --scanners "license" /tmp/yarn.lock > /tmp/sbom.spdx.json

FROM node:20-bookworm-slim AS builder

WORKDIR /build

COPY package.json yarn.lock ./
COPY matrix-meetings-bot/package.json ./matrix-meetings-bot/
COPY packages/calendar/package.json ./packages/calendar/package.json
COPY packages/calendar/lib ./packages/calendar/lib
RUN yarn install --production --frozen-lockfile --network-timeout 1000000

# Runtime image
FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

#  update npm to address CVE-2024-21538
RUN npm install -g npm@10.9.2

# Add SBOM to the public folder
COPY --from=scanner /tmp/sbom.spdx.json /usr/local/share/doc/matrix-meetings-bot.sbom.spdx.json

RUN set -x\
    && mkdir /app/storage \
    && chown -R 101:0 /app/storage \
    && chmod -R g+w /app/storage
USER 101
COPY --from=builder /build/node_modules/ ./node_modules
COPY --from=builder /build/packages/calendar/ ./packages/calendar/
COPY matrix-meetings-bot/conf ./conf
COPY matrix-meetings-bot/lib ./lib
CMD ["node", "./lib/index.js"]
