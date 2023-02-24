FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1

ADD build /usr/share/nginx/html/

# Allow loading images from the home server.
ENV CSP_IMG_SRC="\${REACT_APP_HOME_SERVER_URL}"

# Allow loading images from the home server.
ENV CSP_CONNECT_SRC="\${REACT_APP_API_BASE_URL}"
