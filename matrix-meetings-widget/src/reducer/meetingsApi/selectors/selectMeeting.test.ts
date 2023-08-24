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
  mockCalendarEntry,
  mockCreateBreakoutMeetingRoom,
  mockCreateMeetingRoom,
  mockRoomMember,
} from '../../../lib/testUtils';
import { RootState, createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { makeSelectMeeting } from './selectMeeting';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

async function generateRootState(): Promise<RootState> {
  const store = createStore({ widgetApi });
  await initializeStore(store);
  return store.getState();
}

describe('selectMeeting', () => {
  const selectMeeting = makeSelectMeeting();

  it('should generate meeting with uid', async () => {
    mockCreateMeetingRoom(widgetApi, {
      metadata: {
        calendar: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
          }),
          mockCalendarEntry({
            uid: 'entry-1',
            dtstart: '29990102T100000',
            dtend: '29990102T140000',
          }),
        ],
      },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-1', undefined),
    ).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      calendarUid: 'entry-1',
      title: 'An important meeting',
      description: 'A brief description',
      startTime: '2999-01-02T10:00:00Z',
      endTime: '2999-01-02T14:00:00Z',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'join',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
      ],
      widgets: [],
      parentRoomId: '!room-id',
      creator: '@user-id',
      calendarEntries: mockCalendar({
        uid: 'entry-1',
        dtstart: '29990102T100000',
        dtend: '29990102T140000',
      }),
    });
  });

  it('should generate recurring meeting with a recurrence-id', async () => {
    const rruleEntry = mockCalendarEntry({
      uid: 'entry-1',
      dtstart: '29990101T100000',
      dtend: '29990101T140000',
      rrule: 'FREQ=DAILY',
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: {
        calendar: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
          }),
          rruleEntry,
        ],
      },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(
        state,
        '!meeting-room-id',
        'entry-1',
        '2999-02-15T10:00:00Z',
      ),
    ).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      calendarUid: 'entry-1',
      title: 'An important meeting',
      description: 'A brief description',
      startTime: '2999-02-15T10:00:00Z',
      endTime: '2999-02-15T14:00:00Z',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'join',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
      ],
      widgets: [],
      parentRoomId: '!room-id',
      creator: '@user-id',
      calendarEntries: [rruleEntry],
      recurrenceId: '2999-02-15T10:00:00Z',
    });
  });

  it('should generate breakout meeting', async () => {
    mockCreateBreakoutMeetingRoom(widgetApi, { room_id: '!meeting-room-id' });

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-0', undefined),
    ).toEqual({
      type: 'net.nordeck.meetings.breakoutsession',
      meetingId: '!meeting-room-id',
      calendarUid: 'entry-0',
      title: 'An important meeting',
      description: 'A brief description',
      startTime: '2999-01-01T10:00:00Z',
      endTime: '2999-01-01T14:00:00Z',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'join',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
      ],
      widgets: [],
      parentRoomId: '!meeting-room-id',
      creator: '@user-id',
      calendarEntries: mockCalendar({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
      }),
    });
  });

  it('should generate meeting without parent', async () => {
    mockCreateMeetingRoom(widgetApi, {
      roomOptions: { skipParentEvent: true },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-0', undefined),
    ).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      calendarUid: 'entry-0',
      title: 'An important meeting',
      description: 'A brief description',
      startTime: '2999-01-01T10:00:00Z',
      endTime: '2999-01-01T14:00:00Z',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'join',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
      ],
      widgets: [],
      creator: '@user-id',
      calendarEntries: mockCalendar({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
      }),
    });
  });

  it('should generate meeting without description and participants, and with widgets', async () => {
    mockCreateMeetingRoom(widgetApi, {
      roomOptions: {
        skipTopicEvent: true,
        withWidgetEvents: true,
        skipRoomMemberEvents: true,
      },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-0', undefined),
    ).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      calendarUid: 'entry-0',
      title: 'An important meeting',
      description: undefined,
      startTime: '2999-01-01T10:00:00Z',
      endTime: '2999-01-01T14:00:00Z',
      participants: [],
      widgets: ['widget-1', 'widget-2'],
      parentRoomId: '!room-id',
      creator: '@user-id',
      calendarEntries: mockCalendar({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
      }),
    });
  });

  it('should generate deletionTime from force_deletion_at', async () => {
    mockCreateMeetingRoom(widgetApi, {
      metadata: { force_deletion_at: 1577844000000 },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-0', undefined),
    ).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      calendarUid: 'entry-0',
      title: 'An important meeting',
      description: 'A brief description',
      startTime: '2999-01-01T10:00:00Z',
      endTime: '2999-01-01T14:00:00Z',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'join',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
      ],
      widgets: [],
      parentRoomId: '!room-id',
      deletionTime: '2020-01-01T02:00:00.000Z',
      creator: '@user-id',
      calendarEntries: mockCalendar({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
      }),
    });
  });

  it('should generate meeting with invited user', async () => {
    mockCreateMeetingRoom(widgetApi);

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        room_id: '!meeting-room-id',
        state_key: '@invited-user-id',
        content: {
          displayname: 'Bob',
          membership: 'invite',
        },
      }),
    );

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-0', undefined),
    ).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      calendarUid: 'entry-0',
      title: 'An important meeting',
      description: 'A brief description',
      startTime: '2999-01-01T10:00:00Z',
      endTime: '2999-01-01T14:00:00Z',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'join',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
        {
          userId: '@invited-user-id',
          displayName: 'Bob',
          membership: 'invite',
          rawEvent: expect.objectContaining({
            state_key: '@invited-user-id',
          }),
        },
      ],
      widgets: [],
      parentRoomId: '!room-id',
      creator: '@user-id',
      calendarEntries: mockCalendar({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
      }),
    });
  });

  it('should ignore meeting with tombstone', async () => {
    mockCreateMeetingRoom(widgetApi, {
      roomOptions: { withTombstoneEvent: true },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-0', undefined),
    ).toBeUndefined();
  });

  it('should ignore meeting without create event', async () => {
    mockCreateMeetingRoom(widgetApi, {
      roomOptions: { skipCreateEvent: true },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-0', undefined),
    ).toBeUndefined();
  });

  it('should ignore meeting without name', async () => {
    mockCreateMeetingRoom(widgetApi, {
      roomOptions: { skipNameEvent: true },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-0', undefined),
    ).toBeUndefined();
  });

  it('should ignore meeting without metadata', async () => {
    mockCreateMeetingRoom(widgetApi, {
      roomOptions: { skipMetadataEvent: true },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-0', undefined),
    ).toBeUndefined();
  });

  it('should ignore meeting with unknown uid', async () => {
    mockCreateMeetingRoom(widgetApi);

    const state = await generateRootState();

    expect(
      selectMeeting(state, '!meeting-room-id', 'entry-1', undefined),
    ).toBeUndefined();
  });

  it('should ignore meeting with unknown recurrence-id', async () => {
    mockCreateMeetingRoom(widgetApi, {
      metadata: {
        calendar: mockCalendar({
          dtstart: '29990101T100000',
          dtend: '29990101T140000',
          rrule: 'FREQ=DAILY',
        }),
      },
    });

    const state = await generateRootState();

    expect(
      selectMeeting(
        state,
        '!meeting-room-id',
        'entry-0',
        '2999-02-15T10:00:01Z',
      ),
    ).toBeUndefined();
  });
});
