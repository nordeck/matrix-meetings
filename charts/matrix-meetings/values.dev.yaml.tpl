# Use this file to add configurations for the dev environment and the PR deployments

matrix-meetings-widget:
  env:
    - name: REACT_APP_BOT_USER_ID
      value: '@meetings-bot:synapse.dev.nordeck.io'
    - name: REACT_APP_DISPLAY_ALL_MEETINGS
      value: 'true'

matrix-meetings-bot:
  settings:
    additionalEnv:
      - name: HOMESERVER_URL
        value: 'https://synapse.dev.nordeck.io'
      - name: MATRIX_LINK_SHARE
        value: 'https://element.dev.nordeck.io/#/'
      - name: BOT_DISPLAYNAME
        value: 'NeoDateFix Bot${PR_SUFFIX}'
      - name: CALENDAR_ROOM_NAME
        value: 'NeoDateFix${PR_SUFFIX}'
      - name: LOG_LEVEL
        value: 'info'
      - name: AUTO_DELETION_OFFSET
        value: '60'
      - name: ENABLE_CRYPTO
        value: 'true'
