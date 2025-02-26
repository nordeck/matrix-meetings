# Matrix Meetings Widget Charts

This repository contains Helm charts for deploying the Matrix Meetings Widget and Bot. The primary chart is `matrix-meetings`, which combines both the widget and the bot for a complete deployment.

## Charts

### matrix-meetings

The `matrix-meetings` chart is the main chart that combines both the Matrix Meetings Widget and the Matrix Meetings Bot. This chart is designed to be the primary way to deploy the entire solution.

#### Requirements for the bot

The bot requires the following environment variables to work:

- `HOMESERVER_URL`: The URL of the Matrix homeserver.
- `ACCESS_TOKEN`: The access token of the Matrix user for the bot.

You can also use the `init` section to automatically create and log in a bot user if you provide a secret named "meetings-bot-credentials" with the key "password" present. However, the `HOMESERVER_URL` must still be provided and must match `init.homeserver`.

To set the required values, you need to customize the `values.yaml` file of the charts. Here is an example of how to set the required values:

```yaml
matrix-meetings-bot:
  settings:
    additionalEnv:
      - name: HOMESERVER_URL
        value: 'https://matrix-client.matrix.org'
      - name: ACCESS_TOKEN
        secretKeyRef:
          name: matrix-credentials
          key: access-token

  init:
    homeserver: 'matrix.org'
    homeserverUrl: 'https://matrix-client.matrix.org'
    username: bot-user
```

For more details, please check the values.yaml file of the charts.
