#!/bin/bash

# get the deps we need to build the bot
apt-get update && apt-get install --no-install-recommends -y curl git rustc cargo vim python3 nodejs npm
npm install -g yarn

# get the rust crypto nodejs bindings from our fork branch
git clone --depth 1 --branch nic/fix/s390x https://github.com/nordeck/matrix-rust-sdk-crypto-nodejs.git /build/matrix-sdk-crypto-nodejs
cd /build/matrix-sdk-crypto-nodejs
yarn link
yarn install
yarn build

# get the matrix bot sdk from our fork branch
git clone --depth 1 --branch nic/fix/s390x https://github.com/nordeck/matrix-bot-sdk.git /build/matrix-bot-sdk
cd /build/matrix-bot-sdk
yarn link "@matrix-org/matrix-sdk-crypto-nodejs"
yarn link
yarn install --ignore-optional
yarn build

# prepare the matrix-meetings bot
git clone --depth 1 --branch nic/feat/bot-e2ee https://github.com/nordeck/matrix-meetings.git /build
cd /build
yarn link "@matrix-org/matrix-sdk-crypto-nodejs"
yarn link "matrix-bot-sdk"
