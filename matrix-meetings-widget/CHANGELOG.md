# @nordeck/matrix-meetings-widget

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
