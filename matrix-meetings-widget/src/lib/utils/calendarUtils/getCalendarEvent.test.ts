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

import { mockCalendar, mockCalendarEntry } from '../../testUtils';
import { getCalendarEvent } from './getCalendarEvent';

describe('getCalendarEvent', () => {
  beforeEach(() => {
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => +new Date('2022-01-02T10:10:00.000Z'));
  });

  it('should return entry for a single event without uid', () => {
    const calendar = mockCalendar({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
    });

    expect(getCalendarEvent(calendar)).toEqual({
      uid: 'entry-0',
      startTime: '2020-01-09T10:00:00Z',
      endTime: '2020-01-09T11:00:00Z',
      entries: calendar,
    });
  });

  it('should return entry for a single event', () => {
    const calendar = mockCalendar({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
    });

    expect(getCalendarEvent(calendar, 'entry-0', undefined)).toEqual({
      uid: 'entry-0',
      startTime: '2020-01-09T10:00:00Z',
      endTime: '2020-01-09T11:00:00Z',
      entries: calendar,
    });
  });

  it('should skip entry if uid is not part of the calendar', () => {
    const calendar = mockCalendar({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
    });

    expect(
      getCalendarEvent(calendar, 'not-existent-entry', undefined)
    ).toBeUndefined();
  });

  it('should skip entry if recurrence id for a non-recurring event', () => {
    const calendar = mockCalendar({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
    });

    expect(
      getCalendarEvent(calendar, 'entry-0', '2020-01-09T10:00:00Z')
    ).toBeUndefined();
  });

  it('should return entry for a recurrence event', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
    });

    expect(
      getCalendarEvent([rruleEntry], 'entry-0', '2020-01-23T10:00:00Z')
    ).toEqual({
      uid: 'entry-0',
      startTime: '2020-01-23T10:00:00Z',
      endTime: '2020-01-23T11:00:00Z',
      entries: [rruleEntry],
      recurrenceId: '2020-01-23T10:00:00Z',
    });
  });

  it('should return entry for a recurrence event that overlaps', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200110T110000',
      rrule: 'FREQ=DAILY',
    });

    expect(
      getCalendarEvent([rruleEntry], 'entry-0', '2020-01-23T10:00:00Z')
    ).toEqual({
      uid: 'entry-0',
      startTime: '2020-01-23T10:00:00Z',
      endTime: '2020-01-24T11:00:00Z',
      entries: [rruleEntry],
      recurrenceId: '2020-01-23T10:00:00Z',
    });
  });

  it('should return the first entry in a recurrence event', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20220103T100000',
      dtend: '20220103T110000',
      rrule: 'FREQ=DAILY',
    });

    expect(getCalendarEvent([rruleEntry])).toEqual({
      uid: 'entry-0',
      startTime: '2022-01-03T10:00:00Z',
      endTime: '2022-01-03T11:00:00Z',
      entries: [rruleEntry],
      recurrenceId: '2022-01-03T10:00:00Z',
    });
  });

  it('should return the next entry in a recurrence event', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20220101T090000',
      dtend: '20220101T100000',
      rrule: 'FREQ=DAILY',
    });

    expect(getCalendarEvent([rruleEntry])).toEqual({
      uid: 'entry-0',
      startTime: '2022-01-03T09:00:00Z',
      endTime: '2022-01-03T10:00:00Z',
      entries: [rruleEntry],
      recurrenceId: '2022-01-03T09:00:00Z',
    });
  });

  it('should return the current entry in a recurrence event if the meeting is running', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20220101T100000',
      dtend: '20220101T110000',
      rrule: 'FREQ=DAILY',
    });

    expect(getCalendarEvent([rruleEntry])).toEqual({
      uid: 'entry-0',
      startTime: '2022-01-02T10:00:00Z',
      endTime: '2022-01-02T11:00:00Z',
      entries: [rruleEntry],
      recurrenceId: '2022-01-02T10:00:00Z',
    });
  });

  it('should return the last entry in a recurrence event if the series has ended', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20210101T100000',
      dtend: '20210101T110000',
      rrule: 'FREQ=DAILY;COUNT=5',
    });

    expect(getCalendarEvent([rruleEntry])).toEqual({
      uid: 'entry-0',
      startTime: '2021-01-05T10:00:00Z',
      endTime: '2021-01-05T11:00:00Z',
      entries: [rruleEntry],
      recurrenceId: '2021-01-05T10:00:00Z',
    });
  });

  it('should handle entry for a recurrence event with update', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
    });
    const overrideEntry = mockCalendarEntry({
      dtstart: '20200123T140000',
      dtend: '20200123T153000',
      recurrenceId: '20200123T100000',
    });

    expect(
      getCalendarEvent(
        [rruleEntry, overrideEntry],
        'entry-0',
        '2020-01-23T10:00:00Z'
      )
    ).toEqual({
      uid: 'entry-0',
      startTime: '2020-01-23T14:00:00Z',
      endTime: '2020-01-23T15:30:00Z',
      entries: [rruleEntry, overrideEntry],
      recurrenceId: '2020-01-23T10:00:00Z',
    });
  });

  it('should skip entry if recurrence id is not part of the recurrence event', () => {
    expect(
      getCalendarEvent(
        mockCalendar({
          dtstart: '20200109T100000',
          dtend: '20200109T110000',
          rrule: 'FREQ=DAILY',
        }),
        'entry-0',
        '2020-01-23T11:00:00Z'
      )
    ).toBeUndefined();
  });
});
