# @nordeck/matrix-meetings-bot

## 1.1.1

### Patch Changes

- 5949a45: Performance optimizations to speedup and stabilize the operations when the bot manages a lot of meeting rooms.
- b8c3a9c: Only allow to remove participants that have a lower power level.
- 3e82540: Update the invite reason of pending invites when the meeting details are changed.
- 18ea615: Make sure meeting room is updated before invitations are sent
- 56c37ef: Delete a recurring meeting room after the last event took place.
- 098eb75: Add basic support to handle the storage of recurring meetings in a meeting room.

## 1.1.0

### Minor Changes

- 6e1763e: Include `arm64` and `s390x` builds.

### Patch Changes

- 2e5b96f: Bot not works in the bot to user private chat when 'enable_control_room_migration' is disabled.

## 1.0.4

### Patch Changes

- 04b1fbe: Meeting title could contain special characters.
- 7422816: Correctly handle missing configuration of `AUTO_DELETION_OFFSET`.
- ff8945f: Allow users to clear the meeting description.

## 1.0.3

### Patch Changes

- 6852977: Move static images and locales to the correct directory.

## 1.0.2

### Patch Changes

- 95b8d84: Include `LICENSE` file in container output and define concluded licenses in case of dual licenses.

## 1.0.1

### Patch Changes

- a711629: Include a `licenses.json` in the container image, which includes a list of all dependencies and their licenses.

## 1.0.0

### Major Changes

- 529947d: Initial release
