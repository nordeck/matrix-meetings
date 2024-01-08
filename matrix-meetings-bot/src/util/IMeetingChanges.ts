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

import {
  CalendarChange,
  extractCalendarChange,
} from '@nordeck/matrix-meetings-calendar';
import { IMeeting } from '../model/IMeeting';

export interface IMeetingChanges {
  titleChanged: boolean;
  descriptionChanged: boolean;
  calendarChanges: CalendarChange[];
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

    const calendarChanges = extractCalendarChange(
      oldMeeting.calendar,
      newMeeting.calendar,
    );
    const anythingChanged =
      titleChanged || descriptionChanged || calendarChanges.length > 0;

    return {
      titleChanged,
      descriptionChanged,
      calendarChanges,
      anythingChanged,
    };
  }
}

export const meetingChangesHelper = new MeetingChangesHelper();
