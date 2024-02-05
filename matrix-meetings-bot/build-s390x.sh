#!/bin/sh

# get the rust crypto node bindings
# we don't need to build them anymore but still need them locally for package linking
git clone --depth 1 --branch v0.1.0-beta.12 https://github.com/matrix-org/matrix-rust-sdk-crypto-nodejs.git /build/matrix-sdk-crypto-nodejs
cd /build/matrix-sdk-crypto-nodejs
yarn link
yarn install

# get the matrix bot sdk from our fork branch
git clone --depth 1 --branch v0.7.1-s390x-nic-fix https://github.com/nordeck/matrix-bot-sdk.git /build/matrix-bot-sdk
cd /build/matrix-bot-sdk
yarn link
yarn link @matrix-org/matrix-sdk-crypto-nodejs
yarn install --ignore-optional
yarn build

# prepare the matrix-meetings bot
# TODO: update to main when merging
git clone --depth 1 --branch nic/feat/bot-e2ee https://github.com/nordeck/matrix-meetings.git /build
cd /build
yarn link @matrix-org/matrix-sdk-crypto-nodejs
yarn link "matrix-bot-sdk"
