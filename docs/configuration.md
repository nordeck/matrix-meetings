# Configuration

Runtime configuration can be performed via environment variables.

- You can configure the environment variables at the container for production
- You can configure an [`.env` file](https://create-react-app.dev/docs/adding-custom-environment-variables/#adding-development-environment-variables-in-env) for local development.

## Environment Variables

### Widget Container

These environment variables apply to the widget container:

```sh
# the base url of the NeoDateFix bot API
REACT_APP_API_BASE_URL=http://meetings-widget-bot.example.com

# the userid of the bot user
REACT_APP_BOT_USER_ID=@meetings-bot:example.com

# the base url of the matrix homeserver
REACT_APP_HOME_SERVER_URL=https://synapse.example.com

# the base url of the element client
REACT_APP_ELEMENT_URL=https://element.example.com

# optional - the primary color of the theme
REACT_APP_PRIMARY_COLOR=#b0131d

# optional - the preselected length of a new meeting
REACT_APP_DEFAULT_MEETING_MINUTES=60

# optional - the preselected length of a new breakoutsession
REACT_APP_DEFAULT_BREAKOUT_SESSION_MINUTES=15

# optional - the full minutes a preselected start time is rounded to. 10:37 becomes 10:45
REACT_APP_DEFAULT_MINUTES_TO_ROUND=15

# optional - the power level that should be set as "no messaging allowed". Defaults to 100.
REACT_APP_MESSAGING_NOT_ALLOWED_POWER_LEVEL=100

# optional - shows meetings from all rooms
REACT_APP_DISPLAY_ALL_MEETINGS=true
```

### Bot Container

These environment variables apply to the bot container:

```sh
# the base url of the matrix homeserver
HOMESERVER_URL=https://synapse.example.com

# the access token of the matrix user of the bot
ACCESS_TOKEN=syt_...

# the url to the NeoDateFix widget that will be added to the planning room
MEETINGWIDGET_URL='http://meetings-widget.example.com/#/?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language&matrix_device_id=$org.matrix.msc3819.matrix_device_id'

# optional - the name of the NeoDateFix widget that will be added to the planning room
MEETINGWIDGET_NAME='NeoDateFix'

# the url to the cockpit widget that will be added to the meeting rooms
MEETINGWIDGET_COCKPIT_URL='http://meetings-widget.example.com/cockpit/#/?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language&matrix_device_id=$org.matrix.msc3819.matrix_device_id'

# optional - the name of the cockpit widget that will be added to the meeting rooms
MEETINGWIDGET_COCKPIT_NAME='NeoDateFix Details'

# the url to the breakout sessions widget that will be added to the meeting rooms
BREAKOUT_SESSION_WIDGET_URL='http://meetings-widget.example.com/#/?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language&matrix_device_id=$org.matrix.msc3819.matrix_device_id'

# optional - the name of the breakout sessions widget that will be added to the meeting rooms
BREAKOUT_SESSION_WIDGET_NAME='Breakout Sessions'

# optional - the name of the 1:1 chat room, when a user initiates a chat with the bot.
CALENDAR_ROOM_NAME='NeoDateFix'

# optional - the log level (one of silent, fatal, error, warn, info, debug, trace)
LOG_LEVEL=error

# optional - the port on which the bot listens for http connections
PORT=3000

# optional - the number of minutes after the meeting that the meeting should be deleted (example: 60)
AUTO_DELETION_OFFSET=

# optional - a json file that contains an array of state events as initial state for a new meeting room (see section below for examples)
DEFAULT_EVENTS_CONFIG='conf/default_events.json'

# optional - a json file that contains different widget layouts that should be added to the room when certain widgets are activated (see section below for examples)
DEFAULT_WIDGET_LAYOUTS_CONFIG='conf/default_widget_layouts.json'

# optional - if defined, the bot will assign the display name to its user on startup
BOT_DISPLAYNAME=

# optional - the maximum age of matrix events in minutes to be handled by the bot. all older messages are ignored on startup.
MATRIX_SERVER_EVENT_MAX_AGE_MINUTES=5

# optional - the folder where the bot stores local data like a persisted sessions
STORAGE_FILE_DATA_PATH=storage

# optional - enables the bot to create end-to-end encrypted rooms for meetings and control rooms
ENABLE_CRYPTO=false

# optional - the folder where the bot stores local encryption data. This is relative to the storage path above, ie 'storage/crypto'
CRYPTO_DATA_PATH=crypto

# optional - the json file with the session information inside the storage folder
STORAGE_FILE_FILENAME=bot.json

# optional - the base URL used to form links to a room. might be set to a known element installation with ex: 'https://elment.example.com/#/room/'
MATRIX_LINK_SHARE='https://matrix.to/#/'

# optional - if true, the bot uses a filter in the sync-process to limit the number of events that need to be processed to reduce the risk of getting a "limited" sync where the homeserver skips events that will then not be registered by the bot.
MATRIX_FILTER_APPLY=true

# optional - configure the maximum number of events in the sync response. use a higher limit to reduce the risk of getting a "limited" sync where the homeserver skips events that will then not be registered by the bot.
MATRIX_FILTER_TIMELINE_LIMIT=50

# optional - enables workflow to invite the user into a private room and receive commands to help the user with adding the NeoDateFix widget to the room. this is triggered as soon as the bot user is invited into a room.
ENABLE_WELCOME_WORKFLOW=true

# optional - default locale for bot-to-user communication
WELCOME_WORKFLOW_DEFAULT_LOCALE=en

# optional - migrate old control rooms that were created by a older version of the bot to a 1:1 calendar room.
ENABLE_CONTROL_ROOM_MIGRATION=false

# optional - create private error rooms with the user who sent a command to the bot if an error occurred
ENABLE_PRIVATE_ROOM_ERROR_SENDING=true

# optional - configure a url where the bot can request dial-in numbers (ex: http://jitsi-dialin.example.com/dialin.json)
JITSI_DIAL_IN_JSON_URL=

# optional - configure a url where the bot can request a pin to be entered when calling the jitsi dial-in number for a specific conference. Use {base32_room_name} as a template parameter (ex: "http://jitsi-dialin.example.com/pin?conference={base32_room_name}")
JITSI_PIN_URL=

# optional - configure a Open-Xchange link that can be used to open the calendar room in their calendar application. use the {{id}} and {{folder}} as a template parameter (ex: "http://ox.example.com/appsuite/#app=io.ox/calendar&id={{id}}&folder={{folder}}")
OPEN_XCHANGE_MEETING_URL_TEMPLATE=

# optional - enables changing of power level of the guest users when they join the room. This case requires that the user's default power level is higher than the guest user's and that the bot has rights to change power levels, otherwise no change occurs.
ENABLE_GUEST_USER_POWER_LEVEL_CHANGE=false

# optional - configure guest user id prefix that is used to match guest users.
GUEST_USER_PREFIX=@guest-

# optional - configure guest user power level
GUEST_USER_DEFAULT_POWER_LEVEL=0

# optional - if true, bot deletes guest user power level from power level event when guest user leaves the room. It makes sure power level is cleaned up if guest user is deactivated later.
GUEST_USER_DELETE_POWER_LEVEL_ON_LEAVE=true

# optional - configure a default room version configured for synapse. It is used to make room version specific power levels changes when rooms are created the by the bot. It supports room version 12. It defaults to room 10 version behaviour. The room creator gets power level 150 when the room version is 12.
DEFAULT_ROOM_VERSION=
#
```

#### `DEFAULT_EVENTS_CONFIG`

The `DEFAULT_EVENTS_CONFIG` JSON file contains room and state events that the bot sends into a meeting room when it is created.
This can be used to e.g. automatically enable certain widgets to the room.
Note that all `im.vector.modular.widgets` events can also be enabled/disabled later via the [API](./data-model.md#bot-api).

The content of the events can be templated using [mustache templates](https://www.npmjs.com/package/mustache).
The following content is available:

- `room_id`: the ID of the current room.
- `base32_room_id`: the base32 encoded room id as needed for Jitsi.
- `base32_room_id50`: the base32 encoded room id with max character limit of 50 as needed for Etherpad.
- `title`: the title of the meeting (=the room name).
- `uuid`: a random UUID.
- `encodeURIComponent()`: a function to encode any value to make it URL-safe  
  Usage: `{{#encodeURIComponent}}my-text{{/encodeURIComponent}}`

##### Content

| Field                      | Type      | Description                                   |
| -------------------------- | --------- | --------------------------------------------- |
| `state_events[]`           | —         | A list of state events.                       |
| `state_events[].type`      | `string`  | The type of event.                            |
| `state_events[].state_key` | `string`  | The state key of the event.                   |
| `state_events[].optional`  | `boolean` | If true, this widget is not added by default. |
| `state_events[].content`   | `object`  | The content of the event.                     |
| `room_events[]`            | —         | The list of room events.                      |
| `room_events[].type`       | `string`  | The type of event.                            |
| `room_events[].content`    | `object`  | The content of the event.                     |

##### Example

```json
{
  "state_events": [
    {
      "type": "m.room.power_levels",
      "content": { "events": { "net.nordeck.meetings.metadata": 100 } }
    },
    {
      "type": "m.room.history_visibility",
      "content": { "history_visibility": "shared" }
    },
    {
      "type": "m.room.guest_access",
      "content": { "guest_access": "forbidden" }
    },
    { "type": "m.room.join_rules", "content": { "join_rule": "public" } },
    {
      "type": "im.vector.modular.widgets",
      "state_key": "jitsi",
      "optional": true,
      "content": {
        "type": "jitsi",
        "url": "https://app.element.io/jitsi.html?confId={{#encodeURIComponent}}{{base32_room_id}}{{/encodeURIComponent}}#conferenceId=$conferenceId&domain=$domain&isAudioOnly=$isAudioOnly&displayName=$matrix_display_name&avatarUrl=$matrix_avatar_url&userId=$matrix_user_id&roomId=$matrix_room_id&roomName=$roomName&theme=$theme{{#data.auth}}&auth={{data.auth}}{{/data.auth}}",
        "name": "Video Conference",
        "data": {
          "domain": "meet.jit.si",
          "conferenceId": "{{base32_room_id}}",
          "roomName": "{{title}}",
          "isAudioOnly": true
        }
      }
    }
  ],
  "room_events": []
}
```

#### `DEFAULT_WIDGET_LAYOUTS_CONFIG`

The `DEFAULT_WIDGET_LAYOUTS_CONFIG` JSON file contains different widget layout configurations for different widget combinations that are installed into a meeting room.
It will update the `io.element.widgets.layout` when creating or updating the meeting room.

##### Content

| Field                        | Type       | Description                                                                                                   |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `[]`                         | —          | A list of configurations.                                                                                     |
| `[].widgetIds`               | `string[]` | The ids of the active widgets when this configuration should be applied.                                      |
| `[].layouts`                 | –          | The layout of each widget by `state_key`.                                                                     |
| `[].layouts.[key].container` | `string`   | The location of the widget (`top` or `center`).                                                               |
| `[].layouts.[key].index`     | `number`   | The index of the widget in the container.                                                                     |
| `[].layouts.[key].width`     | `number`   | Percentage (integer) for relative width of the container to consume. The total width should not exceed `100`. |
| `[].layouts.[key].height`    | `number`   | Percentage (integer) for relative height of the container.                                                    |

##### Example

```json
[
  {
    "widgetIds": ["jitsi"],
    "layouts": {
      "jitsi": {
        "container": "center",
        "index": 0,
        "width": 100,
        "height": 100
      }
    }
  }
  {
    "widgetIds": ["jitsi", "poll"],
    "layouts": {
      "jitsi": {
        "container": "top",
        "index": 0,
        "width": 25,
        "height": 100
      },
      "poll": {
        "container": "top",
        "index": 1,
        "width": 75,
        "height": 100
      }
    }
  }
]
```

### Customization

More environment variables for UI customization [@matrix-widget-toolkit/mui](https://www.npmjs.com/package/@matrix-widget-toolkit/mui#customization).

## Synapse Configuration

The widget requires some specific homeserver configuration changes so it has user
directory search for all users enabled and the information needed to render invitations properly.

```yaml
user_directory:
  # Users that are not known to each other can be found.
  search_all_users: true

# Controls for the state that is shared with users who receive an invite
# to a room
room_prejoin_state:
  # Additional state event types to share with users when they are invited
  # to a room.
  #
  # By default, this list is empty (so only the default event types are shared).
  #
  additional_event_types:
    - m.space.parent
    - net.nordeck.meetings.metadata
    - m.room.power_levels
```
