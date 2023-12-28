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

export interface IAppConfiguration {
  port?: string | number;

  access_token: string;
  homeserver_url: string;

  meetingwidget_url: string;
  meetingwidget_name: string;

  breakout_session_widget_url: string;
  breakout_session_widget_name: string;

  meetingwidget_cockpit_url: string;
  meetingwidget_cockpit_name: string;

  auto_deletion_offset: number | undefined;

  jitsi_pin_url?: string;
  jitsi_dial_in_json_url?: string;

  matrix_link_share: string;

  // storage
  data_path: string;
  data_filename: string;
  crypto_data_directory: string;

  enable_welcome_workflow: boolean;
  enable_control_room_migration: boolean;
  enable_private_room_error_sending: boolean;
  default_events_config: string;
  default_widget_layouts_config: string;
  welcome_workflow_default_locale: string;

  matrix_server_event_max_age_minutes: number;
  open_xchange_meeting_url_template?: string;
  calendar_room_name: string;
  bot_displayname?: string;

  matrix_filter_apply: boolean;
  matrix_filter_timeline_limit: number;

  enable_guest_user_power_level_change: boolean;
  guest_user_prefix: string;
  guest_user_default_power_level: number;
  guest_user_delete_power_level_on_leave: boolean;
}
