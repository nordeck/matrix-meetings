# @nordeck/matrix-meetings-bot

## 2.8.3

### Patch Changes

- 348ac70: Adds SBOM report to widget, build and release assets

## 2.8.2

### Patch Changes

- dfccac3: Dependency updates to address CVE-2024-21538, CVE-2024-55565, CVE-2024-52798, CVE-2024-45296 and CVE-2023-26136

## 2.8.1

### Patch Changes

- 205a689: Use Node.JS 20 LTS and Debian Bookworm for the bot image

## 2.8.0

### Minor Changes

- 075c456: Enables encryption support for the Bot

## 2.7.2

### Patch Changes

- 73fd982: improve bot message formatting

## 2.7.1

### Patch Changes

- e6edc93: Use `@nordeck/matrix-meetings-calendar` package
- Updated dependencies [e6edc93]
  - @nordeck/matrix-meetings-calendar@1.0.0

## 2.7.0

### Minor Changes

- dc64521: Change the dockerfile run to alpine

### Patch Changes

- cb8bfda: Demote guest users if promoted by moderator

## 2.6.0

### Minor Changes

- 34c4ef8: Sign the release containers with cosign.

## 2.5.0

### Minor Changes

- ebbdfbd: Change power level of the guest users

## 2.4.2

### Patch Changes

- c76c8c8: Add missing invitation text when user is invited into existing meeting

## 2.4.1

### Patch Changes

- Update dependencies.

## 2.4.0

### Minor Changes

- 480b567: Bot sends a message when a single meeting is edited.

## 2.3.0

### Minor Changes

- c9d31a5: Include the recurrence information in the invitation text.

### Patch Changes

- ff6a877: Provide a base32_room_id50 template parameter for widget urls that can for example be used to template the pad-id of Etherpad.

## 2.2.0

### Minor Changes

- a1dfcb8: Add a messaging permission switch into the meeting creation view.
- d54db57: Use NeoDateFix as the product name.
- c80bfea: Include recurrence information in the meeting update notifications.

### Patch Changes

- 41937a2: Enable the s390x architecture in release builds.
- 3fc82e8: Apply the configured room layout when widgets are added or removed.

## 2.1.0

### Minor Changes

- aef42fb: Add support for recurring meetings to be created via Open-Xchange.

## 2.0.0

### Major Changes

- 6feb722: Remove support for redis and pantalaimon. The bot will use the file storage by default.

### Minor Changes

- d55243f: Configure widgets to be optional so they are not added to all meetings by default.

### Patch Changes

- 6feb722: Update the default values for the `MEETINGWIDGET_COCKPIT_NAME` and `BREAKOUT_SESSION_WIDGET_NAME` configurations.

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
