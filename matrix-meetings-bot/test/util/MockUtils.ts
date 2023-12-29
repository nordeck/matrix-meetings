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

import { MatrixClient } from 'matrix-bot-sdk';
import { capture } from 'ts-mockito';
import { MethodAction } from 'ts-mockito/lib/MethodAction';
import { ArgCaptor10 } from 'ts-mockito/lib/capture/ArgCaptor';
import * as util from 'util';
import { IAppConfiguration } from '../../src/IAppConfiguration';
import { StateEventName } from '../../src/model/StateEventName';

export enum SendStateEventParameter {
  RoomId = 0,
  StateEventName = 1,
  StateKey = 2,
  Content = 3,
}

export function createAppConfig(): IAppConfiguration {
  return {
    access_token: '',
    breakout_session_widget_name: '',
    breakout_session_widget_url: '',
    data_filename: '',
    data_path: '',
    crypto_data_path: '',
    homeserver_url: '',
    matrix_link_share: '',
    matrix_server_event_max_age_minutes: 0,
    auto_deletion_offset: 0,
    meetingwidget_cockpit_name: '',
    meetingwidget_cockpit_url: '',
    meetingwidget_name: '',
    meetingwidget_url: 'https://meeting-widget.com',
    default_events_config: '',
    default_widget_layouts_config: '',
    enable_welcome_workflow: true,
    enable_control_room_migration: false,
    enable_private_room_error_sending: true,
    welcome_workflow_default_locale: 'de',
    calendar_room_name: '',
    matrix_filter_apply: false,
    matrix_filter_timeline_limit: 10,
    enable_guest_user_power_level_change: false,
    guest_user_prefix: '@guest-',
    guest_user_default_power_level: 0,
    guest_user_delete_power_level_on_leave: true,
  };
}

/**
 * Filter mocked calls to *sendStateEvent* by *StateEventName* and by call index
 * @param clientMock - mocked MatrixClient
 * @param callIndex - zero based call index; 0 is the first call after applying the StateEventName filter
 * @param paramIndex - defines what parameter the funtiion will return
 * @param name - StateEventName to filter captured calls
 */
export function captureSendStateEvent(
  clientMock: MatrixClient,
  callIndex: number,
  paramIndex: SendStateEventParameter,
  name: StateEventName,
): any {
  if (!util.types.isProxy(clientMock))
    throw new Error('clientMock probably is not mocked');
  const calls: any[] = [];
  for (let i = 0; i < 100; i++) {
    const call = capture(clientMock.sendStateEvent).byCallIndex(i);
    if (call[1] === name) {
      calls.push(call);
    }
    if (call === capture(clientMock.sendStateEvent).last()) break;
  }
  return calls[callIndex][paramIndex];
}

/**
 * Extract the arguments of a captor call.
 *
 * @param captureResult - The result of `captor(mock.method)`.
 * @returns a correctly typed array of mock calls.
 */
export function getArgsFromCaptor<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  captureResult: ArgCaptor10<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9>,
): Array<[T0, T1, T2, T3, T4, T5, T6, T7, T8, T9]> {
  const result = captureResult as unknown as { actions: MethodAction[] };

  return result.actions.map(
    (a) => a.args as [T0, T1, T2, T3, T4, T5, T6, T7, T8, T9],
  );
}
