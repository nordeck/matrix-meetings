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

import Joi from 'joi';
import { IAppConfiguration } from './IAppConfiguration';

const toBoolean = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  switch (value && value.toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return defaultValue;
  }
};

// overload the function to clarify the return values
function toNumber(value: string | undefined): number | undefined;
function toNumber(value: string | undefined, defaultValue: number): number;
function toNumber(
  value: string | undefined,
  defaultValue?: number,
): number | undefined {
  return Number.isNaN(Number(value)) ? defaultValue : Number(value);
}

function createConfiguration() {
  const config: IAppConfiguration = {
    port: toNumber(process.env.PORT),

    access_token: process.env.ACCESS_TOKEN as string,
    homeserver_url: process.env.HOMESERVER_URL as string,

    meetingwidget_url: process.env.MEETINGWIDGET_URL as string,
    meetingwidget_name: process.env.MEETINGWIDGET_NAME ?? 'NeoDateFix',

    breakout_session_widget_url: process.env
      .BREAKOUT_SESSION_WIDGET_URL as string,
    breakout_session_widget_name:
      process.env.BREAKOUT_SESSION_WIDGET_NAME ?? 'Breakout Sessions',

    meetingwidget_cockpit_url: process.env.MEETINGWIDGET_COCKPIT_URL as string,
    meetingwidget_cockpit_name:
      process.env.MEETINGWIDGET_COCKPIT_NAME ?? 'NeoDateFix Details',

    auto_deletion_offset: toNumber(process.env.AUTO_DELETION_OFFSET),

    jitsi_pin_url: process.env.JITSI_PIN_URL,
    jitsi_dial_in_json_url: process.env.JITSI_DIAL_IN_JSON_URL,

    matrix_link_share: process.env.MATRIX_LINK_SHARE ?? 'https://matrix.to/#/',

    // storage
    data_path: process.env.STORAGE_FILE_DATA_PATH ?? 'storage',
    data_filename: process.env.STORAGE_FILE_FILENAME ?? 'bot.json',

    // encryption
    enable_e2ee: toBoolean(process.env.ENABLE_E2EE, false),
    crypto_data_path: process.env.CRYPTO_DATA_PATH ?? 'crypto',

    enable_welcome_workflow: toBoolean(
      process.env.ENABLE_WELCOME_WORKFLOW,
      true,
    ),
    enable_control_room_migration: toBoolean(
      process.env.ENABLE_CONTROL_ROOM_MIGRATION,
      false,
    ),
    enable_private_room_error_sending: toBoolean(
      process.env.ENABLE_PRIVATE_ROOM_ERROR_SENDING,
      true,
    ),
    default_events_config:
      process.env.DEFAULT_EVENTS_CONFIG ?? 'conf/default_events.json',
    default_widget_layouts_config:
      process.env.DEFAULT_WIDGET_LAYOUTS_CONFIG ??
      'conf/default_widget_layouts.json',
    welcome_workflow_default_locale:
      process.env.WELCOME_WORKFLOW_DEFAULT_LOCALE ?? 'en',

    matrix_server_event_max_age_minutes:
      Number(process.env.MATRIX_SERVER_EVENT_MAX_AGE_MINUTES) || 5,
    open_xchange_meeting_url_template:
      process.env.OPEN_XCHANGE_MEETING_URL_TEMPLATE,
    calendar_room_name: process.env.CALENDAR_ROOM_NAME ?? 'NeoDateFix',
    bot_displayname: process.env.BOT_DISPLAYNAME,

    matrix_filter_apply: toBoolean(process.env.MATRIX_FILTER_APPLY, true),
    matrix_filter_timeline_limit: toNumber(
      process.env.MATRIX_FILTER_TIMELINE_LIMIT,
      50,
    ),

    enable_guest_user_power_level_change: toBoolean(
      process.env.ENABLE_GUEST_USER_POWER_LEVEL_CHANGE,
      false,
    ),
    guest_user_prefix: process.env.GUEST_USER_PREFIX || '@guest-',
    guest_user_default_power_level:
      Number(process.env.GUEST_USER_DEFAULT_POWER_LEVEL) || 0,
    guest_user_delete_power_level_on_leave: toBoolean(
      process.env.GUEST_USER_DELETE_POWER_LEVEL_ON_LEAVE,
      true,
    ),
  };

  return {
    config,
  };
}

export const ValidationSchema = Joi.object({
  PORT: Joi.number(),

  ACCESS_TOKEN: Joi.string().required(),
  HOMESERVER_URL: Joi.string().required().uri(),

  MEETINGWIDGET_URL: Joi.string().required().uri(),
  MEETINGWIDGET_NAME: Joi.string(),

  BREAKOUT_SESSION_WIDGET_URL: Joi.string().required().uri(),
  BREAKOUT_SESSION_WIDGET_NAME: Joi.string(),

  MEETINGWIDGET_COCKPIT_URL: Joi.string().required().uri(),
  MEETINGWIDGET_COCKPIT_NAME: Joi.string(),

  AUTO_DELETION_OFFSET: Joi.number(),

  JITSI_PIN_URL: Joi.string()
    ? Joi.string().replace('{', '_').replace('}', '_').uri()
    : undefined,
  JITSI_DIAL_IN_JSON_URL: Joi.string().uri(),

  MATRIX_LINK_SHARE: Joi.string().uri(),

  MATRIX_FILTER_APPLY: Joi.boolean(),
  MATRIX_FILTER_TIMELINE_LIMIT: Joi.number(),

  // storage
  STORAGE_FILE_DATA_PATH: Joi.string(),
  STORAGE_FILE_FILENAME: Joi.string(),

  ENABLE_WELCOME_WORKFLOW: Joi.boolean(),
  ENABLE_CONTROL_ROOM_MIGRATION: Joi.boolean(),
  ENABLE_PRIVATE_ROOM_ERROR_SENDING: Joi.boolean(),

  DEFAULT_EVENTS_CONFIG: Joi.string(),
  WELCOME_WORKFLOW_DEFAULT_LOCALE: Joi.string(),

  MATRIX_SERVER_EVENT_MAX_AGE_MINUTES: Joi.number(),
  OPEN_XCHANGE_MEETING_URL_TEMPLATE: Joi.string(),
  CALENDAR_ROOM_NAME: Joi.string(),
  BOT_DISPLAYNAME: Joi.string(),

  LOG_LEVEL: Joi.string().valid(
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'silent',
  ),

  ENABLE_GUEST_USER_POWER_LEVEL_CHANGE: Joi.boolean(),
  GUEST_USER_PREFIX: Joi.string(),
  GUEST_USER_DEFAULT_POWER_LEVEL: Joi.number(),
  GUEST_USER_DELETE_POWER_LEVEL_ON_LEAVE: Joi.boolean(),
});

export default createConfiguration;
