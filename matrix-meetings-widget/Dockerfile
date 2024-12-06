FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1.1.0@sha256:85b4bf57747788ef1ac3472a826502219be20e7b1fffff6193ad4c0b0ccbc42d

ADD build /usr/share/nginx/html/

# Allow loading images from the home server.
ENV CSP_IMG_SRC="\${REACT_APP_HOME_SERVER_URL}"

# Allow loading images from the home server.
ENV CSP_CONNECT_SRC="\${REACT_APP_API_BASE_URL}"
