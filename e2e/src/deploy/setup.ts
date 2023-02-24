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

import { FullConfig } from '@playwright/test';
import { startElementWeb } from './elementWeb';
import { startMatrixMeetingsBot } from './matrixMeetingsBot';
import { startSynapse } from './synapse';

// TODO: migrate this later to k3d?

export default async function globalSetup(config: FullConfig) {
  const { synapseUrl, synapseHostUrl, registrationSecret } =
    await startSynapse();
  process.env.SYNAPSE_URL = synapseUrl;
  process.env.SYNAPSE_REGISTRATION_SECRET = registrationSecret;

  const { elementWebUrl } = await startElementWeb({
    homeserverUrl: synapseUrl,
  });
  process.env.ELEMENT_WEB_URL = elementWebUrl;

  const { botUsername, botDisplayName, botUrl } = await startMatrixMeetingsBot({
    baseURL: config.webServer?.url,
    homeserverUrl: synapseHostUrl,
    elementWebUrl,
    containerImage: process.env.BOT_CONTAINER_IMAGE,
  });
  process.env.BOT_USERNAME = botUsername;
  process.env.BOT_DISPLAY_NAME = botDisplayName;
  process.env.BOT_URL = botUrl;
}
