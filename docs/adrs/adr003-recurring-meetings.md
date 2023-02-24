# ADR003: Recurring Meetings

Status: accepted

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

Calendar applications manage different types of meetings.
The meetings widget currently only supports single-occurrence meetings that have a specific start time and end time (may be on different days).
But especially in the professional sector, recurring meetings are commonly used.
They happen for example every weekday on the same time or each Monday at 9:00 am.

In order to be able to compete with other collaboration tools, the widget should be able to create and manage these kinds of meetings.

### Technical and feature requirements

- All occurrences of a recurring meeting are hold in the same Matrix room.
- Name, description, participants, widgets, and permissions can only be changed for the whole recurring meeting series.
- Date and time can also be changed for individual occurrences.
- Date and time (and the recurrence rule) can be changed from a certain date (ex: daily at 10am from 1.-10.09. and weekly at Monday 11am from 11.09.-30.09.) in the same Matrix room.
- Normal meetings can receive a recurrence rule after the creation.
- The recurrence rule can be removed from a recurring meeting after creation.

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

We will remove the `start_time` and `end_time` fields from the `net.nordeck.meetings.metadata` event and will instead add a new `calendar` field.
The `calendar` field will be an array of objects that each contains a subset of the properties of the [`iCalendar` standard][rfc5545-icalendar] (see [Appendix](#rfc-5545-icalendar)).
We will remove the `auto_deletion_offset` field and always set `force_deletion_at` on an update to reduce the need to change downstream services.

We will use the `calendar` field to represent a single event in the room:

```yaml
type: 'net.nordeck.meetings.metadata'
state_key: ''
room_id: '!room-id'
content:
  creator: '@user-id'

  # a list of entries that describe the event
  calendar:
    - # a random id
      uid: '<random-uuid>'
      # the start of the event
      dtstart: { tzid: 'Europe/Berlin', value: '20220721T184500' }
      # the end of the event
      dtend: { tzid: 'Europe/Berlin', value: '20220721T194500' }

  # is set to one hour after the last entry of the calendar
  force_deletion_at: 1658425500000

sender: '@user-id'
origin_server_ts: 0,
event_id: '$event-id'
```

We will use the `calendar` field to represent a recurring meeting in the room:

```yaml
type: 'net.nordeck.meetings.metadata'
state_key: ''
room_id: '!room-id'
content:
  creator: '@user-id'

  # a list of entries that describe the event
  calendar:
    - # a random id
      uid: '<random-uuid-1>'
      # the start of the event
      dtstart: { tzid: 'Europe/Berlin', value: '20220721T184500' }
      # the end of the event
      dtend: { tzid: 'Europe/Berlin', value: '20220721T194500' }
      # the recurrence rule
      rrule: 'FREQ=DAILY;UNTIL=20220812T164500Z'
      # the excluded days where the series is skipped
      exdate:
        - { tzid: 'Europe/Berlin', value: '20220801T184500' }

    - # a second series that starts later
      uid: '<random-uuid-2>'
      # the start of the event
      dtstart: { tzid: 'Europe/Berlin', value: '20220813T160000' }
      # the end of the event
      dtend: { tzid: 'Europe/Berlin', value: '20220813T170000' }
      # the recurrence rule
      rrule: 'FREQ=DAILY;COUNT=15'

    - # an individual entry that is updated
      uid: '<random-uuid-2>'
      # the start of the event
      dtstart: { tzid: 'Europe/Berlin', value: '20220820T161500' }
      # the end of the event
      dtend: { tzid: 'Europe/Berlin', value: '20220820T181500' }
      # the recurrence entry that is replaced
      recurrenceId: { tzid: 'Europe/Berlin', value: '20220820T160000' }

  # is set to one hour after the last entry of the
  # recurrence rules (undefined if infinity)
  force_deletion_at: 1661618700000

sender: '@user-id'
origin_server_ts: 0,
event_id: '$event-id'
```

We will use the following definition for the entries of the new `calendar` field:

```ts
type CalendarEntry = {
  /**
   * The uid of the entry.
   * Corresponds to the UID field
   */
  uid: string;

  /**
   * The inclusive start date and time of the entry.
   * Corresponds to the DTSTART field.
   */
  dtstart: DateTimeEntry;

  /**
   * The non-inclusive end date and time of the entry.
   * Corresponds to the DTEND field.
   */
  dtend: DateTimeEntry;

  /**
   * The recurring rule of the entry in the original iCal format.
   * Corresponds to the RRULE field.
   */
  rrule?: string;

  /**
   * A list of excluded dates.
   * Each date should match a recurrence entry of the series when
   * normalized to UTC (example: Europe/Berlin:20220101T100000
   * describes the same entry as Europe/London:20220101T090000).
   * Corresponds to the EXDATE field.
   */
  exdate?: DateTimeEntry[];

  /**
   * The id of the recurrence entry that should be replaced with this entry.
   * This will replace a single occurrence for another entry in the array that:
   *   1. Has the same UID and SEQUENCE.
   *   2. Has a RRULE.
   * The recurrence ID should match a recurrence entry of the series when
   * normalized to UTC (example: Europe/Berlin:20220101T100000
   * describes the same entry as Europe/London:20220101T090000).
   * Corresponds to the RECURRENCE-ID field.
   */
  recurrenceId?: DateTimeEntry;
};

/**
 * A timezoned date-time entry
 */
type DateTimeEntry = {
  /**
   * The timezone in which the value should be interpreted in.
   * Example: Europe/Berlin
   * Corresponds to the TZNAME type.
   */
  tzid: string;

  /**
   * The date and time of this entry.
   * It uses a iCalendar-specific timezone-less format.
   * Example: 20220101T100000
   * Corresponds to the DATE-TIME type.
   */
  value: string;
};
```

### Alternative 1: Keep the existing fields

The [`RRULE` field of the `iCalendar` standard][rfc5545-rrule] (see [Appendix](#rfc-5545-icalendar)) is a standardized format to represent repeated events (examples: daily, each Monday, each last Thursday in a month, yearly on 1st February).
We can add a `rrule`, `exdate`, and `timezone` property to the `net.nordeck.meetings.metadata` event.
We can add an `overrides` property to enable additional updates to the series that are usually represented in the `iCalendar` standard as individual `VEVENT`s.
We can remove the `auto_deletion_offset` field and always set `force_deletion_at` on an update to reduce the need to change downstream services.

```yaml
type: 'net.nordeck.meetings.metadata'
state_key: ''
room_id: '!room-id'
content:
  creator: '@user-id'
  # the start of the recurring event
  start_time: '2022-07-21T16:45:00Z'

  # the end of the recurring event
  end_time: '2022-07-21T17:45:00Z'

  # the recurrence rule
  rrule: 'FREQ=DAILY;UNTIL=20220812T164500Z'

  # the excluded days where the series is skipped
  exdates:
    - '2022-08-01T16:45:00Z'

  # the timezone the event was created in
  timezone: 'Europe/Berlin'

  # a list of overrides to the main series
  overrides:
    - # a second series that starts later
      start_time: '2022-08-13T14:00:00Z'
      end_time: '2022-08-13T15:00:00Z'
      rrule: 'FREQ=DAILY;COUNT=15'

    - # an individual entry that is updated
      start_time: '2022-08-20T14:15:00Z'
      end_time: '2022-08-20T16:15:00Z'
      recurrenceId: '2022-08-20T14:00:00Z'

  # Is set to one hour after the last entry of the
  # recurrence rule (undefined if infinity)
  force_deletion_at: 1661618700000

sender: '@user-id'
origin_server_ts: 0,
event_id: '$event-id'
```

**Advantage:** No breaking change of the data model because only optional properties are added.

**Disadvantage:** A `start_time` without timezone information is not reliably usable for recurrence rules because daylight saving time (DST) can't be taken into account.
This would mean that a meeting might switch from for example 10am in summer to 9am in winter.
A solution would be to add a `timezone` property that describes how the values should be interpreted.
However, this limits the compatibility with other applications, because the `iCalendar` standard allows to represent each field (example: start time, end time, excluded date, …) in a different timezone.
While we don't need that feature, we can't expect other apps not to use it.

**Disadvantage:** There are different representations for the (1) initial series and (2) overrides.
This is different compared to the `iCalendar` standard and makes it unnecessarily complex to parse the data.

### Alternative 2: Use verbatim iCalendar file

Instead of storing selected contents from the `iCalendar` standard, we could also store `VEVENT`s verbatim.

```yaml
type: 'net.nordeck.meetings.metadata'
state_key: ''
room_id: '!room-id'
content:
  creator: '@user-id'

  # a list of entries that describe the event
  calendar:
    - |
      BEGIN:VEVENT
      TRANSP:OPAQUE
      UID:C6F54943-D836-4BB9-89E2-547E1A993547
      DTSTAMP:20210611T073256Z
      DTSTART;TZID=Europe/Berlin:20220721T184500
      DTEND;TZID=Europe/Berlin:20220721T194500
      RRULE:FREQ=DAILY;COUNT=20
      EXDATE;TZID=Europe/Berlin:20220801T184500
      DESCRIPTION:
      STATUS:CONFIRMED
      SEQUENCE:7
      SUMMARY:New Event
      LAST-MODIFIED:20210611T073256Z
      CREATED:20210611T061234Z
      END:VEVENT

  # is set to one hour after the last entry of the
  # recurrence rules (undefined if infinity)
  force_deletion_at: 1659638700000

sender: '@user-id'
origin_server_ts: 0,
event_id: '$event-id'
```

**Advantage:** We would support the full format and could include any optional metadata that can be described in the original format.
This could also potentially obsolete the `exernal_data` property.

**Disadvantage:** Storing the data as string makes it harder to work with the individual values.
Each component would need to be able to parse `iCalendar` files in order to display the values.

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

### Backwards compatibility

We don't want to break meeting rooms that were created before this change was applied.
We accept that the change is not forward compatible so old widget installations won't support already migrated rooms.

We will still accept the old data model and will upgrade the event in the room when it should be updated.
We will assume that all previous events were created in the `Europe/Berlin` timezone.

If a `auto_deletion_offset` field is present, this will be replaced by a `force_deletion_at` timestamp that holds the resolved value.

Example: “The room hosts a single meeting from 4:45 PM to 5:45PM Berlin time on the 21th September 2022”.

Old:

```yaml
type: 'net.nordeck.meetings.metadata'
state_key: ''
room_id: '!room-id'
content:
  creator: '@user-id'
  start_time: '2022-07-21T14:45:00Z'
  end_time: '2022-07-21T15:45:00Z'
  auto_deletion_offset: 60
sender: '@user-id'
origin_server_ts: 0,
event_id: '$event-id'
```

New:

```yaml
type: 'net.nordeck.meetings.metadata'
state_key: ''
room_id: '!room-id'
content:
  creator: '@user-id'
  calendar:
    - uid: '<random-uuid>'
      dtstart: { tzid: 'Europe/Berlin', value: '20220721T164500' }
      dtend: { tzid: 'Europe/Berlin', value: '20220721T174500' }
  force_deletion_at: 1658421900000
sender: '@user-id'
origin_server_ts: 0,
event_id: '$event-id'
```

### Bot implementation

We need to apply some changes to the APIs of the Meetings Bot so the new information can be stored in the rooms.
The bot will not migrate any event but will only store information that were calculated by the widget.

#### `net.nordeck.meetings.meeting.create` (Room Event)

We will support a new `calendar` field as an optional replacement for the `start_time` and `end_time` fields.
The `calendar` field uses the same schema as in the `net.nordeck.meetings.metadata` state event.
This change is backwards compatible so that widgets can still use the old API if needed.

Instead of writing a `auto_deletion_offset` field, the bot should always write a `force_deletion_at` timestamp that holds the resolved value.
If the series doesn't end, `force_deletion_at` will be skipped.

```diff
  {
    "type": "net.nordeck.meetings.meeting.create",
    "sender": "@user-id",
    "content": {
      "data": {
        "title": "My Meeting",
        "description": "",
-       "start_time": "2022-10-26T16:00:00+02:00",
-       "end_time": "2022-10-26T17:00:00+02:00",
+       "calendar": [
+         {
+           "uid": "<random-uuid>",
+           "dtstart": { "tzid": "Europe/Berlin", "value": "20221026T160000" },
+           "dtend": { "tzid": "Europe/Berlin", "value": "20221026T170000" }
+         }
+       ],
        "widget_ids": ["jitsi", "poll"],
        "participants": [{ "user_id": "@user-id" }]
      },
      "context": {
        "locale": "en-US",
        "timezone": "Europe/Berlin"
      }
    },
    "event_id": "$event-id",
    "room_id": "!room-id",
    "origin_server_ts": 1666789552097
  }
```

#### `net.nordeck.meetings.meeting.update` (Room Event)

We will support a new `calendar` field as an optional replacement for the `start_time` and `end_time` fields.
The `calendar` field uses the same schema as in the `net.nordeck.meetings.metadata` state event.
This change is backwards compatible so that widgets can still use the old API if needed.

If the `calendar` field is received by the bot, it should remove the `start_time` and `end_time` fields from the metadata event.

Instead of writing a `auto_deletion_offset` field, the bot should always write a `force_deletion_at` timestamp that holds the resolved value.
If the series doesn't end, `force_deletion_at` will be skipped.

```diff
  {
    "type": "net.nordeck.meetings.meeting.update",
    "sender": "@user-id",
    "content": {
      "data": {
        "target_room_id": "!room-id",
        "title": "My Meeting",
        "description": "",
-       "start_time": "2022-10-26T16:00:00+02:00",
-       "end_time": "2022-10-26T17:00:00+02:00",
+       "calendar": [
+         {
+           "uid": "<random-uuid>",
+           "dtstart": { "tzid": "Europe/Berlin", "value": "20221026T160000" },
+           "dtend": { "tzid": "Europe/Berlin", "value": "20221026T170000" }
+         }
+       ]
      },
      "context": {
        "locale": "en-US",
        "timezone": "Europe/Berlin"
      }
    },
    "event_id": "$event-id",
    "room_id": "!room-id", // can also be "!parent-room-id"
    "origin_server_ts": 1666789552097
  }
```

#### `net.nordeck.meetings.breakoutsessions.create` (Room Event)

This endpoint will still generate events in the old format.

#### `POST /v1/meeting/create`

This endpoint will still generate events in the old format.

#### `PUT /v1/meeting/update`

This endpoint will still generate events in the old format.

### Widget implementation

The widget will use the new `calendar` field to create new meetings or update existing meetings.
Updates should be calculated based on the [migrated state events](#backwards-compatibility).
The widget will be responsible to generate the complete `calendar` value, i.e. implements transformations to delete single occurrences or add updates for individual entries.

### Bot &lt;-&gt; Open-Xchange (OX)

> ⚠️ This section is not decided yet. ⚠️
>
> Here are some ideas on a newer integration with external calendar applications that create video conference rooms:
>
> - OX sends the meeting in a `*.ical` file, the bot creates the room, extracts and converts all relevant information, and creates the metadata event.
> - (if meeting exists) OX sends the meeting in a `*.ical` file, the bot finds the existing room, and updates the metadata event.
> - (if event is updated) The bot generates a `*.ical` file and sends it to OX. The bot listens to the metadata event changes to also report changes that are done by the widget without bot interaction.

### Room Reaper

The `auto_deletion_offset` field will not be used in migrated rooms anymore.
Instead, the `force_deletion_at` will already include the resolved value.
This field is already supported, so we don't need to update the feature of the room reaper.

### Update Operations

This sections provides some details on how the meetings widget would apply edits to the `net.nordeck.meetings.metadata` event.

#### Add a recurrence rule to an existing meeting

```diff
  type: 'net.nordeck.meetings.metadata'
  state_key: ''
  room_id: '!room-id'
  content:
    creator: '@user-id'
    calendar:
      - uid: '<random-uuid>'
        dtstart: { tzid: 'Europe/Berlin', value: '20220721T184500' }
        dtend: { tzid: 'Europe/Berlin', value: '20220721T194500' }
+       rrule: 'FREQ=DAILY'
    force_deletion_at: 1658421900000
  sender: '@user-id'
  origin_server_ts: 0,
  event_id: '$event-id'
```

#### Delete a single event from a recurring meeting

```diff
  type: 'net.nordeck.meetings.metadata'
  state_key: ''
  room_id: '!room-id'
  content:
    creator: '@user-id'
    calendar:
      - uid: '<random-uuid>'
        dtstart: { tzid: 'Europe/Berlin', value: '20220721T184500' }
        dtend: { tzid: 'Europe/Berlin', value: '20220721T194500' }
        rrule: 'FREQ=DAILY'
+       exdate:
+         - { tzid: 'Europe/Berlin', value: '20220801T184500' }
    force_deletion_at: 1658421900000
  sender: '@user-id'
  origin_server_ts: 0,
  event_id: '$event-id'
```

#### Update a single event from a recurring meeting

```diff
  type: 'net.nordeck.meetings.metadata'
  state_key: ''
  room_id: '!room-id'
  content:
    creator: '@user-id'
    calendar:
      - uid: '<random-uuid>'
        dtstart: { tzid: 'Europe/Berlin', value: '20220721T184500' }
        dtend: { tzid: 'Europe/Berlin', value: '20220721T194500' }
        rrule: 'FREQ=DAILY'
+     - uid: '<random-uuid>'
+       dtstart: { tzid: 'Europe/Berlin', value: '20220820T161500' }
+       dtend: { tzid: 'Europe/Berlin', value: '20220820T181500' }
+       recurrenceId: { tzid: 'Europe/Berlin', value: '20220820T184500' }
    force_deletion_at: 1658421900000
  sender: '@user-id'
  origin_server_ts: 0,
  event_id: '$event-id'
```

#### Use a new recurrence rule from a day onwards

```diff
  type: 'net.nordeck.meetings.metadata'
  state_key: ''
  room_id: '!room-id'
  content:
    creator: '@user-id'
    calendar:
      - uid: '<random-uuid-1>'
        dtstart: { tzid: 'Europe/Berlin', value: '20220721T184500' }
        dtend: { tzid: 'Europe/Berlin', value: '20220721T194500' }
-       rrule: 'FREQ=DAILY'
+       rrule: 'FREQ=DAILY;UNTIL=20220819T164500Z'
+     - uid: '<random-uuid-2>'
+       dtstart: { tzid: 'Europe/Berlin', value: '20220820T161500' }
+       dtend: { tzid: 'Europe/Berlin', value: '20220820T181500' }
+       rrule: 'FREQ=DAILY;INTERVAL=2'
    force_deletion_at: 1658421900000
  sender: '@user-id'
  origin_server_ts: 0,
  event_id: '$event-id'
```

#### Update a recurrence entry that has exceptions

All exceptions that still match a recurrence entry are kept.
We might want to implement conflict resolution in the future to also keep some of the non-matching entries in case the time value was changed.

```diff
  type: 'net.nordeck.meetings.metadata'
  state_key: ''
  room_id: '!room-id'
  content:
    creator: '@user-id'
    calendar:
      - uid: '<random-uuid>'
-       dtstart: { tzid: 'Europe/Berlin', value: '20220721T184500' }
+       dtstart: { tzid: 'Europe/Berlin', value: '20220729T184500' }
-       dtend: { tzid: 'Europe/Berlin', value: '20220721T194500' }
+       dtend: { tzid: 'Europe/Berlin', value: '20220729T194500' }
        rrule: 'FREQ=DAILY'
        exdate:
-         - { tzid: 'Europe/Berlin', value: '20220822T184500' }
          - { tzid: 'Europe/Berlin', value: '20220801T184500' }
-     - uid: '<random-uuid>'
-       dtstart: { tzid: 'Europe/Berlin', value: '20220729T161500' }
-       dtend: { tzid: 'Europe/Berlin', value: '20220729T181500' }
-       recurrenceId: { tzid: 'Europe/Berlin', value: '20220729T184500' }
+     - uid: '<random-uuid>'
+       dtstart: { tzid: 'Europe/Berlin', value: '20220820T161500' }
+       dtend: { tzid: 'Europe/Berlin', value: '20220820T181500' }
+       recurrenceId: { tzid: 'Europe/Berlin', value: '20220820T184500' }
    force_deletion_at: 1658421900000
  sender: '@user-id'
  origin_server_ts: 0,
  event_id: '$event-id'
```

#### Use a new recurrence rule from a day onwards that has exceptions

All exceptions that still match a recurrence entry are kept and distributed to the respective series.
We might want to implement conflict resolution in the future to also keep some of the non-matching entries in case the time value was changed.

```diff
  type: 'net.nordeck.meetings.metadata'
  state_key: ''
  room_id: '!room-id'
  content:
    creator: '@user-id'
    calendar:
      - uid: '<random-uuid-1>'
        dtstart: { tzid: 'Europe/Berlin', value: '20220721T184500' }
        dtend: { tzid: 'Europe/Berlin', value: '20220721T194500' }
-       rrule: 'FREQ=DAILY'
+       rrule: 'FREQ=DAILY;UNTIL=20220819T164500Z'
        exdate:
          - { tzid: 'Europe/Berlin', value: '20220722T184500' }
-         - { tzid: 'Europe/Berlin', value: '20220821T184500' }
-         - { tzid: 'Europe/Berlin', value: '20220822T184500' }
+     - uid: '<random-uuid-2>'
+       dtstart: { tzid: 'Europe/Berlin', value: '20220820T184500' }
+       dtend: { tzid: 'Europe/Berlin', value: '20220820T194500' }
+       rrule: 'FREQ=DAILY;INTERVAL=2'
+       exdate:
+         - { tzid: 'Europe/Berlin', value: '20220822T184500' }
      - uid: '<random-uuid-1>'
        dtstart: { tzid: 'Europe/Berlin', value: '20220729T161500' }
        dtend: { tzid: 'Europe/Berlin', value: '20220729T181500' }
        recurrenceId: { tzid: 'Europe/Berlin', value: '20220729T184500' }
-     - uid: '<random-uuid-1>'
+     - uid: '<random-uuid-2>'
        dtstart: { tzid: 'Europe/Berlin', value: '20220824T161500' }
        dtend: { tzid: 'Europe/Berlin', value: '20220824T181500' }
        recurrenceId: { tzid: 'Europe/Berlin', value: '20220824T184500' }
-     - uid: '<random-uuid-1>'
-       dtstart: { tzid: 'Europe/Berlin', value: '20220825T161500' }
-       dtend: { tzid: 'Europe/Berlin', value: '20220825T181500' }
-       recurrenceId: { tzid: 'Europe/Berlin', value: '20220825T184500' }
    force_deletion_at: 1658421900000
  sender: '@user-id'
  origin_server_ts: 0,
  event_id: '$event-id'
```

## Appendix

### RFC 5545: iCalendar

[RFC 5545][rfc5545-icalendar] describes a generic format to exchange calendar and scheduling information.
The format consists of a global `VCALENDAR` instance that includes one or more `VEVENT`s.
Each `VEVENT` includes properties such as `UID`, `DTSTART`, `DTEND`, `SUNMARY`, or `RRULE` to describe a single event.

> **Example calendar with a single entry**:
>
> ```
> BEGIN:VCALENDAR
> VERSION:2.0
>
> # Only a single event.
> BEGIN:VEVENT
> UID:20220814T172345Z-AF23B2@example.com
> SUMMARY:Daily
> DTSTAMP:20220814T172345Z
> DTSTART:20220815T100000Z
> DTEND:20220815T111500Z
> END:VEVENT
>
> END:VCALENDAR
> ```

The `RRULE` property describes how a meeting is repeated.

> **Example calendar with a single entry that repeats daily for ten times**:
>
> ```
> BEGIN:VCALENDAR
> VERSION:2.0
>
> # This happens daily for ten times at 10am UTC.
> BEGIN:VEVENT
> UID:20220814T172345Z-AF23B2@example.com
> SUMMARY:Daily
> DTSTAMP:20220814T172345Z
> DTSTART:20220815T100000Z
> DTEND:20220815T111500Z
> RRULE:FREQ=DAILY;COUNT=10
> END:VEVENT
>
> END:VCALENDAR
> ```

For calendar events, it is crucial to not create date and time values in UTC time but in the correct timezone.
This is especially important to correctly consider daylight saving times in recurring events.

> **Example calendar with a single entry that repeats daily for ten times in a defined timezone**:
>
> ```
> BEGIN:VCALENDAR
> VERSION:2.0
>
> # This happens daily for ten times at 10am Berlin time.
> # It will correctly consider DST changes.
> # -> It is always on 10am Berlin time.
> BEGIN:VEVENT
> UID:20220814T172345Z-AF23B2@example.com
> SUMMARY:Daily
> DTSTAMP:20220814T172345Z
> DTSTART;TZID=Europe/Berlin:20220815T100000
> DTEND;TZID=Europe/Berlin:20220815T111500
> RRULE:FREQ=DAILY;COUNT=10
> END:VEVENT
>
> END:VCALENDAR
> ```

Selected events can be skipped in a recurrence rule by excluding them from the series.

> **Example calendar with a single entry that repeats daily except on one day**:
>
> ```
> BEGIN:VCALENDAR
> VERSION:2.0
>
> # This happens daily for ten times at 10am Berlin time, except on the 18th August.
> BEGIN:VEVENT
> UID:20220814T172345Z-AF23B2@example.com
> SUMMARY:Daily
> DTSTAMP:20220814T172345Z
> DTSTART;TZID=Europe/Berlin:20220815T100000
> DTEND;TZID=Europe/Berlin:20220815T111500
> RRULE:FREQ=DAILY;COUNT=10
> EXDATE;TZID=Europe/Berlin:20220818T100000
> END:VEVENT
>
> END:VCALENDAR
> ```

Selected events can be updated in a recurrence rule by adding a second event that references the series.
Both events use the same `UID` while the override has a `RECURRENCE-ID` that references a single event from the series.

While the `RECURRENCE-ID` is based on the time and timezone of the `DTSTART` property, it is possible to specify it in a different timezone if the value represents the same timestamp in UTC.
In fact, each of `DTSTART`, `DTEND`, `EXDATE`, or `RECURRENCE-ID` could use a different timezone in the same entry.

> **Example calendar with an entry that repeats daily and is moved to a different time on a single day**:
>
> ```
> BEGIN:VCALENDAR
> VERSION:2.0
>
> # This happens daily for ten times at 10am Berlin time.
> BEGIN:VEVENT
> UID:20220814T172345Z-AF23B2@example.com
> SUMMARY:Daily
> DTSTAMP:20220814T172345Z
> DTSTART;TZID=Europe/Berlin:20220815T100000
> DTEND;TZID=Europe/Berlin:20220815T111500
> RRULE:FREQ=DAILY;COUNT=10
> END:VEVENT
>
> # On the 18th August, it should happen at 2pm Berlin time.
> BEGIN:VEVENT
> UID:20220814T172345Z-AF23B2@example.com
> SUMMARY:Daily
> DTSTAMP:20220814T172345Z
> DTSTART;TZID=Europe/Berlin:20220818T140000
> DTEND;TZID=Europe/Berlin:20220818T151500
> RECURRENCE-ID;TZID=Europe/Berlin:20220818T100000
> END:VEVENT
>
> # On the 19th August, it should happen at 10am London time.
> BEGIN:VEVENT
> UID:20220814T172345Z-AF23B2@example.com
> SUMMARY:Daily
> DTSTAMP:20220814T172345Z
> DTSTART;TZID=Europe/London:20220819T100000
> DTEND;TZID=Europe/London:20220819T111500
> RECURRENCE-ID;TZID=Europe/London:20220819T090000
> # equal to:
> # RECURRENCE-ID;TZID=Europe/Berlin:20220819T100000
> # RECURRENCE-ID;TZID=Europe/Moscow:20220819T110000
> # …
> END:VEVENT
>
> END:VCALENDAR
> ```

A series can also be split by ending a previous series early and creating a new one.
Those series are not necessarily connected to each other though this could be done with `RELATES-TO`.

> **Example calendar with two consecutive repeating entries**:
>
> ```
> BEGIN:VCALENDAR
> VERSION:2.0
>
> # This happens daily at 10am Berlin time until the 19th August.
> BEGIN:VEVENT
> UID:20220814T172345Z-AF23B2@example.com
> SUMMARY:Daily
> DTSTAMP:20220814T172345Z
> DTSTART;TZID=Europe/Berlin:20220815T100000
> DTEND;TZID=Europe/Berlin:20220815T111500
> # UNTIL is preferrably defined in UTC
> RRULE:FREQ=DAILY;UNTIL=20220819T080000Z
> END:VEVENT
>
> # Beginning from the 20th August, this happens daily at 11am Berlin time.
> BEGIN:VEVENT
> UID:20220814T172345Z-BD52A8@example.com
> SUMMARY:Daily
> DTSTAMP:20220814T172345Z
> DTSTART;TZID=Europe/Berlin:20220820T110000
> DTEND;TZID=Europe/Berlin:20220820T121500
> RRULE:FREQ=DAILY
> END:VEVENT
>
> END:VCALENDAR
> ```

### Open-Xchange

There are detailed information about the modeling of meetings in Open-Xchange in the [documentation][ox-implementation-details].
Here are some findings:

- Date-time values are stored as a tuple of:
  ```
  DateTimeData {
    value (string, optional): A date-time value without timezone information as specified in rfc 5545 chapter 3.3.5. E.g. "20170708T220000" ,
    tzid (string, optional): A timezone identifier. E.g. "America/New_York"
  }
  ```
- The recurrence rule is stored as a `RRULE` string.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->

[ox-implementation-details]: https://documentation.open-xchange.com/7.10.6/middleware/calendar/implementation_details.html
[rfc5545-icalendar]: https://www.rfc-editor.org/rfc/rfc5545
[rfc5545-rrule]: https://www.rfc-editor.org/rfc/rfc5545#section-3.8.5.3
