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
import { mockCalendar, mockCreateMeetingRoom } from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { RootState, initializeStore } from '../../../store/store';
import { makeSelectDayMeetingIds } from './selectDayMeetingIds';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('selectDayMeetingIds', () => {
  let state: RootState;
  const selectDayMeetingIds = makeSelectDayMeetingIds();

  beforeEach(async () => {
    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-1',
      name: { name: 'Meeting 1' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220101T100000',
          dtend: '20220101T140000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-2',
      name: { name: 'Meeting 2' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220102T100000',
          dtend: '20220102T140000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-3',
      name: { name: 'Meeting 3' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220111T100000',
          dtend: '20220111T140000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-4',
      name: { name: 'Meeting 4' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220102T140000',
          dtend: '20220102T150000',
        }),
      },
    });

    const store = createStore({ widgetApi });
    await initializeStore(store);
    state = store.getState();
  });

  it('should return grouped meetings', async () => {
    expect(
      selectDayMeetingIds(state, {
        startDate: '2022-01-01T00:00:00Z',
        endDate: '2022-01-31T23:59:59Z',
      }),
    ).toEqual([
      {
        day: '2022-01-01T10:00:00Z',
        meetingIds: [
          {
            id: '!meeting-room-id-1',
            uid: 'entry-0',
            startTime: '2022-01-01T10:00:00Z',
            endTime: '2022-01-01T14:00:00Z',
          },
        ],
      },
      {
        day: '2022-01-02T10:00:00Z',
        meetingIds: [
          {
            id: '!meeting-room-id-2',
            uid: 'entry-0',
            startTime: '2022-01-02T10:00:00Z',
            endTime: '2022-01-02T14:00:00Z',
          },
          {
            id: '!meeting-room-id-4',
            uid: 'entry-0',
            startTime: '2022-01-02T14:00:00Z',
            endTime: '2022-01-02T15:00:00Z',
          },
        ],
      },
      {
        day: '2022-01-11T10:00:00Z',
        meetingIds: [
          {
            id: '!meeting-room-id-3',
            uid: 'entry-0',
            startTime: '2022-01-11T10:00:00Z',
            endTime: '2022-01-11T14:00:00Z',
          },
        ],
      },
    ]);
  });

  it('should apply filters', async () => {
    expect(
      selectDayMeetingIds(state, {
        startDate: '2022-01-02T00:00:00Z',
        endDate: '2022-01-02T23:59:59Z',
      }),
    ).toEqual([
      {
        day: '2022-01-02T10:00:00Z',
        meetingIds: [
          {
            id: '!meeting-room-id-2',
            uid: 'entry-0',
            startTime: '2022-01-02T10:00:00Z',
            endTime: '2022-01-02T14:00:00Z',
          },
          {
            id: '!meeting-room-id-4',
            uid: 'entry-0',
            startTime: '2022-01-02T14:00:00Z',
            endTime: '2022-01-02T15:00:00Z',
          },
        ],
      },
    ]);
  });
});
