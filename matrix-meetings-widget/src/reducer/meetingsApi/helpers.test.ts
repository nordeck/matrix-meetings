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

import { vi } from 'vitest';
import { MockedWidgetApi, mockWidgetApi } from '../../lib/mockWidgetApi';
import { mockReaction } from '../../lib/testUtils';
import {
  awaitAcknowledgement,
  cancelRunningAwaitAcknowledgements,
  isMeetingBreakOutRoom,
  isMeetingRoom,
  isMeetingRoomOrBreakOutRoom,
  withEventContext,
} from './helpers';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('isMeetingRoom', () => {
  it.each(['net.nordeck.meetings.meeting'])('should accept %s', (roomType) => {
    expect(isMeetingRoom(roomType)).toBe(true);
  });

  it.each([undefined, 'm.space', 'net.nordeck.meetings.breakoutsession'])(
    'should reject %s',
    (roomType) => {
      expect(isMeetingRoom(roomType)).toBe(false);
    },
  );
});

describe('isMeetingBreakOutRoom', () => {
  it.each(['net.nordeck.meetings.breakoutsession'])(
    'should accept %s',
    (roomType) => {
      expect(isMeetingBreakOutRoom(roomType)).toBe(true);
    },
  );

  it.each([undefined, 'm.space', 'net.nordeck.meetings.meeting'])(
    'should reject %s',
    (roomType) => {
      expect(isMeetingBreakOutRoom(roomType)).toBe(false);
    },
  );
});

describe('isMeetingRoomOrBreakOutRoom', () => {
  it.each([
    'net.nordeck.meetings.meeting',
    'net.nordeck.meetings.breakoutsession',
  ])('should accept %s', (roomType) => {
    expect(isMeetingRoomOrBreakOutRoom(roomType)).toBe(true);
  });

  it.each([undefined, 'm.space'])('should reject %s', (roomType) => {
    expect(isMeetingRoomOrBreakOutRoom(roomType)).toBe(false);
  });
});

describe('awaitAcknowledgement', () => {
  it('should return success', async () => {
    widgetApi.mockSendRoomEvent(
      mockReaction({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$my-id',
            key: '✅',
          },
        },
      }),
    );

    const result = awaitAcknowledgement(widgetApi, '$my-id');

    cancelRunningAwaitAcknowledgements();

    await expect(result).resolves.toEqual([{ success: true }]);
  });

  it('should return error', async () => {
    widgetApi.mockSendRoomEvent(
      mockReaction({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$my-id',
            key: '❌',
          },
        },
      }),
    );

    const result = awaitAcknowledgement(widgetApi, '$my-id');

    cancelRunningAwaitAcknowledgements();

    await expect(result).resolves.toEqual([{ error: true }]);
  });

  it('should return error with roomId', async () => {
    widgetApi.mockSendRoomEvent(
      mockReaction({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$my-id',
            key: '❌',
          },
          'net.nordeck.meetings.bot.meta': {
            room_id: '!some-room:matrix',
          },
        },
      }),
    );

    const result = awaitAcknowledgement(widgetApi, '$my-id');

    cancelRunningAwaitAcknowledgements();

    await expect(result).resolves.toEqual([
      {
        error: true,
        errorRoomId: '!some-room:matrix',
      },
    ]);
  });

  it('should ignore other events', async () => {
    widgetApi.mockSendRoomEvent(
      mockReaction({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$other-id',
            key: '✅',
          },
        },
      }),
    );

    const result = awaitAcknowledgement(widgetApi, '$my-id');

    cancelRunningAwaitAcknowledgements();

    await expect(result).resolves.toEqual([{ timeout: true }]);
  });

  it('should return in correct order', async () => {
    widgetApi.mockSendRoomEvent(
      mockReaction({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$my-id-2',
            key: '❌',
          },
        },
      }),
    );

    widgetApi.mockSendRoomEvent(
      mockReaction({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$my-id-1',
            key: '✅',
          },
        },
      }),
    );

    const result = awaitAcknowledgement(widgetApi, '$my-id-1', '$my-id-2');

    cancelRunningAwaitAcknowledgements();

    await expect(result).resolves.toEqual([{ success: true }, { error: true }]);
  });

  it('should timeout', async () => {
    const result = awaitAcknowledgement(widgetApi, '$my-id');

    cancelRunningAwaitAcknowledgements();

    await expect(result).resolves.toEqual([{ timeout: true }]);
  });

  it('should timeout if at least one times out', async () => {
    widgetApi.mockSendRoomEvent(
      mockReaction({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$my-id-1',
            key: '✅',
          },
        },
      }),
    );

    const result = awaitAcknowledgement(widgetApi, '$my-id-1', '$my-id-2');

    cancelRunningAwaitAcknowledgements();

    await expect(result).resolves.toEqual([
      { timeout: true },
      { timeout: true },
    ]);
  });
});

describe('withEventContext', () => {
  const data = { my: 'data' };

  beforeEach(() => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: 'UTC+11' }),
        }) as Intl.DateTimeFormat,
    );
  });

  it('should use default language', () => {
    expect(withEventContext(widgetApi, data)).toEqual({
      data,
      context: {
        locale: 'en',
        timezone: 'UTC+11',
      },
    });
  });

  it('should use selected language', () => {
    expect(
      withEventContext(
        {
          ...widgetApi,
          widgetParameters: {
            ...widgetApi.widgetParameters,
            clientLanguage: 'es',
          },
        },
        data,
      ),
    ).toEqual({
      data,
      context: {
        locale: 'es',
        timezone: 'UTC+11',
      },
    });
  });
});
