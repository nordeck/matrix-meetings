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

import path from 'path';
import { DeepReadonly } from '../src/DeepReadOnly';
import { EventContentRenderer } from '../src/EventContentRenderer';
import { IAppConfiguration } from '../src/IAppConfiguration';
import { IEventContentParams } from '../src/IEventContentParams';
import { RoomMatrixEventsReader } from '../src/io/RoomMatrixEventsReader';
import { IRoomEvent } from '../src/matrix/event/IRoomEvent';
import { IRoomMatrixEvents } from '../src/model/IRoomMatrixEvents';
import { StateEventName } from '../src/model/StateEventName';
import { createAppConfig } from './util/MockUtils';

describe('EventContentRenderer', () => {
  const appConfig: IAppConfiguration = createAppConfig();

  const roomMatrixEvents: DeepReadonly<IRoomMatrixEvents> =
    new RoomMatrixEventsReader('test/conf/test_default_events.json').read();
  const eventContentRenderer = new EventContentRenderer(appConfig);

  const params: IEventContentParams = {
    room_id: 'room1',
    base32_room_id: 'room1',
    base32_room_id50: 'roomId50',
    title: 'Demo Room',
  };

  const findWidgetContent = (widgetId: string) => {
    const widgetContent = roomMatrixEvents.widgetContents.find(
      (w) => w.id === widgetId,
    );
    if (!widgetContent) {
      throw new Error(`Cannot find template for widget id: ${widgetId}`);
    }
    return widgetContent;
  };
  test('should validate base32_room_id50 correctly', () => {
    const params = {
      room_id: 'room1',
      base32_room_id: 'room1',
      base32_room_id50: 'roomId50',
      title: 'Demo Room',
    };

    // Ensure that only the base32_room_id50 property has a length of 50 characters
    const valid = Object.keys(params).every((key) => {
      if (key === 'base32_room_id50') {
        return params[key].length <= 50;
      }
      return true;
    });

    expect(valid).toBe(true);
  });

  test('should not pass validation if ase32_room_id50 is more than 50', () => {
    const params = {
      room_id: 'room1',
      base32_room_id: 'room1',
      base32_room_id50:
        'gInvalid1234567890$TooLongNameForValidation1234567890$',
      title: 'Demo Room',
    };

    // Ensure that only the base32_room_id50 property has a length of 50 characters
    const valid = Object.keys(params).every((key) => {
      if (key === 'base32_room_id50') {
        return params[key].length <= 50;
      }
      return true;
    });

    expect(valid).toBe(false);
  });

  test('render jitsi', async () => {
    const titles = [
      params.title,
      'Demo "Room',
      'Demo "Room',
      'Demo \\"Room',
      'Demo Room {}$/\\uA\\t',
    ];

    for (const title of titles) {
      const json = eventContentRenderer.renderEventContent(
        StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
        findWidgetContent('jitsi'),
        {
          ...params,
          title,
        },
      );

      expect(json).toStrictEqual({
        id: 'jitsi',
        type: 'jitsi',
        url: 'https://jitsi.riot.im/jitsi.html?confId=room1#conferenceId=$conferenceId&domain=$domain&isAudioOnly=$isAudioOnly&displayName=$matrix_display_name&avatarUrl=$matrix_avatar_url&userId=$matrix_user_id&roomId=$matrix_room_id&roomName=$roomName&theme=$theme&auth=token123',
        name: 'Video Conference',
        avatar_url: `src${path.sep}static${path.sep}images${path.sep}calendar.png`,
        data: {
          domain: 'meet.jit.si',
          conferenceId: 'room1',
          roomName: title,
          isAudioOnly: true,
          auth: 'token123',
        },
      });
    }
  });

  test('render etherpad', async () => {
    const json = eventContentRenderer.renderEventContent(
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      findWidgetContent('etherpad'),
      params,
    );

    expect(json).toStrictEqual({
      id: 'etherpad',
      type: 'm.etherpad',
      url: 'https://some_url/p/roomId50?matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_user_id=$matrix_user_id&matrix_room_id=$matrix_room_id&theme=$theme&showChat=false',
      name: '',
    });
  });

  test('render whiteboard', async () => {
    const json = eventContentRenderer.renderEventContent(
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      findWidgetContent('whiteboard'),
      params,
    );

    expect(json).toStrictEqual({
      id: 'whiteboard', // replaced by the state_key
      type: 'net.nordeck.whiteboard',
      url: 'https://some_url/?whiteboardid=room1&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_user_id=$matrix_user_id&matrix_room_id=$matrix_room_id&theme=$theme',
      name: '',
    });
  });

  test('render poll', async () => {
    const json = eventContentRenderer.renderEventContent(
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      findWidgetContent('poll'),
      params,
    );

    expect(json).toStrictEqual({
      id: 'poll',
      type: 'net.nordeck.poll',
      url: 'https://some_url?theme=$theme&matrix_user_id=$matrix_user_id&matrix_avatar_url=$matrix_avatar_url&matrix_display_name=$matrix_display_name&matrix_room_id=$matrix_room_id',
      name: 'Poll',
    });
  });

  test('room event render', async () => {
    const roomEvent: DeepReadonly<IRoomEvent<unknown>> = {
      content: {
        message: 'Hello {{title}}',
      },
    } as IRoomEvent<unknown>;

    const renderedRoomEvent = eventContentRenderer.renderRoomEvents(
      [roomEvent],
      params,
    )[0];

    expect(roomEvent).toStrictEqual({
      content: {
        message: 'Hello {{title}}',
      },
    } as IRoomEvent<unknown>);

    expect(renderedRoomEvent).toStrictEqual({
      content: {
        message: 'Hello Demo Room',
      },
    } as IRoomEvent<unknown>);
  });
});
