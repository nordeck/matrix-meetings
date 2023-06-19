# End-to-end tests

End-to-end tests for the components in this repository.

## Getting Started

### Prerequisites

Running the e2e tests requires Docker to be installed.

### Running Tests

The e2e tests are testing the widget and the bot.
Therefore you need both to perform the tests.

1. **NeoDateFix Bot**: By default, it uses the image that was built by running `yarn docker:build` in the root folder of this repository.
   Building the container at least once is required to run the tests.
   You can build the container by running `yarn build`, followed by `yarn docker:build`. Alternatively, you can set the `BOT_CONTAINER_IMAGE` environment variable to use a custom container image for the NeoDateFix Bot.
2. **NeoDateFix Widget**: You can either use the container created using `yarn build` as above, or test against your local copy of the widget.
   To test against the local copy, run `yarn dev`.

Afterwards you can run `yarn e2e` to perform the tests.

### Common Issues

> Browser was not installed. Invoke 'Install Playwright Browsers' action to install missing browsers.

If you encounter this message, make sure to install the Browsers via `npx playwright install`.

### Available Scripts

In the project directory, you can run:

- `yarn lint`: Run eslint on the widget.
- `yarn depcheck`: Check for missing or unused dependencies.
- `yarn e2e`: Runs the end-to-end tests in a single browser. Pass `--debug` to enable the debug UI.
