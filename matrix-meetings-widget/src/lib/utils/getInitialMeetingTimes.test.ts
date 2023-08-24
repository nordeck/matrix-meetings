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

import { DateTime } from 'luxon';
import { mockMeeting } from '../testUtils';
import {
  getInitialMeetingTimes,
  roundToNextMinutes,
} from './getInitialMeetingTimes';

describe('getInitialMeetingTimes', () => {
  afterEach(() => jest.useRealTimers());

  it('should calculate start and end date of a new meeting', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-02T13:10:00.000Z'));

    const { initialStartDate, initialEndDate } = getInitialMeetingTimes({
      meetingMinutes: 60,
      minutesToRound: 15,
    });

    expect(initialStartDate.toISO()).toEqual('2022-01-02T13:15:00.000Z');
    expect(initialEndDate.toISO()).toEqual('2022-01-02T14:15:00.000Z');
  });

  it('should provide callbacks for getting min and max date of a new meeting', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-02T13:10:00.000Z'));

    const { getMinStartDate, maxEndDate } = getInitialMeetingTimes({
      meetingMinutes: 60,
      minutesToRound: 15,
    });

    expect(getMinStartDate().toISO()).toEqual('2022-01-02T13:10:00.000Z');
    expect(maxEndDate.toISO()).toEqual('9999-12-31T00:00:00.000Z');

    jest.setSystemTime(new Date('2022-01-02T13:20:00.000Z'));

    expect(getMinStartDate().toISO()).toEqual('2022-01-02T13:20:00.000Z');
  });

  it('should provide callbacks for getting min and max date of a new meeting (with overridden min start date, in the past)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-02T13:10:00.000Z'));

    const { getMinStartDate, maxEndDate } = getInitialMeetingTimes({
      meetingMinutes: 60,
      minutesToRound: 15,
      minStartDateOverride: DateTime.fromISO('2022-01-01T13:10:00.000Z'),
    });

    expect(getMinStartDate().toISO()).toEqual('2022-01-01T13:10:00.000Z');
    expect(maxEndDate.toISO()).toEqual('9999-12-31T00:00:00.000Z');
  });

  it('should provide callbacks for getting min and max date of a new meeting (with overridden min start date, in the future)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-01T10:00:00.000Z'));

    const { getMinStartDate, maxEndDate } = getInitialMeetingTimes({
      meetingMinutes: 60,
      minutesToRound: 15,
      minStartDateOverride: DateTime.fromISO('2022-01-01T13:10:00.000Z'),
    });

    expect(getMinStartDate().toISO()).toEqual('2022-01-01T10:00:00.000Z');
    expect(maxEndDate.toISO()).toEqual('9999-12-31T00:00:00.000Z');
  });

  it('should calculate start and end date of a breakout session in a future meeting', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-02T13:10:00.000Z'));

    const { initialStartDate, initialEndDate } = getInitialMeetingTimes({
      minutesToRound: 15,
      breakoutSessionMinutes: 5,
      parentMeeting: mockMeeting({
        content: {
          startTime: '2022-01-02T14:15:00.000Z',
          endTime: '2022-01-02T14:45:00.000Z',
        },
      }),
    });

    expect(initialStartDate.toISO()).toEqual('2022-01-02T14:15:00.000Z');
    expect(initialEndDate.toISO()).toEqual('2022-01-02T14:20:00.000Z');
  });

  it('should calculate start and end date of a breakout session in a running meeting', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-02T13:10:00.000Z'));

    const { initialStartDate, initialEndDate } = getInitialMeetingTimes({
      minutesToRound: 15,
      breakoutSessionMinutes: 5,
      parentMeeting: mockMeeting({
        content: {
          startTime: '2022-01-02T13:00:00.000Z',
          endTime: '2022-01-02T14:00:00.000Z',
        },
      }),
    });

    expect(initialStartDate.toISO()).toEqual('2022-01-02T13:15:00.000Z');
    expect(initialEndDate.toISO()).toEqual('2022-01-02T13:20:00.000Z');
  });

  it('should provide callbacks for getting min and max date of breakout session in a future meeting', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-02T13:10:00.000Z'));

    const { getMinStartDate, maxEndDate } = getInitialMeetingTimes({
      minutesToRound: 15,
      breakoutSessionMinutes: 5,
      parentMeeting: mockMeeting({
        content: {
          startTime: '2022-01-02T14:15:00.000Z',
          endTime: '2022-01-02T14:45:00.000Z',
        },
      }),
    });

    expect(getMinStartDate().toISO()).toEqual('2022-01-02T14:15:00.000Z');
    expect(maxEndDate.toISO()).toEqual('2022-01-02T14:45:00.000Z');
  });

  it('should provide callbacks for getting min and max date of breakout session in a running meeting', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-02T13:10:00.000Z'));

    const { getMinStartDate, maxEndDate } = getInitialMeetingTimes({
      minutesToRound: 15,
      breakoutSessionMinutes: 5,
      parentMeeting: mockMeeting({
        content: {
          startTime: '2022-01-02T13:00:00.000Z',
          endTime: '2022-01-02T14:00:00.000Z',
        },
      }),
    });

    expect(getMinStartDate().toISO()).toEqual('2022-01-02T13:10:00.000Z');
    expect(maxEndDate.toISO()).toEqual('2022-01-02T14:00:00.000Z');

    jest.setSystemTime(new Date('2022-01-02T13:20:00.000Z'));

    expect(getMinStartDate().toISO()).toEqual('2022-01-02T13:20:00.000Z');
  });

  it('should provide callbacks for getting min and max date of breakout session in a ended meeting', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-02T13:10:00.000Z'));

    const { getMinStartDate, maxEndDate } = getInitialMeetingTimes({
      minutesToRound: 15,
      breakoutSessionMinutes: 5,
      parentMeeting: mockMeeting({
        content: {
          startTime: '2022-01-02T12:00:00.000Z',
          endTime: '2022-01-02T13:00:00.000Z',
        },
      }),
    });

    expect(getMinStartDate().toISO()).toEqual('2022-01-02T13:00:00.000Z');
    expect(maxEndDate.toISO()).toEqual('2022-01-02T13:00:00.000Z');
  });
});

describe('roundToNextMinutes', () => {
  it.each`
    value                         | result
    ${'2022-01-02T13:08:00.000Z'} | ${'2022-01-02T13:10:00.000Z'}
    ${'2022-01-02T13:02:00.000Z'} | ${'2022-01-02T13:10:00.000Z'}
    ${'2022-01-02T13:10:00.000Z'} | ${'2022-01-02T13:20:00.000Z'}
    ${'2022-01-02T13:12:00.000Z'} | ${'2022-01-02T13:20:00.000Z'}
    ${'2022-01-02T13:07:12.345Z'} | ${'2022-01-02T13:10:00.000Z'}
    ${'2022-01-02T12:59:00.000Z'} | ${'2022-01-02T13:00:00.000Z'}
  `(
    'should round $value to $result (10 minute blocks)',
    ({ value, result }) => {
      expect(roundToNextMinutes(DateTime.fromISO(value), 10).toISO()).toEqual(
        result,
      );
    },
  );
});
