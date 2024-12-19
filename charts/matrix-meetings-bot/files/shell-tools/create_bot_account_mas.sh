#/bin/sh
set -x;

while [ $(curl -k -sw '%{http_code}' "$HOMESERVER" -o /dev/null) -ne 302 ]; do
  sleep 1;
done

# Get Static Client Access Token
ACCESS_TOKEN=$(curl -k -s \
  -u "$MAS_CLIENT_ID:$MAS_CLIENT_SECRET" \
  -d "grant_type=client_credentials&scope=urn:mas:admin" \
  $MAS_URL/oauth2/token | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"\([^"]*\)"/\1/')

echo "Bot User:\t$USERTOCREATE"

# Create User
USER_ID=$(curl -X POST -k -s \
  -d "{\"username\": \"$USERTOCREATE\"}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  $MAS_URL/api/admin/v1/users | grep -o '"id":"[^"]*"' | sed 's/"id":"\([^"]*\)"/\1/')

if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo "Bot User ID:\t$USER_ID"
else
  echo "Error or user $USERTOCREATE already exists."
  return 1
fi

export USER_ID

# Set Password
SET_PASSWORD_RESPONSE=$(curl -X POST -k -s \
  -d "{\"password\": \"$BOT_PASSWORD\", \"skip_password_check\": true}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  $MAS_URL/api/admin/v1/users/$USER_ID/set-password)

if [ -z "$SET_PASSWORD_RESPONSE" ]; then
  echo "Set-Password:\tsuccess"
else
  echo "Set-Password:\t$SET_PASSWORD_RESPONSE"
fi
