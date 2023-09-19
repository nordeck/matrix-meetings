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

import { extractWidgetApiParameters as extractWidgetApiParametersMocked } from '@matrix-widget-toolkit/api';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  mockCalendarEntry,
  mockConfigEndpoint,
  mockCreateMeetingRoom,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import {
  createIcsFile,
  generateVTimezone,
  useDownloadIcsFile,
} from './useDownloadIcsFile';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  extractWidgetApiParameters: jest.fn(),
}));

const extractWidgetApiParameters = jest.mocked(
  extractWidgetApiParametersMocked,
);

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

afterEach(() => jest.useRealTimers());

describe('useDownloadIcsFile', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T10:00:00Z'));

    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);

    extractWidgetApiParameters.mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should generate the ics file', async () => {
    const blobSpy = jest.spyOn(global, 'Blob').mockReturnValue({
      size: 0,
      type: '',
      arrayBuffer: jest.fn(),
      slice: jest.fn(),
      stream: jest.fn(),
      text: jest.fn(),
    });

    (URL.createObjectURL as jest.Mock).mockReturnValue('blob:url');

    const meeting = mockMeeting();
    mockCreateMeetingRoom(widgetApi);

    const { result } = renderHook(() => useDownloadIcsFile(meeting), {
      wrapper: Wrapper,
    });
    expect(result.current).toEqual({
      error: undefined,
      filename: 'An important meeting_29990101_1000.ics',
      href: 'blob:url',
    });

    await waitFor(() => {
      expect(blobSpy).toHaveBeenLastCalledWith([
        expect.stringContaining(`BEGIN:VEVENT\r
UID:!meeting-room-id-entry-0\r
SEQUENCE:0\r
DTSTAMP:20200101T100000Z\r
DTSTART:29990101T100000Z\r
DTEND:29990101T140000Z\r
SUMMARY:An important meeting\r
LOCATION:http://element.local/#/room/!meeting-room-id\r
DESCRIPTION:An important meeting\\n\\n📅 1/1/2999\\, 10:00 AM – 2:00 PM\\n\r
 \\nA brief description\\n\\n__________________________\\nRoom: http://element.\r
 local/#/room/!meeting-room-id\\n\r
END:VEVENT\r`),
      ]);
    });
  });
});

describe('createIcsFile', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T10:00:00Z'));
  });

  it('should generate the ics file for a single meeting', () => {
    const meeting = mockMeeting();

    expect(
      createIcsFile({
        meeting,
        meetingCalendar: meeting.calendarEntries,
        meetingUrl: 'https://meeting-url.local',
        message: 'Description',
      }),
    ).toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//nordeck.net//matrix-meetings//EN
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART:29990101T100000Z
      DTEND:29990101T140000Z
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      END:VCALENDAR"
    `);
  });

  it('should generate the ics file with a timezone', () => {
    const meeting = mockMeeting({
      content: {
        calendarEntries: [
          {
            uid: 'entry-0',
            dtstart: { tzid: 'Europe/Berlin', value: '29990101T100000' },
            dtend: { tzid: 'Europe/Berlin', value: '29990101T140000' },
          },
        ],
      },
    });

    expect(
      createIcsFile({
        meeting,
        meetingCalendar: meeting.calendarEntries,
        meetingUrl: 'https://meeting-url.local',
        message: 'Description',
      }),
    ).toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//nordeck.net//matrix-meetings//EN
      BEGIN:VTIMEZONE
      TZID:Europe/Berlin
      X-LIC-LOCATION:Europe/Berlin
      LAST-MODIFIED:20230517T170335Z
      BEGIN:DAYLIGHT
      TZNAME:CEST
      TZOFFSETFROM:+0100
      TZOFFSETTO:+0200
      DTSTART:19700329T020000
      RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
      END:DAYLIGHT
      BEGIN:STANDARD
      TZNAME:CET
      TZOFFSETFROM:+0200
      TZOFFSETTO:+0100
      DTSTART:19701025T030000
      RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
      END:STANDARD
      END:VTIMEZONE
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART;TZID=Europe/Berlin:29990101T100000
      DTEND;TZID=Europe/Berlin:29990101T140000
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      END:VCALENDAR"
    `);
  });

  it('should generate the ics file for a recurring meeting', () => {
    const meeting = mockMeeting({
      content: {
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      },
    });

    expect(
      createIcsFile({
        meeting,
        meetingCalendar: meeting.calendarEntries,
        meetingUrl: 'https://meeting-url.local',
        message: 'Description',
      }),
    ).toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//nordeck.net//matrix-meetings//EN
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART:29990101T100000Z
      DTEND:29990101T140000Z
      RRULE:FREQ=DAILY
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      END:VCALENDAR"
    `);
  });

  it('should generate the ics file for a recurring meeting with overrides', () => {
    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:30:00Z',
        endTime: '2999-01-02T12:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
          mockCalendarEntry({
            dtstart: '29990102T103000',
            dtend: '29990102T120000',
            recurrenceId: '29990102T100000',
          }),
        ],
      },
    });

    expect(
      createIcsFile({
        meeting,
        meetingCalendar: meeting.calendarEntries,
        meetingUrl: 'https://meeting-url.local',
        message: 'Description',
      }),
    ).toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//nordeck.net//matrix-meetings//EN
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART:29990101T100000Z
      DTEND:29990101T140000Z
      RRULE:FREQ=DAILY
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART:29990102T103000Z
      DTEND:29990102T120000Z
      RECURRENCE-ID:29990102T100000Z
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      END:VCALENDAR"
    `);
  });

  it('should generate the ics file for a recurring meeting with excluded events', () => {
    const meeting = mockMeeting({
      content: {
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
            exdate: ['29990102T100000', '29990103T100000'],
          }),
        ],
      },
    });

    expect(
      createIcsFile({
        meeting,
        meetingCalendar: meeting.calendarEntries,
        meetingUrl: 'https://meeting-url.local',
        message: 'Description',
      }),
    ).toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//nordeck.net//matrix-meetings//EN
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART:29990101T100000Z
      DTEND:29990101T140000Z
      RRULE:FREQ=DAILY
      EXDATE:29990102T100000Z,29990103T100000Z
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      END:VCALENDAR"
    `);
  });

  it('should generate the ics file where every field has a different timezone', () => {
    const meeting = mockMeeting({
      content: {
        calendarEntries: [
          {
            uid: 'entry-0',
            dtstart: { tzid: 'Europe/Berlin', value: '29990101T100000' },
            dtend: { tzid: 'UTC', value: '29990101T140000' },
            rrule: 'FREQ=DAILY',
            exdate: [
              { tzid: 'Europe/London', value: '29990102T090000' },
              { tzid: 'Europe/Berlin', value: '29990103T100000' },
            ],
          },
          {
            uid: 'entry-0',
            dtstart: { tzid: 'Europe/London', value: '29990104T103000' },
            dtend: { tzid: 'Europe/Moscow', value: '29990104T150000' },
            recurrenceId: { tzid: 'Europe/Moscow', value: '29990104T130000' },
          },
        ],
      },
    });

    expect(
      createIcsFile({
        meeting,
        meetingCalendar: meeting.calendarEntries,
        meetingUrl: 'https://meeting-url.local',
        message: 'Description',
      }),
    ).toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//nordeck.net//matrix-meetings//EN
      BEGIN:VTIMEZONE
      TZID:Europe/Berlin
      X-LIC-LOCATION:Europe/Berlin
      LAST-MODIFIED:20230517T170335Z
      BEGIN:DAYLIGHT
      TZNAME:CEST
      TZOFFSETFROM:+0100
      TZOFFSETTO:+0200
      DTSTART:19700329T020000
      RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
      END:DAYLIGHT
      BEGIN:STANDARD
      TZNAME:CET
      TZOFFSETFROM:+0200
      TZOFFSETTO:+0100
      DTSTART:19701025T030000
      RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
      END:STANDARD
      END:VTIMEZONE
      BEGIN:VTIMEZONE
      TZID:Europe/London
      X-LIC-LOCATION:Europe/London
      LAST-MODIFIED:20230517T170335Z
      BEGIN:DAYLIGHT
      TZNAME:BST
      TZOFFSETFROM:+0000
      TZOFFSETTO:+0100
      DTSTART:19700329T010000
      RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
      END:DAYLIGHT
      BEGIN:STANDARD
      TZNAME:GMT
      TZOFFSETFROM:+0100
      TZOFFSETTO:+0000
      DTSTART:19701025T020000
      RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
      END:STANDARD
      END:VTIMEZONE
      BEGIN:VTIMEZONE
      TZID:Europe/Moscow
      X-LIC-LOCATION:Europe/Moscow
      LAST-MODIFIED:20230517T170336Z
      BEGIN:STANDARD
      TZNAME:MSK
      TZOFFSETFROM:+0300
      TZOFFSETTO:+0300
      DTSTART:19700101T000000
      END:STANDARD
      END:VTIMEZONE
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART;TZID=Europe/Berlin:29990101T100000
      DTEND:29990101T140000Z
      RRULE:FREQ=DAILY
      EXDATE:29990102T090000Z,29990103T090000Z
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART;TZID=Europe/London:29990104T103000
      DTEND;TZID=Europe/Moscow:29990104T150000
      RECURRENCE-ID;TZID=Europe/Moscow:29990104T130000
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      END:VCALENDAR"
    `);
  });

  it('should generate the ics file for a multiple calendar entries', () => {
    const meeting = mockMeeting({
      content: {
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
          }),
        ],
      },
    });

    expect(
      createIcsFile({
        meeting,
        meetingCalendar: [
          ...meeting.calendarEntries,
          mockCalendarEntry({
            uid: 'entry-1',
            dtstart: '29990102T100000',
            dtend: '29990102T140000',
          }),
        ],
        meetingUrl: 'https://meeting-url.local',
        message: 'Description',
      }),
    ).toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//nordeck.net//matrix-meetings//EN
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART:29990101T100000Z
      DTEND:29990101T140000Z
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-1
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART:29990102T100000Z
      DTEND:29990102T140000Z
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      END:VCALENDAR"
    `);
  });

  it('should generate the ics file for a recurring event with a split recurring series', () => {
    const meeting = mockMeeting({
      content: {
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY;UNTIL=20200110T235959Z',
          }),
        ],
      },
    });

    expect(
      createIcsFile({
        meeting,
        meetingCalendar: [
          ...meeting.calendarEntries,
          mockCalendarEntry({
            uid: 'entry-1',
            dtstart: '29990111T100000',
            dtend: '29990111T140000',
            rrule: 'FREQ=WEEKLY',
          }),
        ],
        meetingUrl: 'https://meeting-url.local',
        message: 'Description',
      }),
    ).toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//nordeck.net//matrix-meetings//EN
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART:29990101T100000Z
      DTEND:29990101T140000Z
      RRULE:FREQ=DAILY;UNTIL=20200110T235959Z
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-1
      SEQUENCE:0
      DTSTAMP:20200101T100000Z
      DTSTART:29990111T100000Z
      DTEND:29990111T140000Z
      RRULE:FREQ=WEEKLY
      SUMMARY:An important meeting
      LOCATION:https://meeting-url.local
      DESCRIPTION:Description
      END:VEVENT
      END:VCALENDAR"
    `);
  });
});

describe('generateVTimezone', () => {
  it('should return a string for a valid timezone', () => {
    expect(generateVTimezone('Europe/Berlin')).toEqual(expect.any(String));
  });

  it('should skip invalid timezone', () => {
    expect(generateVTimezone('NoContinent/NoCity')).toBeNull();
  });
});
