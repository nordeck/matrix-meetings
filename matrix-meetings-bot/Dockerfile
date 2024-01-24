# We must use Ubuntu as Debian has issues(??) with the matrix-rust-sdk-crypto-nodejs
# build process, being unable to fetch the required crates.io dependencies when
# entering the napi build phase.
FROM ubuntu:22.04 AS node_modules

# required for sourcing nvm.sh
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
# prepare an updated node environment
RUN apt-get update && apt-get install -y curl git rustc cargo vim python3
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 20.8.1

RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default
RUN cp $NVM_DIR/versions/node/v$NODE_VERSION/bin/node $NVM_DIR/node

RUN source $NVM_DIR/nvm.sh \
    && npm install -g yarn

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

WORKDIR /build
COPY package.json yarn.lock ./
COPY matrix-meetings-bot/package.json ./matrix-meetings-bot/
COPY packages/calendar/package.json ./packages/calendar/package.json
COPY packages/calendar/lib ./packages/calendar/lib
RUN source $NVM_DIR/nvm.sh && \
    yarn install --production --frozen-lockfile --network-timeout 1000000

# Runner image
FROM ubuntu:22.04

ENV NVM_DIR /root/.nvm
ENV NODE_ENV=production

WORKDIR /app
RUN set -x\
    && mkdir /app/storage \
    && chown -R 101:0 /app/storage \
    && chmod -R g+w /app/storage
USER 101
COPY --from=node_modules $NVM_DIR/node /usr/local/bin/node
COPY --from=node_modules /build/node_modules/ ./node_modules
COPY --from=node_modules /build/packages/calendar/ ./packages/calendar/
COPY matrix-meetings-bot/conf ./conf
COPY matrix-meetings-bot/lib ./lib

CMD ["node", "./lib/index.js"]