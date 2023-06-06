/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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
import { getSynapseUrl } from './config';
import { User } from './registerUser';

export async function deactivateUser(user: User): Promise<void> {
  const url = `${getSynapseUrl()}/_matrix/client/v3/account/deactivate`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${user.credentials.accessToken}`,
    },
    body: JSON.stringify({
      auth: {
        password: user.password,
        type: 'm.login.password',
        user: user.username,
      },
    }),
  });

  if (resp.status !== 200) {
    throw new Error('Cannot deactivate user');
  }
}
