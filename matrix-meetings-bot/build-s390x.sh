#!/bin/sh

# get the matrix bot sdk from our fork branch
git clone --depth 1 --branch v0.7.1-s390x-nic-fix https://github.com/nordeck/matrix-bot-sdk.git /build/matrix-bot-sdk
cd /build/matrix-bot-sdk
yarn link
yarn install --ignore-optional
yarn build

# prepare the matrix-meetings bot
# TODO: update to main when merging
git clone --depth 1 --branch nic/feat/bot-e2ee https://github.com/nordeck/matrix-meetings.git /build
cd /build
yarn link "matrix-bot-sdk"
