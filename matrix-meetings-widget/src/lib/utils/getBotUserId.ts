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

import { extractRawWidgetParameters } from '@matrix-widget-toolkit/api';
import { getEnvironment } from '@matrix-widget-toolkit/mui';

/**
 * Provide the username of the bot from the configuration.
 *
 * @returns the username of the bot.
 */
export function getBotUserId(): string | undefined {
  // also support reading the user from the parameters as provided by the e2e test
  const rawUsername =
    extractRawWidgetParameters()['meetings_bot_user_id'] ??
    getEnvironment('REACT_APP_BOT_USER_ID');

  if (typeof rawUsername === 'string') {
    return rawUsername;
  }

  return undefined;
}

/**
 * Check if a user is a bot.
 *
 * @param userId - the user ID to check
 * @returns if true, the user ID is the bot, or the user ID of the bot is not configured.
 */
export function isBotUser(userId: string): boolean {
  const botUserId = getBotUserId();
  return Boolean(botUserId) && userId === botUserId;
}
