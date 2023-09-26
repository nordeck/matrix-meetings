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

import { CalendarEntryDto } from '../../src/dto/CalendarEntryDto';
import { getMeetingEndTime, getMeetingStartTime } from '../../src/shared';
import { InviteParams, templateHelper } from '../../src/util/TemplateHelper';

describe('TemplateHelper', () => {
  const calendar: CalendarEntryDto[] = [
    {
      uid: 'uid-0',
      dtstart: { tzid: 'UTC', value: '20201111T140700' },
      dtend: { tzid: 'UTC', value: '20201111T160700' },
      rrule: 'FREQ=DAILY;COUNT=3',
    },
  ];

  const demoMeeting: InviteParams = {
    description: 'A demo meeting',
    startTime: getMeetingStartTime(undefined, calendar),
    endTime: getMeetingEndTime(undefined, calendar),
  };

  const demoMeetingRecurring: InviteParams = {
    ...demoMeeting,
    calendar,
  };

  test('invite message to member en', () => {
    const invites = templateHelper.makeInviteReasons(
      demoMeeting,
      { userId: 'alice', locale: 'en', timezone: 'UTC' },
      'alice',
    );

    expect(invites.textReason).toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC
you've been invited to a meeting by alice
A demo meeting`);
    expect(invites.htmlReason)
      .toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC<br/><br/>
you've been invited to a meeting by alice
<hr><i>A demo meeting</i>`);
  });

  test('invite message to member en with empty description', () => {
    const invites = templateHelper.makeInviteReasons(
      {
        ...demoMeeting,
        description: '',
      },
      { userId: 'alice', locale: 'en', timezone: 'UTC' },
      'alice',
    );

    expect(invites.textReason).toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC
you've been invited to a meeting by alice`);
    expect(invites.htmlReason)
      .toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC<br/><br/>
you've been invited to a meeting by alice`);
  });

  test('invite message to member en recurring', () => {
    const invites = templateHelper.makeInviteReasons(
      demoMeetingRecurring,
      { userId: 'alice', locale: 'en', timezone: 'UTC' },
      'alice',
    );

    expect(invites.textReason).toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC
🔁 Recurrence: Every day for 3 times
you've been invited to a meeting by alice
A demo meeting`);
    expect(invites.htmlReason).toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC<br/>
🔁 Recurrence: Every day for 3 times<br/><br/>
you've been invited to a meeting by alice
<hr><i>A demo meeting</i>`);
  });

  test('invite message to organizer en', () => {
    const invites = templateHelper.makeInviteReasons(demoMeeting, {
      userId: 'alice',
      locale: 'en',
      timezone: 'UTC',
    });

    expect(invites.textReason).toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC
A demo meeting`);
    expect(invites.htmlReason)
      .toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC<br/><br/>
<hr><i>A demo meeting</i>`);
  });

  test('invite message to organizer en recurring', () => {
    const invites = templateHelper.makeInviteReasons(demoMeetingRecurring, {
      userId: 'alice',
      locale: 'en',
      timezone: 'UTC',
    });

    expect(invites.textReason).toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC
🔁 Recurrence: Every day for 3 times
A demo meeting`);
    expect(invites.htmlReason).toEqual(`📅 11/11/2020, 2:07 – 4:07 PM UTC<br/>
🔁 Recurrence: Every day for 3 times<br/><br/>
<hr><i>A demo meeting</i>`);
  });

  test('invite message to member de', () => {
    const invites = templateHelper.makeInviteReasons(
      demoMeeting,
      { userId: 'alice', locale: 'de', timezone: 'Europe/Berlin' },
      'alice',
    );

    expect(invites.textReason).toEqual(`📅 11.11.2020, 15:07–17:07 Uhr MEZ
alice hat dich zu dieser Besprechung eingeladen
A demo meeting`);
    expect(invites.htmlReason)
      .toEqual(`📅 11.11.2020, 15:07–17:07 Uhr MEZ<br/><br/>
alice hat dich zu dieser Besprechung eingeladen
<hr><i>A demo meeting</i>`);
  });

  test('invite message to member de recurring', () => {
    const invites = templateHelper.makeInviteReasons(
      demoMeetingRecurring,
      { userId: 'alice', locale: 'de', timezone: 'Europe/Berlin' },
      'alice',
    );

    expect(invites.textReason).toEqual(`📅 11.11.2020, 15:07–17:07 Uhr MEZ
🔁 Wiederholung: Jeden Tag für 3 Termine
alice hat dich zu dieser Besprechung eingeladen
A demo meeting`);
    expect(invites.htmlReason).toEqual(`📅 11.11.2020, 15:07–17:07 Uhr MEZ<br/>
🔁 Wiederholung: Jeden Tag für 3 Termine<br/><br/>
alice hat dich zu dieser Besprechung eingeladen
<hr><i>A demo meeting</i>`);
  });

  test('invite message to organizer de', () => {
    const invites = templateHelper.makeInviteReasons(demoMeeting, {
      userId: 'alice',
      locale: 'de',
      timezone: 'Europe/Berlin',
    });

    expect(invites.textReason).toEqual(`📅 11.11.2020, 15:07–17:07 Uhr MEZ
A demo meeting`);
    expect(invites.htmlReason)
      .toEqual(`📅 11.11.2020, 15:07–17:07 Uhr MEZ<br/><br/>
<hr><i>A demo meeting</i>`);
  });

  test('invite message to organizer de recurring', () => {
    const invites = templateHelper.makeInviteReasons(demoMeetingRecurring, {
      userId: 'alice',
      locale: 'de',
      timezone: 'Europe/Berlin',
    });

    expect(invites.textReason).toEqual(`📅 11.11.2020, 15:07–17:07 Uhr MEZ
🔁 Wiederholung: Jeden Tag für 3 Termine
A demo meeting`);
    expect(invites.htmlReason).toEqual(`📅 11.11.2020, 15:07–17:07 Uhr MEZ<br/>
🔁 Wiederholung: Jeden Tag für 3 Termine<br/><br/>
<hr><i>A demo meeting</i>`);
  });
});
