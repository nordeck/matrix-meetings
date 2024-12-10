#/bin/sh

# Get Static Client Access Token
ACCESS_TOKEN=$(curl -k -s \
  -u "$MAS_CLIENT_ID:$MAS_CLIENT_SECRET" \
  -d "grant_type=client_credentials&scope=urn:mas:admin urn:mas:graphql:*" \
  $MAS_URL/oauth2/token | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"\([^"]*\)"/\1/')

# Get Persistent Token
TOKEN_RESPONSE=$(curl -X POST -k -s \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{ \
    \"query\": \"mutation CreateSession(\$userId: String!, \$scope: String!) { createOauth2Session(input: {userId: \$userId, permanent: true, scope: \$scope}) { accessToken refreshToken } }\", \
    \"variables\": { \
        \"userId\": \"user:$USER_ID\", \
        \"scope\": \"urn:matrix:org.matrix.msc2967.client:api:*\" \
    } \
  }" \
  $MAS_URL/graphql)

PERSISTENT_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"\([^"]*\)"/\1/')

if [ -n "$PERSISTENT_TOKEN" ] && [ "$PERSISTENT_TOKEN" != "null" ]; then
  echo "Persistent Token: $PERSISTENT_TOKEN"
else
  echo "Unable to get a Persistent Token for $USERTOCREATE."
  exit 1
fi

# Add it to the env file so it can be used by the bot
echo "ACCESS_TOKEN=$PERSISTENT_TOKEN" > /work-dir/.env
