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

import { IMeeting } from '../model/IMeeting';
import {
  extractCalendarChange,
  OccurrenceChange,
} from '../shared/calendarUtils/extractCalendarChange';
import { isRecurringCalendarSourceEntry } from '../shared/calendarUtils/helpers';

export interface IMeetingChanges {
  titleChanged: boolean;
  descriptionChanged: boolean;
  startTimeChanged: boolean;
  endTimeChanged: boolean;
  calendarChanged: boolean;
  occurrenceChanged: OccurrenceChange[];

  timeChanged: boolean;
  anythingChanged: boolean;
}

class MeetingChangesHelper {
  public calculate(
    oldMeeting: IMeeting,
    newMeeting: IMeeting,
  ): IMeetingChanges {
    const titleChanged = newMeeting.title !== oldMeeting.title;
    const descriptionChanged =
      newMeeting.description !== oldMeeting.description;
    const startTimeChanged = newMeeting.startTime !== oldMeeting.startTime;
    const endTimeChanged = newMeeting.endTime !== oldMeeting.endTime;
    const timeChanged = startTimeChanged || endTimeChanged;
    const newRrule = isRecurringCalendarSourceEntry(newMeeting.calendar)
      ? newMeeting.calendar[0].rrule
      : undefined;
    const oldRrule = isRecurringCalendarSourceEntry(oldMeeting.calendar)
      ? oldMeeting.calendar[0].rrule
      : undefined;
    const calendarChanged = newRrule !== oldRrule;
    const occurrenceChanged = extractCalendarChange(
      oldMeeting.calendar ?? [],
      newMeeting.calendar ?? [],
    );
    const anythingChanged =
      titleChanged ||
      descriptionChanged ||
      timeChanged ||
      calendarChanged ||
      occurrenceChanged.length > 0;

    return {
      titleChanged,
      descriptionChanged,
      startTimeChanged,
      endTimeChanged,
      calendarChanged,
      occurrenceChanged,
      timeChanged,
      anythingChanged,
    };
  }
}

export const meetingChangesHelper = new MeetingChangesHelper();
