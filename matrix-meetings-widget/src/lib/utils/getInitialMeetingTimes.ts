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

import { getEnvironment } from '@matrix-widget-toolkit/mui';
import { DateTime } from 'luxon';
import { Meeting } from '../../reducer/meetingsApi';

const defaultMinutesToRound = parseInt(
  getEnvironment('REACT_APP_DEFAULT_MINUTES_TO_ROUND', '15')
);
const defaultBreakoutSessionMinutes = parseInt(
  getEnvironment('REACT_APP_DEFAULT_BREAKOUT_SESSION_MINUTES', '15')
);
const defaultMeetingMinutes = parseInt(
  getEnvironment('REACT_APP_DEFAULT_MEETING_MINUTES', '60')
);

export function getInitialMeetingTimes({
  parentMeeting,
  minutesToRound = defaultMinutesToRound,
  breakoutSessionMinutes = defaultBreakoutSessionMinutes,
  meetingMinutes = defaultMeetingMinutes,
  minStartDateOverride = undefined,
}: {
  parentMeeting?: Meeting;
  minutesToRound?: number;
  breakoutSessionMinutes?: number;
  meetingMinutes?: number;
  minStartDateOverride?: DateTime;
} = {}): {
  initialStartDate: DateTime;
  initialEndDate: DateTime;
  getMinStartDate: () => DateTime;
  maxEndDate: DateTime;
} {
  let initialStartDate = roundToNextMinutes(DateTime.now(), minutesToRound);
  let initialEndDate = initialStartDate.plus({ minutes: meetingMinutes });
  let getMinStartDate = () =>
    minStartDateOverride
      ? DateTime.min(minStartDateOverride, DateTime.now())
      : DateTime.now();
  let maxEndDate = DateTime.fromISO('9999-12-31T00:00:00.000Z');

  if (parentMeeting) {
    if (DateTime.now() < DateTime.fromISO(parentMeeting.startTime)) {
      initialStartDate = DateTime.fromISO(parentMeeting.startTime);
    }

    initialEndDate = initialStartDate.plus({
      minutes: breakoutSessionMinutes,
    });

    if (initialEndDate > DateTime.fromISO(parentMeeting.endTime)) {
      initialEndDate = DateTime.fromISO(parentMeeting.endTime);
    }

    getMinStartDate = () => {
      if (DateTime.now() < DateTime.fromISO(parentMeeting.startTime)) {
        return DateTime.fromISO(parentMeeting.startTime);
      } else if (DateTime.now() > DateTime.fromISO(parentMeeting.endTime)) {
        return DateTime.fromISO(parentMeeting.endTime);
      } else {
        return DateTime.now();
      }
    };
    maxEndDate = DateTime.fromISO(parentMeeting.endTime);
  }

  return { initialStartDate, initialEndDate, getMinStartDate, maxEndDate };
}

export function roundToNextMinutes(
  value: DateTime,
  minutesToRound: number
): DateTime {
  // Always rounds up to the next block
  const result = value.startOf('minute').plus({ minute: minutesToRound });

  return result.set({
    minute: Math.floor(result.minute / minutesToRound) * minutesToRound,
  });
}
