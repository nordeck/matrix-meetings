This package replaces the original [@matrix-org/matrix-sdk-crypto-nodejs](https://www.npmjs.com/package/@matrix-org/matrix-sdk-crypto-nodejs) package that doesn't provide support for the [`s390x` platform](https://github.com/matrix-org/matrix-rust-sdk/issues/1503).
Since we don't use the crypto support, yet, we decided to replace it with a dummy package in the meantime to unblock providing it for `s390x`.

This package is configured in the root [`package.json`](../../package.json) file in `"resolutions"`.
