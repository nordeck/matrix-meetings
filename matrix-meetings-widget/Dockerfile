FROM aquasec/trivy:latest AS scanner

# Copy yarn.lock to run SBOM scan
COPY --from=root yarn.lock /tmp
RUN trivy fs --format spdx-json --scanners "license" /tmp/yarn.lock > /tmp/sbom.spdx.json

FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1.1.0@sha256:85b4bf57747788ef1ac3472a826502219be20e7b1fffff6193ad4c0b0ccbc42d

ADD --chown=nginx:nginx dist /usr/share/nginx/html/

# Add SBOM to the public folder
COPY --from=scanner --chown=nginx:nginx /tmp/sbom.spdx.json /usr/share/nginx/html/sbom.spdx.json

# Allow loading images from the home server.
ENV CSP_IMG_SRC="\${REACT_APP_HOME_SERVER_URL}"

# Allow loading images from the home server.
ENV CSP_CONNECT_SRC="\${REACT_APP_API_BASE_URL}"
