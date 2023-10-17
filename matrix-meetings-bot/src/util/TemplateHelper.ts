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

import i18next from 'i18next';
import { fullNumericDateFormat } from '../dateFormat';
import { CalendarEntryDto } from '../dto/CalendarEntryDto';
import { IUserContext } from '../model/IUserContext';
import { parseICalDate } from '../shared';
import { getSingleOrRecurringEntry } from '../shared/calendarUtils';
import { formatRRuleText } from '../shared/format';

export class TemplateHelper {
  public makeInviteReasons(
    meeting: InviteParams,
    userContext: IUserContext,
    organizerDisplayName?: string,
  ): { textReason: string; htmlReason: string } {
    const lng = userContext.locale ?? 'en';
    const timeZone = userContext.timezone ?? 'UTC';

    const entry = getSingleOrRecurringEntry(meeting.calendar);
    const rrule = entry.rrule;
    const recurrence = rrule ? formatRRuleText(rrule, i18next.t, lng) : '';

    /* IMPORTANT: This comments define the nested keys used below and are used to
       extract them via i18next-parser

      t('meeting.invite.messageByOrganizer_none', '')
      t('meeting.invite.messageByOrganizer_present', '\nyou\'ve been invited to a meeting by {{organizerDisplayName}}')

      t('meeting.invite.messageDescription_none', '')
      t('meeting.invite.messageDescription_present', '\n<hr><i>{{description}}</i>')

      t('meeting.invite.messageRecurrence_none', '')
      t('meeting.invite.messageRecurrence_present', '\n🔁 Recurrence: {{recurrence}}<br/>')
    */

    const message = i18next.t(
      'meeting.invite.message',
      '📅 {{range, daterange}}<br/>$t(meeting.invite.messageRecurrence, {"context": "{{recurrenceContext}}" })<br/>$t(meeting.invite.messageByOrganizer, {"context": "{{organizerContext}}" })$t(meeting.invite.messageDescription, {"context": "{{descriptionContext}}" })',
      {
        lng,
        range: [
          parseICalDate(entry.dtstart).toJSDate(),
          parseICalDate(entry.dtend).toJSDate(),
        ],
        recurrenceContext: recurrence ? 'present' : 'none',
        recurrence,
        organizerContext: organizerDisplayName ? 'present' : 'none',
        organizerDisplayName,
        descriptionContext: meeting.description.length > 0 ? 'present' : 'none',
        description: meeting.description,
        formatParams: {
          range: {
            timeZone,
            ...fullNumericDateFormat,
          },
        },
      },
    );

    return {
      htmlReason: message,
      textReason: message.replace(/<[^>]+>/g, ''),
    };
  }
}

export const templateHelper = new TemplateHelper();

export interface InviteParams {
  description: string;
  calendar: CalendarEntryDto[];
}
