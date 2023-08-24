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
import { renderHook } from '@testing-library/react-hooks';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  mockCalendarEntry,
  mockConfigEndpoint,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
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
      const [store] = useState(() => createStore({ widgetApi }));
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should generate the ics file', () => {
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

    const { result } = renderHook(() => useDownloadIcsFile(meeting), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({
      error: undefined,
      filename: 'An important meeting_29990101_1000.ics',
      href: 'blob:url',
    });

    expect(blobSpy).toBeCalledWith([
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

describe('createIcsFile', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T10:00:00Z'));
  });

  it('should generate the ics file for a single meeting', () => {
    const meeting = mockMeeting();

    expect(createIcsFile(meeting, 'https://meeting-url.local', 'Description'))
      .toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//sebbo.net//ical-generator//EN
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

    expect(createIcsFile(meeting, 'https://meeting-url.local', 'Description'))
      .toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//sebbo.net//ical-generator//EN
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
      TIMEZONE-ID:Europe/Berlin
      X-WR-TIMEZONE:Europe/Berlin
      BEGIN:VEVENT
      UID:!meeting-room-id-entry-0
      SEQUENCE:0
      DTSTAMP:20200101T110000
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

    expect(createIcsFile(meeting, 'https://meeting-url.local', 'Description'))
      .toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//sebbo.net//ical-generator//EN
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
});

describe('generateVTimezone', () => {
  it('should return a string for a valid timezone', () => {
    expect(generateVTimezone('Europe/Berlin')).toEqual(expect.any(String));
  });

  it('should skip invalid timezone', () => {
    expect(generateVTimezone('NoContinent/NoCity')).toBeNull();
  });
});
