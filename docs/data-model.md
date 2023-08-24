# Data Format

“NeoDateFix” is an application to create and manage video conference meetings in the Element messenger.
Technically, it supports the following core features:

1. Schedule video conference meetings as new Matrix rooms.
2. Create meeting rooms for recurring meetings.
3. Be able to share a public link to the room to invite other participants.
4. Enabled selected widgets that should be used in the meeting rooms (ex: whiteboard, polls, notepad, …).
5. Create breakout sessions rooms to split the participants of a meeting into subrooms.
6. Provide an API to external applications to create meetings e.g. from a Groupware application.

The application consists of different components:

1. A bot that uses the Matrix Bot SDK to create and manage meeting rooms.
2. A widget that uses the Matrix Widget API to interact with the bot and to read the meeting information from the Matrix rooms.
3. (optional) An application service that prunes meeting rooms from the Homeserver if they are no longer used.

```
                ┌──────────────────────────────────────┐                ┌─────────────┐
                │                                      │ Matrix Bot SDK │             │
                │          Matrix Homeserver           ├───────────────►│ Room Reaper │
                │                                      │ ◄──────────────┤             │
                └───┬────────────────────────────────┬─┘                └─────────────┘
                  ▲ │  xxxxxx<send commands>xxxxx  ▲ │
Client-Server API │ │  x                        x  │ │ Matrix Bot SDK
                  │ │  x                        x  │ │
                  │ ▼  xxxxxxx                  v  │ ▼
           ┌──────┴────────┐ x             ┌───────┴────────┐
           │               │ x             │                │
           │ Matrix Client │ x             │ NeoDateFix Bot │
           │               │ x             │                │
           └────────┬──────┘ x             └────────────────┘
                  ▲ │ xxxxxxxx                     ▲ ▲
Matrix Widget API │ │ x                            │ │
                  │ │ x                   HTTP API │ │ HTTP API
                  │ ▼ ^                            │ │
         ┌────────┴──────────┐                     │ │
         │                   │                     │ │
         │ NeoDateFix Widget │◄────────────────────┘ │
         │                   │    <read config>      │ <send commands>
         └───────────────────┘                       │
                                                     │
                                           ┌─────────┴────────────┐
                                           │                      │
                                           │ External Application │
                                           │                      │
                                           └──────────────────────┘
```

## Meeting Room Model

Each meeting is represented by a meeting room.
All events of a recurrent meetings happen in the same meeting room.
The rooms have a room type of `net.nordeck.meetings.meeting` or `net.nordeck.meetings.breakoutsession`.

- `m.room.create`: `content.type` identities if the room is a meeting or a breakout session.
- `m.room.name`: the name of the meeting.
- `m.room.topic`: the description of the meeting.
- `m.room.member`: the participants of the meeting.
- `m.room.tombstone`: if present, the meeting was canceled/deleted.
- `m.room.power_levels`: tells if users are allowed to post messages in the meeting channel.
- `net.nordeck.meetings.metadata`: the information about when the meeting(s) happen.
- `m.widget` (`im.vector.modular.widget`): the installed widgets (`state_key === widget-id`).
- `m.space.parent`: the parent room that created this meeting (ex: `management <- meeting` | `meeting <- breakout`).
- `m.space.chlid`: the child rooms of this room (ex: `management -> meeting` | `meeting -> breakout`).

### `net.nordeck.meetings.metadata` (State Event)

Holds the state of a single meeting that couldn't be stored in events that are defined by the Matrix Specification.

#### Content

| Field                           | Type      | Description                                                                                      |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `creator`                       | `string`  | The ID of the user that created the meeting.                                                     |
| `calendar[]`                    | —         | A list of events that happen in this room.                                                       |
| `calendar[].uid`                | `string`  | The uid of the entry.                                                                            |
| `calendar[].dtstart`            | —         | The start date and time.                                                                         |
| `calendar[].dtstart.tzid`       | `string`  | The timezone of the value.                                                                       |
| `calendar[].dtstart.value`      | `string`  | The date and time in the iCalendar format (ex: `20220101T100000`).                               |
| `calendar[].dtend`              | —         | The end date and time.                                                                           |
| `calendar[].dtend.tzid`         | `string`  | The timezone of the value.                                                                       |
| `calendar[].dtend.value`        | `string`  | The date and time in the iCalendar format (ex: `20220101T100000`).                               |
| `calendar[].rrule`              | `string?` | The recurring rule in the iCalendar format (ex: `FREQ=DAILY;COUNT=5`).                           |
| `calendar[].exdate[]`           | —`?`      | A list of dates which are excluded from the recurrence rule.                                     |
| `calendar[].exdate[].tzid`      | `string`  | The timezone of the value.                                                                       |
| `calendar[].exdate[].value`     | `string`  | The date and time in the iCalendar format (ex: `20220101T100000`).                               |
| `calendar[].recurrenceId`       | —`?`      | The id of the recurrence entry that this entry replaces.                                         |
| `calendar[].recurrenceId.tzid`  | `string`  | The timezone of the value.                                                                       |
| `calendar[].recurrenceId.value` | `string`  | The date and time in the iCalendar format (ex: `20220101T100000`).                               |
| `force_deletion_at`             | `number?` | The time when the room reaper should delete the room as unix timestamp in milliseconds.          |
| `external_data`                 | —`?`      | Data that might reference to external resources.                                                 |
| `external_data.key`             | `object`  | Each entry should be namespaced with a key.                                                      |
| `start_time`                    | `string?` | (deprecated) The start time as ISO 8601 timestamp. Used as `dtstart` if `calendar` is missing.   |
| `end_time`                      | `string?` | (deprecated) The end time as ISO 8601 timestamp. Used as `dtend` if `calendar` is missing.       |
| `auto_deletion_offset`          | `number?` | (deprecated) Minutes after `end_time` when the room is deleted. Replaced by `force_deletion_at`. |

#### Example

```json
{
  "type": "net.nordeck.meetings.metadata",
  "sender": "@user-id",
  "state_key": "",
  "content": {
    "creator": "@user-id",
    "calendar": {
      "uid": "65a755a8-dec0-4732-ac4a-2f4a926ad027",
      "dtstart": { "tzid": "Europe/Berlin", "value": "20221026T160000" },
      "dtend": { "tzid": "Europe/Berlin", "value": "20221026T170000" }
    },
    "force_deletion_at": 1577844000000,
    "external_data": {
      "com.example": {
        "custom": "data"
        // ...
      }
      // ...
    }
  },
  "event_id": "$event-id",
  "room_id": "!room-id",
  "origin_server_ts": 1666789726421
}
```

## Meeting Room Hierarchy

The meeting rooms form a hierarchy and can (optionally) have a parent room.
This parent room was used to create the meeting and can be interpreted as being the “calendar” or “management room“ that this meeting is part of.

> While meetings don't need to have a parent room, breakout sessions don't work without a parent.

```
               ┌──────────────┐
               │  Management  │
               │    <Room>    │
               └───────────┬──┘
                   ▲       │
    m.space.parent │       │ m.space.child
      (optional)   │       │  (optional)
                   │       ▼
    ┌──────────────┴─────────────────────┐
    │              Meeting               │
    │               <Room>               │
    │ type: net.nordeck.meetings.meeting │
    └──────────────────────┬─────────────┘
                   ▲       │
                   │       │ m.space.child
    m.space.parent │       │
                   │       ▼
┌──────────────────┴─────────────────────────┐
│              Breakout Session              │
│                   <Room>                   │
│ type: net.nordeck.meetings.breakoutsession │
└────────────────────────────────────────────┘
```

## Room setup

The planner view of the NeoDateFix widget can be installed to a room in different ways.

### 1:1 chat

The user can initiate a 1:1 chat with the meetings bot user.
The bot will accept the invitation, add the NeoDateFix widget, and change the widget layout to show it full screen.

### Welcome Workflow

The user can invite the meetings bot into a normal matrix room.
The bot will accept the invitation and will invite the user into a separete “Help” room.
This room contains more information on how to setup the NeoDateFix widget.

## Bot API

The meetings bot provides two kinds of APIs:

1. it reacts to room events in a room where the bot user joined.
2. it provides a HTTP API that is authorized with a client access token or an OpenID token.

### Room Messages (RPC-over-Matrix)

The meeting can instruct the bot to perform different actions:

- Create a new meeting.
- Update the meeting details.
- Add or remove widgets from a meeting room.
- Invite or remove participants of a meeting room.
- Update the messaging permissions in the room.
- Close a meeting.
- Create new breakout sessions.
- Send a message to all breakout sessions of this meeting.

The bot will acknowledge each command with a `m.reaction` message.
The reaction can be ✅ or ❌ and can be used to tell whether the action succeeded or failed.

This is an example on the message transfer when creating a meeting room:

```
                      Meetings                               Homeserver        Meetings
                       Widget                                                    Bot
                                                                  │
                         │                                        │               │
          "Create Room"  │                                        │               │
          ─────────────►┌┴┐                                       │               │
   xxx                  │ │ net.nordeck.meetings.meeting.create   │               │
  x   x                 │ ├─────────────────────────────────────►┌┴┐              │
  x   x                 │ │            ($req-event-id)           │ ├────────────►┌┴┐
  x   x                 │ │                                      │ │             │ │
   xxx                  │ │                                      │ │  Setup room │ │
    x                   │ │                                      │ │◄────────────┤ │
    x                   │ │                                      │ │             │ │
  xxxxx                 │ │                                      │ │◄────────────┤ │
 xx x xx                │ │                                      │ │        ...  │ │
xx  x  xx               │ │                                      │ │             │ │
    x                   │ │                                      │ │             │ │
    x                   │ │                                      │ │             │ │
  xx xx                 │ │                                      │ │  m.reaction │ │
 xx   xx                │ │               m.reaction             │ │◄────────────┴┬┘
 x     x     "OK"       │ │◄─────────────────────────────────────┴┬┘              │
          ◄─────────────┴┬┘      (relates_to: $req-event-id)      │               │
                         │                                        │               │
```

#### `net.nordeck.meetings.meeting.create` (Room Event)

Instructs the bot to create a new meeting.
Creates a child meeting for the given room ID taken from the room event.

##### Content

| Field                                | Type        | Description                                                                                     |
| ------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------- |
| `data`                               | —           | The payload of this event.                                                                      |
| `data.title`                         | `string`    | The title of the meeting.                                                                       |
| `data.description`                   | `string`    | The description of the meeting.                                                                 |
| `data.calendar[]`                    | —           | A list of events that happen in this room.                                                      |
| `data.calendar[].uid`                | `string`    | The uid of the entry.                                                                           |
| `data.calendar[].dtstart`            | —           | The start date and time.                                                                        |
| `data.calendar[].dtstart.tzid`       | `string`    | The timezone of the value.                                                                      |
| `data.calendar[].dtstart.value`      | `string`    | The date and time in the iCalendar format (ex: `20220101T100000`).                              |
| `data.calendar[].dtend`              | —           | The end date and time.                                                                          |
| `data.calendar[].dtend.tzid`         | `string`    | The timezone of the value.                                                                      |
| `data.calendar[].dtend.value`        | `string`    | The date and time in the iCalendar format (ex: `20220101T100000`).                              |
| `data.calendar[].rrule`              | `string?`   | The recurring rule in the iCalendar format (ex: `FREQ=DAILY;COUNT=5`).                          |
| `data.calendar[].exdate[]`           | —`?`        | A list of dates which are excluded from the recurrence rule.                                    |
| `data.calendar[].exdate[].tzid`      | `string`    | The timezone of the value.                                                                      |
| `data.calendar[].exdate[].value`     | `string`    | The date and time in the iCalendar format (ex: `20220101T100000`).                              |
| `data.calendar[].recurrenceId`       | —`?`        | The id of the recurrence entry that this entry replaces.                                        |
| `data.calendar[].recurrenceId.tzid`  | `string`    | The timezone of the value.                                                                      |
| `data.calendar[].recurrenceId.value` | `string`    | The date and time in the iCalendar format (ex: `20220101T100000`).                              |
| `data.widget_ids[]`                  | `string[]?` | A list of widget IDs to be added (get IDs from `/v1/api/widgets/list`).                         |
| `data.participants[]`                | —`?`        | A list of users to invite to the meeting.                                                       |
| `data.participants[].user_id`        | `string`    | The ID of the user.                                                                             |
| `data.participants[].power_level`    | `number?`   | The custom power level of the user. Defaults: `0`. The creator will be `100`.                   |
| `data.messaging_power_level`         | `number?`   | The power level of the messaging power. Defaults: `0`. Prefer to use `0` and `100`.             |
| `data.external_data`                 | —`?`        | Data that might reference to external resources.                                                |
| `data.external_data.key`             | `object`    | Each entry should be namespaced with a key.                                                     |
| `data.enable_auto_deletion`          | `boolean?`  | (deprecated) If `true`, the Room Reaper will delete the meeting after it ends. Default: `true`. |
| `data.start_time`                    | `string?`   | (deprecated) The start time as ISO 8601 timestamp. Skip if `calendar` is defined.               |
| `data.end_time`                      | `string?`   | (deprecated) The end time as ISO 8601 timestamp. Skip if `calendar` is defined.                 |
| `context`                            | —           | The context of this event.                                                                      |
| `context.locale`                     | `string`    | The language of formatted messages as BCP 47 language tag.                                      |
| `context.timezone`                   | `string`    | The timezone in formatted messages as timezone string.                                          |

##### Example

```json
{
  "type": "net.nordeck.meetings.meeting.create",
  "sender": "@user-id",
  "content": {
    "data": {
      "title": "My Meeting",
      "description": "",
      "calendar": {
        "uid": "65a755a8-dec0-4732-ac4a-2f4a926ad027",
        "dtstart": { "tzid": "Europe/Berlin", "value": "20221026T160000" },
        "dtend": { "tzid": "Europe/Berlin", "value": "20221026T170000" }
      },
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

Instructs the bot to update an existing meeting.

##### Content

| Field                                | Type      | Description                                                                       |
| ------------------------------------ | --------- | --------------------------------------------------------------------------------- |
| `data`                               | —         | The payload of this event.                                                        |
| `data.target_room_id`                | `string`  | The id of the meeting that should be updated.                                     |
| `data.title`                         | `string?` | The title of the meeting.                                                         |
| `data.description`                   | `string?` | The description of the meeting.                                                   |
| `data.calendar[]`                    | —`?`      | A list of events that happen in this room.                                        |
| `data.calendar[].uid`                | `string`  | The uid of the entry.                                                             |
| `data.calendar[].dtstart`            | —         | The start date and time.                                                          |
| `data.calendar[].dtstart.tzid`       | `string`  | The timezone of the value.                                                        |
| `data.calendar[].dtstart.value`      | `string`  | The date and time in the iCalendar format (ex: `20220101T100000`).                |
| `data.calendar[].dtend`              | —         | The end date and time.                                                            |
| `data.calendar[].dtend.tzid`         | `string`  | The timezone of the value.                                                        |
| `data.calendar[].dtend.value`        | `string`  | The date and time in the iCalendar format (ex: `20220101T100000`).                |
| `data.calendar[].rrule`              | `string?` | The recurring rule in the iCalendar format (ex: `FREQ=DAILY;COUNT=5`).            |
| `data.calendar[].exdate[]`           | —`?`      | A list of dates which are excluded from the recurrence rule.                      |
| `data.calendar[].exdate[].tzid`      | `string`  | The timezone of the value.                                                        |
| `data.calendar[].exdate[].value`     | `string`  | The date and time in the iCalendar format (ex: `20220101T100000`).                |
| `data.calendar[].recurrenceId`       | —`?`      | The id of the recurrence entry that this entry replaces.                          |
| `data.calendar[].recurrenceId.tzid`  | `string`  | The timezone of the value.                                                        |
| `data.calendar[].recurrenceId.value` | `string`  | The date and time in the iCalendar format (ex: `20220101T100000`).                |
| `data.external_data`                 | —`?`      | Data that might reference to external resources.                                  |
| `data.external_data.key`             | `object`  | Each entry should be namespaced with a key.                                       |
| `data.start_time`                    | `string?` | (deprecated) The start time as ISO 8601 timestamp. Skip if `calendar` is defined. |
| `data.end_time`                      | `string?` | (deprecated) The end time as ISO 8601 timestamp. Skip if `calendar` is defined.   |
| `context`                            | —         | The context of this event.                                                        |
| `context.locale`                     | `string`  | The language of formatted messages as BCP 47 language tag.                        |
| `context.timezone`                   | `string`  | The timezone in formatted messages as timezone string.                            |

##### Example

```json
{
  "type": "net.nordeck.meetings.meeting.update",
  "sender": "@user-id",
  "content": {
    "data": {
      "target_room_id": "!room-id",
      "title": "My Meeting",
      "description": "",
      "calendar": {
        "uid": "65a755a8-dec0-4732-ac4a-2f4a926ad027",
        "dtstart": { "tzid": "Europe/Berlin", "value": "20221026T160000" },
        "dtend": { "tzid": "Europe/Berlin", "value": "20221026T170000" }
      }
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

#### `net.nordeck.meetings.meeting.widgets.handle` (Room Event)

Instructs the bot to change what widgets are enabled.

##### Content

| Field                 | Type       | Description                                                                    |
| --------------------- | ---------- | ------------------------------------------------------------------------------ |
| `data`                | —          | The payload of this event.                                                     |
| `data.target_room_id` | `string`   | The id of the meeting that should be updated.                                  |
| `data.widget_ids[]`   | `string[]` | A list of widget IDs to be changed (get IDs from `/v1/api/widgets/list`).      |
| `data.add`            | `boolean`  | If `true`, the listed widgets will be added. If `false`, they will be removed. |
| `context`             | —          | The context of this event.                                                     |
| `context.locale`      | `string`   | The language of formatted messages as BCP 47 language tag.                     |
| `context.timezone`    | `string`   | The timezone in formatted messages as timezone string.                         |

##### Example

```json
{
  "type": "net.nordeck.meetings.meeting.widgets.handle",
  "sender": "@user-id",
  "content": {
    "data": {
      "target_room_id": "!room-id",
      "widgets": ["jitsi"],
      "add": false
    },
    "context": {
      "locale": "en-US",
      "timezone": "Europe/Berlin"
    }
  },
  "event_id": "$event-id",
  "room_id": "!room-id", // can also be "!parent-room-id"
  "origin_server_ts": 1666799817961
}
```

#### `net.nordeck.meetings.meeting.participants.handle` (Room Event)

Instructs the bot to invite or kick participants into the meeting.

##### Content

| Field                 | Type       | Description                                                                   |
| --------------------- | ---------- | ----------------------------------------------------------------------------- |
| `data`                | —          | The payload of this event.                                                    |
| `data.target_room_id` | `string`   | The id of the meeting that should be updated.                                 |
| `data.userIds[]`      | `string[]` | A list of users to invite to the meeting.                                     |
| `data.invite`         | `boolean`  | If `true`, the listed users will be invited. If `false`, they will be kicked. |
| `context`             | —          | The context of this event.                                                    |
| `context.locale`      | `string`   | The language of formatted messages as BCP 47 language tag.                    |
| `context.timezone`    | `string`   | The timezone in formatted messages as timezone string.                        |

##### Example

```json
{
  "type": "net.nordeck.meetings.meeting.participants.handle",
  "sender": "@user-id",
  "content": {
    "data": {
      "target_room_id": "!room-id",
      "userIds": ["@other-user-id"],
      "invite": true
    },
    "context": {
      "locale": "en-US",
      "timezone": "Europe/Berlin"
    }
  },
  "event_id": "$event-id",
  "room_id": "!room-id", // can also be "!parent-room-id"
  "origin_server_ts": 1666800401568
}
```

#### `net.nordeck.meetings.meeting.change.message_permissions` (Room Event)

Instructs the bot to update the messaging permissions in the meeting room.

##### Content

| Field                        | Type     | Description                                                          |
| ---------------------------- | -------- | -------------------------------------------------------------------- |
| `data`                       | —        | The payload of this event.                                           |
| `data.target_room_id`        | `string` | The id of the meeting that should be updated.                        |
| `data.messaging_power_level` | `number` | The power level of the messaging power. Prefer to use `0` and `100`. |
| `context`                    | —        | The context of this event.                                           |
| `context.locale`             | `string` | The language of formatted messages as BCP 47 language tag.           |
| `context.timezone`           | `string` | The timezone in formatted messages as timezone string.               |

##### Example

```json
{
  "type": "net.nordeck.meetings.meeting.participants.handle",
  "sender": "@user-id",
  "content": {
    "data": {
      "target_room_id": "!room-id",
      "messaging_power_level": 100
    },
    "context": {
      "locale": "en-US",
      "timezone": "Europe/Berlin"
    }
  },
  "event_id": "$event-id",
  "room_id": "!room-id", // can also be "!parent-room-id"
  "origin_server_ts": 1666800522128
}
```

#### `net.nordeck.meetings.meeting.close` (Room Event)

Instructs the bot to close an existing meeting or breakout session.
If the meeting has subrooms (i.e. breakout sessions), they will also be closed.

Rooms can be closed in two ways:

1. `tombstone`: A tombstone is set that links to the parent room.
   This only works when the room was created by a [`net.nordeck.meetings.meeting.create`](#netnordeckmeetingsmeetingcreate-room-event) event or when [`/v1/meeting/create`](#post-v1meetingcreate) was called with a `parent_room_id`.
2. `kick_all_participants`: All participants are kicked from the room. The room is archived by the home server.

##### Content

| Field                 | Type      | Description                                                |
| --------------------- | --------- | ---------------------------------------------------------- |
| `data`                | —         | The payload of this event.                                 |
| `data.target_room_id` | `string`  | The id of the meeting that should be closed.               |
| `data.method`         | `string?` | The method to close the room. Default: `tombstone`.        |
| `context`             | —         | The context of this event.                                 |
| `context.locale`      | `string`  | The language of formatted messages as BCP 47 language tag. |
| `context.timezone`    | `string`  | The timezone in formatted messages as timezone string.     |

##### Example

```json
{
  "type": "net.nordeck.meetings.meeting.close",
  "sender": "@user-id",
  "content": {
    "data": {
      "target_room_id": "!room-id",
      "method": "kick_all_participants"
    },
    "context": {
      "locale": "en-US",
      "timezone": "Europe/Berlin"
    }
  },
  "event_id": "$event-id",
  "room_id": "!room-id", // can also be "!parent-room-id"
  "origin_server_ts": 1666800722108
}
```

#### `net.nordeck.meetings.breakoutsessions.create` (Room Event)

Instructs the bot to create new breakout sessions.
Creates breakout sessions for the given room ID taken from the room event.

##### Content

| Field                                      | Type        | Description                                                                        |
| ------------------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| `data`                                     | —           | The payload of this event.                                                         |
| `data.description`                         | `string`    | The description of the breakout sessions.                                          |
| `data.start_time`                          | `string`    | The start time of the sessions as ISO 8601 timestamp.                              |
| `data.end_time`                            | `string`    | The end time of the sessions as ISO 8601 timestamp.                                |
| `data.widget_ids[]`                        | `string[]?` | A list of widget IDs to be enabled (get IDs from `/v1/api/widgets/list`).          |
| `data.enable_auto_deletion`                | `boolean?`  | If `true`, the Room Reaper will delete the meeting after it ends. Default: `true`. |
| `data.groups[]`                            | —           | A list of sessions to create.                                                      |
| `data.groups[].title`                      | `string`    | The title of the meeting.                                                          |
| `data.groups[].participants[]`             | —           | A list of users to invite to the meeting.                                          |
| `data.groups[].participants[].user_id`     | `string`    | The ID of the user.                                                                |
| `data.groups[].participants[].power_level` | `number?`   | The custom power level of the user. Defaults: `0`. The creator will be `100`.      |
| `context`                                  | —           | The context of this event.                                                         |
| `context.locale`                           | `string`    | The language of formatted messages as BCP 47 language tag.                         |
| `context.timezone`                         | `string`    | The timezone in formatted messages as timezone string.                             |

##### Example

```json
{
  "type": "net.nordeck.meetings.breakoutsessions.create",
  "sender": "@user-id",
  "content": {
    "data": {
      "description": "",
      "start_time": "2022-10-26T16:00:00+02:00",
      "end_time": "2022-10-26T17:00:00+02:00",
      "widget_ids": ["jitsi", "poll"],
      "groups": [
        {
          "title": "Session 1",
          "participants": [{ "user_id": "@user-id-1" }]
        },
        {
          "title": "Session 2",
          "participants": [{ "user_id": "@user-id-2" }]
        }
      ]
    },
    "context": {
      "locale": "en-US",
      "timezone": "Europe/Berlin"
    }
  },
  "event_id": "$event-id",
  "room_id": "!room-id",
  "origin_server_ts": 1666801138375
}
```

#### `net.nordeck.meetings.sub_meetings.send_message` (Room Event)

Instructs the bot to send a message to all breakout sessions of this meeting.

##### Content

| Field                 | Type     | Description                                                                             |
| --------------------- | -------- | --------------------------------------------------------------------------------------- |
| `data`                | —        | The payload of this event.                                                              |
| `data.target_room_id` | `string` | The id of the parent meeting that has breakout sessions.                                |
| `data.message`        | `string` | The message to send to all breakout sessions that are children of the `target_room_id`. |
| `context`             | —        | The context of this event.                                                              |
| `context.locale`      | `string` | The language of formatted messages as BCP 47 language tag.                              |
| `context.timezone`    | `string` | The timezone in formatted messages as timezone string.                                  |

##### Example

```json
{
  "type": "net.nordeck.meetings.breakoutsessions.create",
  "sender": "@user-id",
  "content": {
    "data": {
      "target_room_id": "!room-id",
      "description": "Please finish you discussions and return to the main meeting room."
    },
    "context": {
      "locale": "en-US",
      "timezone": "Europe/Berlin"
    }
  },
  "event_id": "$event-id",
  "room_id": "!room-id",
  "origin_server_ts": 1666801456248
}
```

### HTTP API

There are different endpoints to create or update meetings via the HTTP API and to get other configurations.

#### `POST /v1/meeting/create`

Instructs the bot to create a new meeting.

##### Request Content

| Field                        | Type        | Description                                                                         |
| ---------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `parent_room_id`             | `string?`   | The id of room that should be a parent for the meeting.                             |
| `title`                      | `string`    | The title of the meeting.                                                           |
| `description`                | `string`    | The description of the meeting.                                                     |
| `start_time`                 | `string`    | The start time of the meeting as ISO 8601 timestamp.                                |
| `end_time`                   | `string`    | The end time of the meeting as ISO 8601 timestamp.                                  |
| `widget_ids[]`               | `string[]?` | A list of widget IDs to be enabled (get IDs from `/v1/api/widgets/list`).           |
| `participants[]`             | —`?`        | A list of users to invite to the meeting.                                           |
| `participants[].user_id`     | `string`    | The ID of the user.                                                                 |
| `participants[].power_level` | `number?`   | The custom power level of the user. Defaults: `0`. The creator will be `100`.       |
| `messaging_power_level`      | `number?`   | The power level of the messaging power. Defaults: `0`. Prefer to use `0` and `100`. |
| `enable_auto_deletion`       | `boolean?`  | If `true`, the Room Reaper will delete the meeting after it ends. Default: `true`.  |
| `external_data`              | —`?`        | Data that might reference to external resources.                                    |
| `external_data.key`          | `object`    | Each entry should be namespaced with a key.                                         |

##### Response Content

| Field         | Type      | Description                          |
| ------------- | --------- | ------------------------------------ |
| `room_id`     | `string?` | The id of the room that was created. |
| `meeting_url` | `string`  | The URL to open the meeting room.    |

##### Example

```tsx
const response = await fetch('http://meetings-bot.local/v1/meeting/create', {
  method: 'POST',
  header: {
    authorization: '...',
    // The language of formatted messages as BCP 47 language tag
    'accept-language': 'en-US',
    // The timezone in formatted messages as timezone string.
    'x-timezone': 'Europe/Berlin',
  },
  body: {
    title: 'My Meeting',
    description: '',
    start_time: '2022-10-26T16:00:00+02:00',
    end_time: '2022-10-26T17:00:00+02:00',
    widget_ids: ['jitsi', 'poll'],
    participants: [{ user_id: '@user-id' }],
  },
});

console.log(await response.json());
// { room_id: "!room-id", meeting_url: "https://matrix.to/#/!room-id" }
```

#### `PUT /v1/meeting/update`

Instructs the bot to update an existing.

##### Request Content

| Field               | Type      | Description                                          |
| ------------------- | --------- | ---------------------------------------------------- |
| `target_room_id`    | `string`  | The id of the meeting that should be updated.        |
| `title`             | `string?` | The title of the meeting.                            |
| `description`       | `string?` | The description of the meeting.                      |
| `start_time`        | `string?` | The start time of the meeting as ISO 8601 timestamp. |
| `end_time`          | `string?` | The end time of the meeting as ISO 8601 timestamp.   |
| `external_data`     | —`?`      | Data that might reference to external resources.     |
| `external_data.key` | `object`  | Each entry should be namespaced with a key.          |

##### Response Content

No response content.

##### Example

```tsx
const response = await fetch('http://meetings-bot.local/v1/meeting/update', {
  method: 'PUT',
  header: {
    authorization: '...',
    // The language of formatted messages as BCP 47 language tag
    'accept-language': 'en-US',
    // The timezone in formatted messages as timezone string.
    'x-timezone': 'Europe/Berlin',
  },
  body: {
    target_room_id: '!room-id',
    title: 'My Meeting',
    description: '',
    start_time: '2022-10-26T16:00:00+02:00',
    end_time: '2022-10-26T17:00:00+02:00',
  },
});

// no response data
```

#### `POST /v1/meeting/close`

Instructs the bot to close an existing meeting or breakout session.
If the meeting has subrooms (i.e. breakout sessions), they will also be closed.

Rooms can be closed in two ways:

1. `tombstone`: A tombstone is set that links to the parent room.
   This only works when the room was created by a [`net.nordeck.meetings.meeting.create`](#netnordeckmeetingsmeetingcreate-room-event) event or when [`/v1/meeting/create`](#post-v1meetingcreate) was called with a `parent_room_id`.
2. `kick_all_participants`: All participants are kicked from the room. The room is archived by the home server.

##### Request Content

| Field            | Type      | Description                                         |
| ---------------- | --------- | --------------------------------------------------- |
| `target_room_id` | `string`  | The id of the meeting that should be closed.        |
| `method`         | `string?` | The method to close the room. Default: `tombstone`. |

##### Response Content

No response content.

##### Example

```tsx
const response = await fetch('http://meetings-bot.local/v1/meeting/close', {
  method: 'POST',
  header: {
    authorization: '...',
    // The language of formatted messages as BCP 47 language tag
    'accept-language': 'en-US',
    // The timezone in formatted messages as timezone string.
    'x-timezone': 'Europe/Berlin',
  },
  body: {
    target_room_id: '!room-id',
    method: 'kick_all_participants',
  },
});

// no response data
```

#### `GET /v1/widget/list`

Get a list of all widgets that can be selected for a meeting.

##### Response Content

| Field     | Type     | Description                |
| --------- | -------- | -------------------------- |
| `[]`      | —        | An array of known widgets. |
| `[].id`   | `string` | The ID of the widget.      |
| `[].name` | `string` | The name to show to users. |

##### Example

```tsx
const response = await fetch('http://meetings-bot.local/v1/widget/list', {
  header: {
    authorization: '...',
  },
});

console.log(await response.json());
// [{ id: "jitsi", name: "Video Conference" }]
```

#### `GET /v1/config`

Get a list of configuration values.

##### Response Content

| Field                           | Type      | Description                                                                 |
| ------------------------------- | --------- | --------------------------------------------------------------------------- |
| `homeserver`                    | `string`  | The homeserver that the bot is connected to.                                |
| `jitsiDialInEnabled`            | `boolean` | If `true`, jitsi dial in is enabled.                                        |
| `openXchangeMeetingUrlTemplate` | `string?` | A template url to generate an URL to Open-Xchange based on `external_data`. |

##### Example

```tsx
const response = await fetch('http://meetings-bot.local/v1/config', {
  header: {
    authorization: '...',
  },
});

console.log(await response.json());
// [{ homeserver: "https://matrix-client.matrix.org" }]
```

#### `GET /v1/meeting/{roomId}/sharingInformation`

Get the dial in information for the current meeting.
Only use this endpoint if `jitsiDialInEnabled` is `true` in [`/v1/config`](#get-v1config).

##### Response Content

| Field                  | Type      | Description                                               |
| ---------------------- | --------- | --------------------------------------------------------- |
| `jitsi_dial_in_number` | `string?` | The phone number to dial into the Jitsi conference.       |
| `jitsi_pin`            | `number?` | The pin that needs to be entered when calling dialing in. |

##### Example

```tsx
const response = await fetch(
  'http://meetings-bot.local/v1/meeting/!my-room:homeserver.local/sharingInformation',
  { header: { authorization: '...' } },
);

console.log(await response.json());
// [{ jitsi_dial_in_number: "01234 567890", jitsi_pin: 7604 }]
```
