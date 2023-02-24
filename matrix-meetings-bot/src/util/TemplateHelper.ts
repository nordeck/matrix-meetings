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
import moment from 'moment-timezone';
import { IUserContext } from '../model/IUserContext';

export class TemplateHelper {
  public makeInviteReasons(
    meeting: InviteParams,
    userContext: IUserContext,
    userDisplayName: string,
    isOrganizer: boolean
  ): { textReason: string; htmlReason: string } {
    const showDescription = meeting.description.length > 0;

    const lng = userContext.locale ? userContext.locale : 'en';
    const timeZone = userContext.timezone ? userContext.timezone : 'UTC';

    const format = (date: string | number | Date, fmt: string): string => {
      return moment(new Date(date)).tz(timeZone).locale(lng).format(fmt);
    };

    const startTimeText: string = format(meeting.startTime, 'LT');
    const endTimeText: string = format(meeting.endTime, 'LT');
    const startDateText: string = format(meeting.startTime, 'L');
    const endDateText: string = format(meeting.endTime, 'L');

    const timezoneText: string = format(meeting.startTime, 'z');

    const i18nOpts = {
      lng,
      joinArrays: '',
      organizerUsername: userDisplayName,
      startDate: startDateText,
      startTime: startTimeText,
      endDate: endDateText,
      endTime: endTimeText,
      timezone: timezoneText,
      description: meeting?.description,
    };

    const inviteText = i18next.t(
      'meeting.invite.invited',
      'You\'ve been invited to a meeting by {{organizerUsername}}. It will take place on {{startDate}} at {{startTime}} {{timezone}} and ends on {{endDate}} at {{endTime}} {{timezone}}. Please accept this invitation by clicking the "Accept" button to add the meeting to your calendar. To stay away from the meeting, click on the "Reject" button.',
      i18nOpts
    );
    const organizerText = i18next.t(
      'meeting.invite.organizer',
      'The meeting was created for you. It will take place on {{startDate}} at {{startTime}} {{timezone}}. Please accept this invitation by clicking the "Accept" button to add the meeting to your calendar. To stay away from the meeting, click on the "Reject" button.',
      i18nOpts
    );
    const inviteHtml = i18next.t(
      'meeting.invite.htmlInvited',
      'You\'ve been invited to a meeting by {{organizerUsername}}. It will take place on <b>{{startDate}} at {{startTime}} {{timezone}}</b> and ends on <b>{{endDate}} at {{endTime}} {{timezone}}</b>. Please accept this invitation by clicking the "Accept" button to add the meeting to your calendar. To stay away from the meeting, click on the "Reject" button.',
      i18nOpts
    );
    const organizerHtml = i18next.t(
      'meeting.invite.htmlOrganizer',
      'The meeting was created for you. It will take place on <b>{{startDate}} at {{startTime}} {{timezone}}</b>. Please accept this invitation by clicking the "Accept" button to add the meeting to your calendar. To stay away from the meeting, click on the "Reject" button.',
      i18nOpts
    );

    const htmlParts: string[] = [];
    htmlParts.push(isOrganizer ? `${organizerHtml}` : `${inviteHtml}`);

    if (showDescription) {
      htmlParts.push('<hr>');
      htmlParts.push(
        i18next.t(
          'meeting.invite.htmlDescription',
          '<div><i>{{description}}</i></div>',
          i18nOpts
        )
      );
    }

    return {
      htmlReason: htmlParts.join(''),
      textReason: isOrganizer ? organizerText : inviteText,
    };
  }
}

export const templateHelper = new TemplateHelper();

export interface InviteParams {
  description: string;
  startTime: string;
  endTime: string;
}
