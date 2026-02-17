FROM aquasec/trivy:latest@sha256:1c78ed1ef824ab8bb05b04359d186e4c1229d0b3e67005faacb54a7d71974f73 AS scanner

# Copy yarn.lock to run SBOM scan
COPY --from=root yarn.lock /tmp
RUN trivy fs --format spdx-json --scanners "license" /tmp/yarn.lock > /tmp/sbom.spdx.json

FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1.2.1@sha256:4484168c740ecce8f6639d9d2c37b89077eae1a86555d59de4cfeef8a0a34b12

ADD --chown=nginx:nginx dist /usr/share/nginx/html/

# Add SBOM to the public folder
COPY --from=scanner --chown=nginx:nginx /tmp/sbom.spdx.json /usr/share/nginx/html/sbom.spdx.json

# Allow loading images from the home server.
ENV CSP_IMG_SRC="\${REACT_APP_HOME_SERVER_URL}"

# Allow loading images from the home server.
ENV CSP_CONNECT_SRC="\${REACT_APP_API_BASE_URL}"
