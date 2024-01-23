source /root/.nvm/nvm.sh

# get the rust crypto nodejs bindings from our fork branch
git clone --depth 1 --branch nic/fix/s390x https://github.com/nordeck/matrix-rust-sdk-crypto-nodejs.git /src/matrix-sdk-crypto-nodejs
cd /src/matrix-sdk-crypto-nodejs
yarn link
yarn install
yarn build

# get the matrix bot sdk from our fork branch
git clone --depth 1 --branch nic/fix/s390x https://github.com/nordeck/matrix-bot-sdk.git /src/matrix-bot-sdk
cd /src/matrix-bot-sdk
yarn link "@matrix-org/matrix-sdk-crypto-nodejs"
yarn link
yarn install --ignore-optional
yarn build

# patch the NAPI-RS generated index.js to support s390x (@napi-rs/cli@2.17.1 should support it, when released)
patch /src/matrix-sdk-crypto-nodejs/index.js /src/index.js.patch

# prepare the matrix-meetings bot
git clone --depth 1 --branch nic/feat/bot-e2ee https://github.com/nordeck/matrix-meetings.git /src
cd /src
yarn link "@matrix-org/matrix-sdk-crypto-nodejs"
yarn link "matrix-bot-sdk"
# yarn install
# yarn build
