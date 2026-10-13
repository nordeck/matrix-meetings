---
'@nordeck/matrix-meetings-bot': patch
---

Fix the issue that recent Synapse versions (>= 1.162) enforce stripped state on
`/sync` invite state, which doesn't include `origin_server_ts`, required for
monitoring calendar rooms. When this happens, we use the join event timestamp
instead of the invite event.
