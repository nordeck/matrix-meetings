# @nordeck/matrix-meetings-widget

## 1.7.2

### Patch Changes

- d3072da: Add support for Matrix Room Version 12. Added a new option `DEFAULT_ROOM_VERSION` to configure room version for the Bot.

## 1.7.1

### Patch Changes

- 13c8607: React was updated to version 18
- fc1d974: @nordeck/matrix-meetings-widget does now use Vite and Vitest instead of CRA and Jest.
- 348ac70: Adds SBOM report to widget, build and release assets

## 1.7.0

### Minor Changes

- 6c77bc5: Add Helm values for configuration of ipv4only mode
- ba24789: New widget-server base image that supports IPv4-only deployments

## 1.6.1

### Patch Changes

- e6edc93: Use `@nordeck/matrix-meetings-calendar` package
- Updated dependencies [e6edc93]
  - @nordeck/matrix-meetings-calendar@1.0.0

## 1.6.0

### Minor Changes

- 34c4ef8: Sign the release containers with cosign.

## 1.5.3

### Patch Changes

- 8ddde1d: Fix date calendar weekdays in english

## 1.5.2

### Patch Changes

- Update dependencies.

## 1.5.1

### Patch Changes

- d7600e0: Only user with the right power level can send message to the breakout session rooms.

## 1.5.0

### Minor Changes

- 20a65cb: Include all updates and exclusions of recurring meetings in the ICS file export.
- c13e102: Support editing a single occurrence of a recurring meeting.
- 6203e64: Support deleting a single occurrence of a recurring meeting.

## 1.4.0

### Minor Changes

- 77db462: Use digital time picker.
- a1dfcb8: Add a messaging permission switch into the meeting creation view.
- ea6a491: Add meeting expanded details view
- d54db57: Use NeoDateFix as the product name.
- 2d66142: Invite users during the meeting creation.
- 72ce2ae: Add the expended meeting view to the cockpit widget

### Patch Changes

- 8776684: Fix layout of the copied email template on Mac OS.
- f14c2a5: Limit the length of the meeting title and description.
- 2416758: Include the timezone definition in the exported calendar files.
- 86b107b: Fix month value in 'aria-label' of custom yearly recurrence.

## 1.3.1

### Patch Changes

- da6695c: Always select the first full week when switching from the month view.

## 1.3.0

### Minor Changes

- d55243f: Configure widgets to be optional so they are not added to all meetings by default.
- 6feb722: Restore the previous calendar view when opening the widget.

### Patch Changes

- eb01d89: Fix typo in the german translation of the “Back to parent room” button.
- 66df6cc: Update the title of the share dialog.

## 1.2.1

### Patch Changes

- a5832a3: Correctly navigate between months.

## 1.2.0

### Minor Changes

- f19772f: Add day, week, work week and month calendar views.
- 8a9477f: Add the `REACT_APP_DISPLAY_ALL_MEETINGS` configuration to always display the meetings from all rooms in the widget.
- 989cbf0: Add support for recurring meetings.

  A recurring meeting is performed in a single Matrix room. Common recurrence
  rules like daily, weekly, monthly, but also custom recurrences like every Monday
  are supported.

- 8c67f19: Edit meetings in a modal view that mirrors the meeting creation process.

### Patch Changes

- e74a636: Only allow to remove participants that have a lower power level.
- 5d1e602: Hide the button to create breakout sessions if the user has not the required power.
- 92ddcd6: Include the year the meeting happens in the meeting room cockpit.
- a922014: Set document language to improve accessibility.

## 1.1.0

### Minor Changes

- 0f02a47: Include `arm64` and `s390x` builds.
- e0626ae: Rework the user interface to resolve accessibility issues and comply to BITV 2.0 and WCAG 2.1.
  Notable changes are:
  - Screen reader users can now interact with the widget.
  - The widget is now keyboard accessible.
  - Adds support for a high contrast theme for visually impaired users.
  - General theme updates to better match the Element theme.

## 1.0.3

### Patch Changes

- 3a27deb: Accept all meeting invitations for breakout sessions that are created by the own user.

## 1.0.2

### Patch Changes

- 221441f: Include `LICENSE` file in container output and define concluded licenses in case of dual licenses.

## 1.0.1

### Patch Changes

- 465849e: Accept all meeting invitations for meetings that are created by the own user, even if the meeting is scheduled in the future.
- 9c9b70d: Include a `licenses.json` in the container image, which includes a list of all dependencies and their licenses.

## 1.0.0

### Major Changes

- 1f0f6d7: Initial release
