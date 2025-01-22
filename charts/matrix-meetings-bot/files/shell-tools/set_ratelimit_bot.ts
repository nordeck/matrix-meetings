import process from 'node:process';

if (!process.env.ADMIN_ACCESS_TOKEN) {
  throw Error('ADMIN_ACCESS_TOKEN needs to be set');
}
if (!process.env.HOMESERVER) {
  throw Error('HOMESERVER needs to be set');
}
if (!process.env.HOMESERVER_URL) {
  throw Error('HOMESERVER_URL needs to be set');
}
if (!process.env.USERTOCREATE) {
  throw Error('USERTOCREATE needs to be set');
}

// Make a request to the Synapse Admin API
// Reference: https://element-hq.github.io/synapse/latest/admin_api/user_admin_api.html#set-ratelimit
const mxid = `@${process.env.USERTOCREATE}:${process.env.HOMESERVER}`;
const url = new URL(`/_synapse/admin/v1/users/${encodeURIComponent(mxid)}/override_ratelimit`, process.env.HOMESERVER_URL);
const res = await fetch(url, {
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${process.env.ADMIN_ACCESS_TOKEN}`,
  },
}).catch(err => {
  console.error(err);
  console.error('Network error');
  process.exit(1);
  throw Error();
});

if (!res.ok) {
  console.error(res);
  console.error(`HTTP error ${res.status}`);
}

// Validate the homeserver's response
const data = await res.json() as unknown;
if (
  typeof data !== 'object' ||
  data === null ||
  !('messages_per_second' in data) ||
  data['messages_per_second'] !== 0 ||
  !('burst_count' in data) ||
  data['burst_count'] !== 0
) {
  console.error(data);
  throw Error('Server did not confirm the expected rate limit.');
}
