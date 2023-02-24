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

export function getBotUsername(): string {
  if (!process.env.BOT_USERNAME) {
    throw new Error('BOT_USERNAME unavailable');
  }

  return process.env.BOT_USERNAME;
}

export function getBotDisplayName(): string {
  if (!process.env.BOT_DISPLAY_NAME) {
    throw new Error('BOT_DISPLAY_NAME unavailable');
  }

  return process.env.BOT_DISPLAY_NAME;
}

export function getBotUrl(): string {
  if (!process.env.BOT_URL) {
    throw new Error('BOT_URL unavailable');
  }

  return process.env.BOT_URL;
}

export function getElementWebUrl(): string {
  if (!process.env.ELEMENT_WEB_URL) {
    throw new Error('ELEMENT_WEB_URL unavailable');
  }

  return process.env.ELEMENT_WEB_URL;
}

export function getSynapseUrl(): string {
  if (!process.env.SYNAPSE_URL) {
    throw new Error('SYNAPSE_URL unavailable');
  }

  return process.env.SYNAPSE_URL;
}

export function getSynapseRegistrationSecret(): string {
  if (!process.env.SYNAPSE_REGISTRATION_SECRET) {
    throw new Error('SYNAPSE_REGISTRATION_SECRET unavailable');
  }

  return process.env.SYNAPSE_REGISTRATION_SECRET;
}
