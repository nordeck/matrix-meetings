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

import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import {
  mockCalendar,
  mockCreateBreakoutMeetingRoom,
  mockCreateMeetingRoom,
  mockRoomName,
  mockRoomTopic,
} from '../../../lib/testUtils';
import { RootState, createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import {
  Filters,
  filterMeetingByText,
  makeSelectAllMeetingIds,
} from './selectAllMeetingIds';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

async function generateRootState(): Promise<RootState> {
  const store = createStore({ widgetApi });
  await initializeStore(store);
  return store.getState();
}

describe('selectAllMeetingIds', () => {
  let filters: Filters;
  beforeEach(() => {
    filters = {
      startDate: '2999-01-01T00:00:00Z',
      endDate: '2999-12-31T23:59:59Z',
    };
  });

  describe('default opts', () => {
    const selectAllMeetingIds = makeSelectAllMeetingIds();

    it('should generate meeting', async () => {
      mockCreateMeetingRoom(widgetApi);

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
      ]);
    });

    it('should generate recurring meeting', async () => {
      mockCreateMeetingRoom(widgetApi, {
        metadata: {
          calendar: mockCalendar({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY;COUNT=2',
          }),
        },
      });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          recurrenceId: '2999-01-01T10:00:00Z',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          recurrenceId: '2999-01-02T10:00:00Z',
          startTime: '2999-01-02T10:00:00Z',
          endTime: '2999-01-02T14:00:00Z',
        },
      ]);
    });

    it('should ignore breakout session', async () => {
      mockCreateBreakoutMeetingRoom(widgetApi);

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([]);
    });

    it('should generate meeting without parent', async () => {
      mockCreateMeetingRoom(widgetApi, {
        roomOptions: { skipParentEvent: true },
      });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
      ]);
    });

    it('should generate meeting without description and participants', async () => {
      mockCreateMeetingRoom(widgetApi, {
        roomOptions: {
          skipTopicEvent: true,
          skipRoomMemberEvents: true,
        },
      });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
      ]);
    });

    it('should ignore meeting with tombstone', async () => {
      mockCreateMeetingRoom(widgetApi, {
        roomOptions: { withTombstoneEvent: true },
      });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([]);
    });

    it('should ignore meeting without create event', async () => {
      mockCreateMeetingRoom(widgetApi, {
        roomOptions: { skipCreateEvent: true },
      });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([]);
    });

    it('should ignore meeting without name', async () => {
      mockCreateMeetingRoom(widgetApi, {
        roomOptions: { skipNameEvent: true },
      });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([]);
    });

    it('should ignore meeting without metadata', async () => {
      mockCreateMeetingRoom(widgetApi, {
        roomOptions: { skipMetadataEvent: true },
      });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([]);
    });

    it('should filter by startDate (include)', async () => {
      mockCreateMeetingRoom(widgetApi, {
        metadata: {
          calendar: mockCalendar({
            dtstart: '20200101T000000',
            dtend: '20200101T010000',
          }),
        },
      });

      const state = await generateRootState();

      expect(
        selectAllMeetingIds(state, {
          ...filters,
          startDate: '2020-01-01T00:59:59Z',
        })
      ).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T01:00:00Z',
        },
      ]);
    });

    it('should filter by startDate (exclude)', async () => {
      mockCreateMeetingRoom(widgetApi, {
        metadata: {
          calendar: mockCalendar({
            dtstart: '20200101T000000',
            dtend: '20200101T010000',
          }),
        },
      });

      const state = await generateRootState();

      expect(
        selectAllMeetingIds(state, {
          ...filters,
          startDate: '2020-01-01T01:00:00Z',
        })
      ).toEqual([]);
    });

    it('should filter by endDate (include)', async () => {
      mockCreateMeetingRoom(widgetApi, {
        metadata: {
          calendar: mockCalendar({
            dtstart: '20200101T000000',
            dtend: '20200101T010000',
          }),
        },
      });

      const state = await generateRootState();

      expect(
        selectAllMeetingIds(state, {
          ...filters,
          startDate: '2000-01-01T00:00:00Z',
          endDate: '2020-01-01T00:00:00Z',
        })
      ).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T01:00:00Z',
        },
      ]);
    });

    it('should filter by endDate (exclude)', async () => {
      mockCreateMeetingRoom(widgetApi, {
        metadata: {
          calendar: mockCalendar({
            dtstart: '20200101T000000',
            dtend: '20200101T010000',
          }),
        },
      });

      const state = await generateRootState();

      expect(
        selectAllMeetingIds(state, {
          ...filters,
          startDate: '2000-01-01T00:00:00Z',
          endDate: '2019-12-31T23:59:59Z',
        })
      ).toEqual([]);
    });

    it('should sort the meetings', async () => {
      mockCreateMeetingRoom(widgetApi, {
        room_id: '!roomId1',
        metadata: {
          calendar: mockCalendar({
            dtstart: '20210101T000000',
            dtend: '20210101T010000',
          }),
        },
      });

      mockCreateMeetingRoom(widgetApi, {
        room_id: '!roomId2',
        metadata: {
          calendar: mockCalendar({
            dtstart: '20200101T000000',
            dtend: '20200101T010000',
          }),
        },
      });

      mockCreateMeetingRoom(widgetApi, {
        room_id: '!roomId3',
        metadata: {
          calendar: mockCalendar({
            dtstart: '20220101T000000',
            dtend: '20220101T010000',
          }),
        },
      });

      mockCreateMeetingRoom(widgetApi, {
        room_id: '!roomId0',
        metadata: {
          calendar: mockCalendar({
            dtstart: '20200101T000000',
            dtend: '20200101T010000',
          }),
        },
      });

      const state = await generateRootState();

      expect(
        selectAllMeetingIds(state, {
          ...filters,
          startDate: '2000-01-01T00:00:00Z',
        })
      ).toEqual([
        expect.objectContaining({ id: '!roomId0' }),
        expect.objectContaining({ id: '!roomId2' }),
        expect.objectContaining({ id: '!roomId1' }),
        expect.objectContaining({ id: '!roomId3' }),
      ]);
    });
  });

  describe('opts = { isChildOfRoomId: "defined" }', () => {
    const selectAllMeetingIds = makeSelectAllMeetingIds({
      isChildOfRoomId: '!room-id',
    });

    it('should ignore meeting without parent', async () => {
      mockCreateMeetingRoom(widgetApi, {
        roomOptions: { skipParentEvent: true },
      });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([]);
    });

    it('should ignore meeting with different parent', async () => {
      mockCreateMeetingRoom(widgetApi, { parentRoomId: '!another-roomId' });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([]);
    });
  });

  describe('opts = { includeBreakoutSessions: true, skipMeetings: true }', () => {
    const selectAllMeetingIds = makeSelectAllMeetingIds({
      includeBreakoutSessions: true,
      skipMeetings: true,
    });

    it('should generate breakout meeting', async () => {
      mockCreateBreakoutMeetingRoom(widgetApi);

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!breakout-room-id',
          uid: 'entry-0',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
      ]);
    });

    it('should ignore meeting', async () => {
      mockCreateMeetingRoom(widgetApi);

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([]);
    });
  });

  describe('opts = { includeBreakoutSessions: true }', () => {
    const selectAllMeetingIds = makeSelectAllMeetingIds({
      includeBreakoutSessions: true,
    });

    it('should generate meeting', async () => {
      mockCreateMeetingRoom(widgetApi);

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
      ]);
    });

    it('should generate breakout meeting', async () => {
      mockCreateBreakoutMeetingRoom(widgetApi);

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!breakout-room-id',
          uid: 'entry-0',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
      ]);
    });
  });

  describe('opts = { hasMemberId: "defined" }', () => {
    it('should generate meeting if joined', async () => {
      mockCreateMeetingRoom(widgetApi);

      const state = await generateRootState();

      const selectAllMeetingIds = makeSelectAllMeetingIds({
        hasMemberId: '@user-id',
      });

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
      ]);
    });

    it('should generate meeting if not joined', async () => {
      mockCreateMeetingRoom(widgetApi);

      const state = await generateRootState();

      const selectAllMeetingIds = makeSelectAllMeetingIds({
        hasMemberId: '@another-user:matrix',
      });

      expect(selectAllMeetingIds(state, filters)).toEqual([]);
    });
  });

  describe('opts = { ignoreRecurrenceRulesAndDateFilters: true }', () => {
    const selectAllMeetingIds = makeSelectAllMeetingIds({
      ignoreRecurrenceRulesAndDateFilters: true,
    });

    it('should generate meeting', async () => {
      mockCreateMeetingRoom(widgetApi);

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
      ]);
    });

    it('should generate recurring meeting', async () => {
      mockCreateMeetingRoom(widgetApi, {
        metadata: {
          calendar: mockCalendar({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY;COUNT=2',
          }),
        },
      });

      const state = await generateRootState();

      expect(selectAllMeetingIds(state, filters)).toEqual([
        {
          id: '!meeting-room-id',
          uid: 'entry-0',
          startTime: '2999-01-01T10:00:00Z',
          endTime: '2999-01-01T14:00:00Z',
        },
      ]);
    });
  });
});

describe('filterMeetingByText', () => {
  const events: Parameters<typeof filterMeetingByText>[1] = {
    roomNameEvent: mockRoomName({ content: { name: 'My Name' } }),
    roomTopicEvent: mockRoomTopic({ content: { topic: 'My Description' } }),
  };

  describe('filterText filter', () => {
    it('should include name', () => {
      expect(filterMeetingByText({ filterText: 'name' }, events)).toBe(true);
    });

    it('should include description', () => {
      expect(filterMeetingByText({ filterText: 'description' }, events)).toBe(
        true
      );
    });

    it('should work without description name', () => {
      expect(
        filterMeetingByText(
          { filterText: 'description' },
          {
            ...events,
            roomTopicEvent: undefined,
          }
        )
      ).toBe(false);
    });

    it('should exclude', () => {
      expect(filterMeetingByText({ filterText: 'other' }, events)).toBe(false);
    });
  });
});
