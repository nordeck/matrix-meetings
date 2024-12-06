# NeoDateFix

![Build](https://github.com/nordeck/matrix-meetings/workflows/CI/badge.svg)
[![Matrix](https://img.shields.io/matrix/nordeck%3Amatrix.org)](https://matrix.to/#/#nordeck:matrix.org)

A solution to organizing meetings in [Matrix](https://matrix.org/) chat rooms and video conferences.
Users can plan meetings, configure options like widgets for meeting rooms, invite participants, perform breakout sessions, and see their calendar.
Meeting metadata is stored in Matrix rooms.
It also provides an API to create meetings from third party services, like Open-Xchange.

<table>
  <tr>
    <td>
      <img src="./docs/img/calendar-list.png" alt="Calendar List">
    </td>
    <td>
      <img src="./docs/img/calendar-month.png" alt="Calendar Month">
    </td>
    <td>
      <img src="./docs/img/create-meeting.png" alt="Create Meeting">
    </td>
    <td>
      <img src="./docs/img/conference.png" alt="Conference">
    </td>
  </tr>
</table>

The widgets has multiple parts:

- [**NeoDateFix Widget**](./matrix-meetings-widget/): Matrix widget for managing and viewing the calendar.
- [**NeoDateFix Bot**](./matrix-meetings-bot): Matrix bot for creating meeting rooms.
- [**End-to-end tests**](./e2e): An end-to-end test suite for the Matrix widget and bot for creating meeting rooms.

## Getting Started

Development on the widget happens at [GitHub](https://github.com/nordeck/matrix-meetings).

### How to Contribute

Please take a look at our [Contribution Guidelines](https://github.com/nordeck/.github/blob/main/docs/CONTRIBUTING.md).

Check the following section on how to setup a development environment for the widget:

### Requirements

You need to install Node.js (`>= 20.0.0`, prefer using an LTS version) and run
`yarn` to work on this package.
The minimal Element version to use this widget is `1.11.29`.

### Installation

After checkout, run `yarn install` to download the required dependencies

> **Warning** Do not use `npm install` when working with this package.

### Configuration

Rename the provided `.env.local.default` to `.env.local` in the widget or bot folder and fill it with your configuration.
For a list of available options, see [Configuration](./docs/configuration.md).

### Running the Widget Locally

Follow the [instructions to run the widget locally](https://github.com/nordeck/matrix-widget-toolkit/tree/main/example-widget-mui#running-the-widget-locally).

Once running, you can visit the widget URL (`http(s)://localhost:3000/`) and follow the instructions on how to add it to a room within Element Web.

### Available Scripts

In the project directory, you can run:

- `yarn dev`: Start the widget for development.
- `yarn start`: Start the widget for development with a self-signed HTTPS certificate.
- `yarn build`: Run the build step in all projects.
- `yarn test`: Watch all files for changes and run tests of the widget.
- `yarn lint`: Run eslint in all projects.
- `yarn prettier:write`: Run prettier on all files to format them.
- `yarn depcheck`: Check for missing or unused dependencies.
- `yarn generate-disclaimer`: Generates license disclaimer and include it in the build output.
- `yarn deduplicate`: Deduplicate dependencies in the `yarn.lock` file.
- `yarn changeset`: Generate a changeset that provides a description of a
  change.
- `yarn docker:build`: Builds all containers from the output of `yarn build` and `yarn generate-disclaimer`.
- `yarn e2e`: Runs the end-to-end tests in a single browser. Pass `--debug` to enable the debug UI. Run `yarn docker:build` first.

### Running the bot locally

Follow the instructions in the [README.md](https://github.com/nordeck/matrix-meetings/tree/main/matrix-meetings-bot/README.md) file of the [matrix-meetings-bot](https://github.com/nordeck/matrix-meetings/tree/main/matrix-meetings-bot/) folder.

### Versioning

This package uses automated versioning.
Each change should be accompanied by a specification of the impact (`patch`, `minor`, or `major`) and a description of the change.
Use `yarn changeset` to generate a new changeset for a pull request.
Learn more in the [`.changeset` folder](./.changeset).

Once the change is merged to `main`, a “Version Packages” pull request will be created.
As soon as the project maintainers merged it, the package will be released and the container is published.

### Architecture Decision Records

We use [Architecture Decision Records (ADR)s](https://github.com/nordeck/matrix-widget-toolkit/blob/main/docs/adrs/adr001-use-adrs-to-document-decisions.md) to document decisions for our software.
You can find them at [`/docs/adrs`](./docs/adrs/).

## Deployment

You can run the widget using Docker:

```sh
docker run --rm -p 8080:8080 ghcr.io/nordeck/matrix-meetings-widget:latest
```

Our docker image supports customizing the nginx config by supplying additional config files.
For example, this allows running the image in an IPv4-only environment, as demonstrated at <https://github.com/nordeck/matrix-widget-toolkit/tree/main/containers/widget-server#custom-listen-directive>

You can run the bot using Docker:

```sh
docker run --rm -p 3000:3000 ghcr.io/nordeck/matrix-meetings-bot:latest
```

We also provide [HELM charts](./charts/).

## Verify the Container Images

The container images releases are signed by [cosign](https://github.com/sigstore/cosign) using identity-based ("keyless") signing and transparency.
Execute the following command to verify the signature of a container image:

```sh
cosign verify \
--certificate-identity-regexp https://github.com/nordeck/matrix-meetings/.github/workflows/publish-release-bot.yml@refs/tags/@nordeck/matrix-meetings-bot \
--certificate-oidc-issuer https://token.actions.githubusercontent.com \
ghcr.io/nordeck/matrix-meetings-bot:<version> | jq
```

```sh
cosign verify \
--certificate-identity-regexp https://github.com/nordeck/matrix-meetings/.github/workflows/publish-release-widget.yml@refs/tags/@nordeck/matrix-meetings-widget \
--certificate-oidc-issuer https://token.actions.githubusercontent.com \
ghcr.io/nordeck/matrix-meetings-widget:<version> | jq
```

## License

This project is licensed under [Apache 2.0 license](./LICENSE).

The disclaimer for other OSS components can be accessed via the `/NOTICE.txt` endpoint.
The list of dependencies and their licenses are also available in a machine readable format at `/usr/share/nginx/html/licenses.json` in the container image.

## Sponsors

<p align="center">
   <a href="https://www.dphoenixsuite.de/"><img src="./docs/logos/dphoenixsuitelogo.svg" alt="dPhoenixSuite" width="20%"></a>
   &nbsp;&nbsp;&nbsp;&nbsp;
   <a href="https://www.dataport.de/"><img src="./docs/logos/dataportlogo.png" alt="Dataport" width="20%"></a>
   &nbsp;&nbsp;&nbsp;&nbsp;
   <a href="https://gitlab.opencode.de/bmi/opendesk/info"><img src="./docs/logos/opendesklogo.png" alt="openDesk" width="20%"></a>
   &nbsp;&nbsp;&nbsp;&nbsp;
   <a href="https://www.nordeck.net/"><img src="./docs/logos/nordecklogo.png" alt="Nordeck" width="20%"></a>
</p>

This project is part of the [dPhoenixSuite by Dataport](https://www.dphoenixsuite.de/) and the [openDesk Sovereign Workplace](https://gitlab.opencode.de/bmi/opendesk/info) by [BMI](https://www.bmi.bund.de/DE/startseite/startseite-node.html)/[ZenDiS](https://zendis.de).
