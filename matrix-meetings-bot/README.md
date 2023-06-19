# NeoDateFix Bot

A Matrix bot to create meeting rooms with customizable settings.
The bot is used for every action we can not directly perform from the widget via the Widget API.
It also provides a REST API to integrate with third party services.

## Getting Started

There are two ways to setup the NeoDateFix widget using the bot:

> **Warning**: The bot currently doesn't support encrypted rooms.

1. You can invite the bot into your room, the bot then creates a private chat that explains to further steps.
2. You can start a private chat with the bot and it will setup the chat to contain the widget.

> **Warning**: If the bot has problems setting up the widget, make sure that the bot has the right permissions in the room (e.g. moderator)

### Available Commands

In a private chat-room you can use the following commands:

- `!meeting help`: shows all available commands.
- `!meeting lang <en|de>` Change bot's language in this room
- `!meeting detail` Show the manual about NeoDateFix widget setup in the room
- `!meeting setup` Adds a NeoDateFix widget to the room
- `!meeting status` Check the ability to add the NeoDateFix widget

### Available Scripts

In the project directory, you can run:

- `yarn start`: Start the bot for development.
- `yarn build`: Build the production version of the bot.
- `yarn test`: Watch all files for changes and run tests.
- `yarn tsc`: Check TypeScript types for errors in the widget.
- `yarn lint`: Run eslint on the bot.
- `yarn depcheck`: Check for missing or unused dependencies.
- `yarn translate`: Update translation files from code.
- `yarn generate-disclaimer`: Generates license disclaimer and include it in the build output.
- `yarn docker:build`: Builds a container from the output of `yarn build` and `yarn generate-disclaimer`.
