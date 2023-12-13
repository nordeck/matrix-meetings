# NeoDateFix

![Build](https://github.com/nordeck/matrix-meetings/workflows/CI/badge.svg)

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

## Demo

Till now there is no officially hosted demo of the widget.
See the [Deployment](#deployment) section on how you can host the widget on your own.

## Getting Started

Development on the widget happens at [GitHub](https://github.com/nordeck/matrix-meetings).

### How to Contribute

Please take a look at our [Contribution Guidelines](https://github.com/nordeck/.github/blob/main/docs/CONTRIBUTING.md).
Check the following steps to develop for the widget:

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
Visit the widget url follow the further instructions: `http(s)://localhost:3000/`

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

Yon can run the widget using Docker:

```sh
docker run --rm -p 8080:8080 ghcr.io/nordeck/matrix-meetings-widget:latest
```

Yon can run the bot using Docker:

```sh
docker run --rm -p 3000:3000 ghcr.io/nordeck/matrix-meetings-bot:latest
```

We also provide [HELM charts](./charts/).

## Verify the Container Images

The container images releases are signed by [cosign](https://github.com/sigstore/cosign) using identity-based ("keyless") signing and transparency.
Execute the following command to verify the signature of a container image:

```sh
cosign verify \
--certificate-identity-regexp https://github.com/nordeck/matrix-meetings-bot/.github/workflows/publish-release.yml@refs/tags/v \
--certificate-oidc-issuer https://token.actions.githubusercontent.com \
ghcr.io/nordeck/matrix-meetings-bot:<version> | jq
```

```sh
cosign verify \
--certificate-identity-regexp https://github.com/nordeck/matrix-meetings-widget/.github/workflows/publish-release.yml@refs/tags/v \
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
   <a href="https://www.nordeck.net/"><img src="./docs/logos/nordecklogo.png" alt="Nordeck" width="20%"></a>
</p>

This project is part of the [dPhoenixSuite by Dataport](https://www.dphoenixsuite.de/).
