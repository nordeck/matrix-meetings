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

import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { registerUser } from '../../util';

let container: StartedTestContainer | undefined;

export async function startMatrixMeetingsBot({
  baseURL = 'http://localhost:3000',
  homeserverUrl,
  elementWebUrl,
  containerImage = 'nordeck/matrix-meetings-bot',
}: {
  baseURL: string | undefined;
  homeserverUrl: string;
  elementWebUrl: string;
  containerImage?: string;
}): Promise<{
  botUsername: string;
  botDisplayName: string;
  botUrl: string;
}> {
  console.log(`Starting meetings bot… (${containerImage})`);

  // use a static host port because we can't access the dynamically assigned
  // port before we start the container.
  const staticHostPort = 31625;

  const botDisplayName = 'Bot';
  const user = await registerUser(botDisplayName);

  // provide information about the bot user that we can't provide upfront. This
  // is especially relevant if we e2e test a widget run with `yarn start`.
  const botParam = `&meetings_bot_base_url=http://localhost:${staticHostPort}&meetings_bot_user_id=${user.credentials.userId}`;

  container = await new GenericContainer(containerImage)
    .withEnvironment({
      TZ: 'Europe/Berlin',
      HOMESERVER_URL: homeserverUrl,
      ACCESS_TOKEN: user.credentials.accessToken,
      MATRIX_LINK_SHARE: `${elementWebUrl}/#/room/`,
      MEETINGWIDGET_URL: `${baseURL}/#/?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language${botParam}`,
      BREAKOUT_SESSION_WIDGET_URL: `${baseURL}/#/?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language${botParam}`,
      MEETINGWIDGET_COCKPIT_URL: `${baseURL}/cockpit/#/?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language${botParam}`,
      OPEN_XCHANGE_MEETING_URL_TEMPLATE:
        'https://webmail-hostname/appsuite/#app=io.ox/calendar&id={{id}}&folder={{folder}}',
      AUTO_DELETION_OFFSET: '60',
      ENABLE_GUEST_USER_POWER_LEVEL_CHANGE: 'true',
      ENABLE_E2EE: 'true',
      LOG_LEVEL: 'debug',
    })
    .withCopyFilesToContainer([
      {
        source: require.resolve('./default_events.json'),
        target: '/app/conf/default_events.json',
      },
    ])
    .withExposedPorts({ container: 3000, host: staticHostPort })
    .withWaitStrategy(Wait.forLogMessage(/Bot is running as @/))
    .start();

  const botUrl = `http://${container.getHost()}:${container.getMappedPort(
    3000,
  )}`;

  console.log('Meetings bot running at', botUrl);

  return { botUsername: user.username, botDisplayName, botUrl };
}

export async function stopMatrixMeetingsBot() {
  if (container) {
    await container.stop();

    console.log('Stopped meetings bot');
  }
}
