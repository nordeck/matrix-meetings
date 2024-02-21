#/bin/sh

# Get the login token
TOKEN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"type":"m.login.password","user":"'${USERTOCREATE}'","password":"'${BOT_PASSWORD}'"}' "${HOMESERVER}/_matrix/client/r0/login")

# Extract the access token from the response
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ "$ACCESS_TOKEN" != "null" ]; then
    echo "Login successful. Access token: $ACCESS_TOKEN"
else
    echo "Login failed. Check your credentials and try again."
fi

# Add it to the env file so it can be used by the bot
echo "ACCESS_TOKEN=$ACCESS_TOKEN" > /work-dir/.env
