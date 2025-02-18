#!/bin/sh

USER=$(psql  -X -A -w -t   -c "select user_id from ratelimit_override where user_id='@$USERTOCREATE:$SERVER'")
if [ "$USER" = 400 ]; then
    echo "Limit is already set" 
    exit 0
else
psql -X -A -w -t   -c "insert into ratelimit_override values ('@$USERTOCREATE:$SERVER', 0, 0)"
fi
exit 0

