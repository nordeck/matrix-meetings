---
'@nordeck/matrix-meetings-bot': patch
---

Improve Matrix Room Version 12 support by using `/_matrix/client/v3/capabilities` endpoint to retrieve synapse room default version. The `DEFAULT_ROOM_VERSION` option is not needed and is deleted.
