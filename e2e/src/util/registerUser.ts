/*
 * Copyright 2022 Nordeck IT + Consulting GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fetch from 'cross-fetch';
import { createHmac } from 'crypto';
import { getSynapseRegistrationSecret, getSynapseUrl } from './config';

export type Credentials = {
  accessToken: string;
  userId: string;
  deviceId: string;
  homeServer: string;
};

export type User = {
  credentials: Credentials;
  username: string;
  password: string;
  displayName: string;
};

export async function registerUser(displayName: string): Promise<User> {
  const url = `${getSynapseUrl()}/_synapse/admin/v1/register`;
  const usernamePrefix = displayName.toLowerCase();
  const id = Math.round(Math.random() * 100000);
  const username = `${usernamePrefix}-${id}`;
  const password = 'Pl4ywr1ght';

  const nonceResp = await fetch(url);
  const { nonce } = (await nonceResp.json()) as { nonce: string };
  const mac = createHmac('sha1', getSynapseRegistrationSecret())
    .update(`${nonce}\0${username}\0${password}\0notadmin`)
    .digest('hex');

  const createResp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      nonce,
      username,
      password,
      mac,
      admin: false,
      displayname: displayName,
    }),
  });
  const credentials = (await createResp.json()) as {
    access_token: string;
    user_id: string;
    device_id: string;
    home_server: string;
  };
  return {
    credentials: {
      accessToken: credentials.access_token,
      userId: credentials.user_id,
      deviceId: credentials.device_id,
      homeServer: credentials.home_server,
    },
    username,
    password,
    displayName,
  };
}
