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

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isRecurringCalendarSourceEntry,
  parseICalDate,
} from '../../../lib/utils';
import { Meeting } from '../../../reducer/meetingsApi';
import { fullNumericDateFormat } from '../../common/DateTimePickers';
import { formatRRuleText } from '../RecurrenceEditor/utils';
import { useJitsiDialInInformation } from './useJitsiDialInInformation';
import { useMeetingUrl } from './useMeetingUrl';

type UseMeetingEmail = {
  message: string;
};

export function useMeetingEmail(meeting: Meeting): UseMeetingEmail {
  const { t } = useTranslation();
  const { url: link } = useMeetingUrl(meeting);

  const { data: jitsiDialIn } = useJitsiDialInInformation(meeting.meetingId);

  /* IMPORTANT: This comments define the nested keys used below and are used to
     extract them via i18next-parser

    t('meetingCard.share.messageDialIn_none', '')
    t('meetingCard.share.messageDialIn_nopin', 'Dial-In Number: {{dialInNumber}}\nDial-In Pin: Pin not required\n')
    t('meetingCard.share.messageDialIn_pin', 'Dial-In Number: {{dialInNumber}}\nDial-In Pin: {{dialInPin}}\n')

    t('meetingCard.share.messageRecurrence_none', '')
    t('meetingCard.share.messageRecurrence_present', '🔁 Recurrence: {{recurrence}}\n')

    t('meetingCard.share.messageDescription_none', '')
    t('meetingCard.share.messageDescription_present', '{{description}}\n')
  */

  let dialInContext: 'none' | 'pin' | 'nopin' = 'none';

  if (jitsiDialIn?.dialInNumber) {
    dialInContext = jitsiDialIn.pin ? 'pin' : 'nopin';
  }

  const recurrence = isRecurringCalendarSourceEntry(meeting.calendarEntries)
    ? formatRRuleText(meeting.calendarEntries[0].rrule, t)
    : '';

  const message = t(
    'meetingCard.share.message',
    `{{title}}

📅 {{date, daterange}}
$t(meetingCard.share.messageRecurrence, {"context": "{{recurrenceContext}}" })
$t(meetingCard.share.messageDescription, {"context": "{{descriptionContext}}" })
__________________________
Room: {{link}}
$t(meetingCard.share.messageDialIn, {"context": "{{dialInContext}}" })`,
    {
      title: meeting.title,
      date: [
        parseICalDate(meeting.calendarEntries[0].dtstart).toJSDate(),
        parseICalDate(meeting.calendarEntries[0].dtend).toJSDate(),
      ],
      recurrenceContext: recurrence ? 'present' : 'none',
      recurrence,
      descriptionContext: meeting.description ? 'present' : 'none',
      description: meeting.description,
      link,
      dialInContext,
      dialInNumber: jitsiDialIn?.dialInNumber,
      dialInPin: jitsiDialIn?.pin,
      formatParams: {
        date: fullNumericDateFormat,
      },
    }
  );

  return useMemo(() => ({ message }), [message]);
}
