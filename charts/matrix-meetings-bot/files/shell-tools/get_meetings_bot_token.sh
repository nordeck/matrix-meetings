#/bin/sh

TOKEN=$(psql  -X -A -w -t   -c "select token from access_tokens where user_id='@$USERTOCREATE:$SERVER'")
echo "ACCESS_TOKEN=$TOKEN" > /work-dir/.env
