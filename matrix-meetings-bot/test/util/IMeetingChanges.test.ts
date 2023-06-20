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

import { IMeeting } from '../../src/model/IMeeting';
import { MeetingType } from '../../src/model/MeetingType';
import {
  IMeetingChanges,
  meetingChangesHelper,
} from '../../src/util/IMeetingChanges';

describe('test IMeetingChanges', () => {
  test('calculate', async () => {
    const meeting: IMeeting = {
      roomId: 'r1',
      title: 'title',
      description: 'description',
      startTime: '2022-01-01T00:00:00.000Z',
      endTime: '2022-01-01T00:00:00.000Z',
      widgetIds: [],
      participants: [],
      creator: 'creator',
      type: MeetingType.MEETING,
    };

    const nothingChanged: IMeetingChanges = {
      titleChanged: false,
      descriptionChanged: false,
      startTimeChanged: false,
      endTimeChanged: false,
      calendarChanged: false,
      timeChanged: false,
      anythingChanged: false,
    };
    expect(
      meetingChangesHelper.calculate(meeting, { ...meeting, title: 'new' })
    ).toEqual({
      ...nothingChanged,
      titleChanged: true,
      anythingChanged: true,
    } as IMeetingChanges);

    expect(
      meetingChangesHelper.calculate(meeting, {
        ...meeting,
        startTime: 'some time',
      })
    ).toEqual({
      ...nothingChanged,
      startTimeChanged: true,
      timeChanged: true,
      anythingChanged: true,
    } as IMeetingChanges);

    expect(
      meetingChangesHelper.calculate(meeting, {
        ...meeting,
        calendar: [
          {
            uid: 'uuid',
            dtstart: { tzid: 'Europe/Berlin', value: '20200101T000000' },
            dtend: { tzid: 'Europe/Berlin', value: '20200101T000000' },
            rrule: 'FREQ=DAILY',
          },
        ],
      })
    ).toEqual({
      ...nothingChanged,
      calendarChanged: true,
      anythingChanged: true,
    } as IMeetingChanges);
  });
});
