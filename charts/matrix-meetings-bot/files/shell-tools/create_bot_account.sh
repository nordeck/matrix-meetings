#/bin/sh
set -x;
while [ $(curl -k -sw '%{http_code}' "$HOMESERVER" -o /dev/null) -ne 302 ]; do
  sleep 1;
done
response=$(curl -k --write-out '%{http_code}' --silent --output /dev/null -X GET --header 'Accept: application/json' "$HOMESERVER/_matrix/client/r0/register/available?username=$USERTOCREATE")
if [ "$response" = 400 ]; then
    echo "Bot user already exists"
else
  echo "Will create User $USERTOCREATE on $HOMESERVER"
  register_new_matrix_user -a -u "$USERTOCREATE" -p "$BOT_PASSWORD" -c /data/homeserver.yaml "$HOMESERVER"
fi
exit 0
