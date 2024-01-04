/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { formatICalDate } from '@nordeck/matrix-meetings-calendar';
import { DateTime } from 'luxon';
import { v4 as uuiv4 } from 'uuid';
import { CalendarEntryDto } from '../dto/CalendarEntryDto';

export interface IMeetingTime {
  start_time?: string;
  end_time?: string;
  calendar?: CalendarEntryDto[];
}

/**
 * Changes meeting time from start and end time model to calendar model.
 * @param meetingTime start, end, calendar data
 * @param externalRrule external rrule if available
 * @param existingCalendar meeting current calendar if exists, is used if migration is needed
 */
export function migrateMeetingTime(
  meetingTime: IMeetingTime,
  externalRrule?: string | undefined,
  existingCalendar?: CalendarEntryDto[],
): CalendarEntryDto[] {
  if (meetingTime.start_time && meetingTime.end_time && !meetingTime.calendar) {
    return [
      {
        uid: existingCalendar?.[0]?.uid ?? uuiv4(),
        dtstart: formatICalDate(DateTime.fromISO(meetingTime.start_time)),
        dtend: formatICalDate(DateTime.fromISO(meetingTime.end_time)),
        rrule: externalRrule,
      },
    ];
  }

  if (meetingTime.calendar) {
    return meetingTime.calendar;
  } else {
    throw new Error(
      'Unexpected input: either start_time with end_time or calendar should be provided',
    );
  }
}
