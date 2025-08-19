---
'@nordeck/matrix-meetings-bot': patch
---

Improve Matrix Room Version 12 support by using `/_matrix/client/v3/capabilities` endpoint to retrieve synapse room default version. Deprecate `DEFAULT_ROOM_VERSION` option.
