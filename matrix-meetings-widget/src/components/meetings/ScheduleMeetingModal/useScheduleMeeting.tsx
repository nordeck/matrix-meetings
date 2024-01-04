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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { formatICalDate } from '@nordeck/matrix-meetings-calendar';
import { nanoid } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { ModalButtonKind } from 'matrix-widget-api';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeCalendarEntry } from '../../../lib/utils';
import { useCreateMeetingMutation } from '../../../reducer/meetingsApi';
import {
  CancelScheduleMeetingModal,
  SCHEDULE_MEETING_MODAL_ROUTE,
  ScheduleMeetingModalRequest,
  ScheduleMeetingModalResult,
  SubmitScheduleMeetingModal,
} from './types';

export function useScheduleMeeting(): {
  scheduleMeeting: () => Promise<void>;
} {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const [createMeeting] = useCreateMeetingMutation();
  const scheduleMeeting = useCallback(async () => {
    const data = await widgetApi.openModal<
      ScheduleMeetingModalResult,
      ScheduleMeetingModalRequest
    >(
      SCHEDULE_MEETING_MODAL_ROUTE,
      t('scheduleMeetingModal.scheduleTitle', 'Schedule Meeting'),
      {
        buttons: [
          {
            id: SubmitScheduleMeetingModal,
            kind: ModalButtonKind.Primary,
            label: t('scheduleMeetingModal.create', 'Create Meeting'),
            disabled: true,
          },
          {
            id: CancelScheduleMeetingModal,
            kind: ModalButtonKind.Secondary,
            label: t('scheduleMeetingModal.cancel', 'Cancel'),
          },
        ],
      },
    );

    if (data && data.type === SubmitScheduleMeetingModal) {
      await createMeeting({
        meeting: {
          title: data.meeting.title,
          description: data.meeting.description,
          calendar: [
            normalizeCalendarEntry({
              uid: nanoid(),
              dtstart: formatICalDate(
                DateTime.fromISO(data.meeting.startTime),
                new Intl.DateTimeFormat().resolvedOptions().timeZone,
              ),
              dtend: formatICalDate(
                DateTime.fromISO(data.meeting.endTime),
                new Intl.DateTimeFormat().resolvedOptions().timeZone,
              ),
              rrule: data.meeting.rrule,
            }),
          ],
          participants: data.meeting.participants,
          powerLevels: data.meeting.powerLevels,
          widgetIds: data.meeting.widgetIds,
        },
      }).unwrap();

      // TODO: what if an error occurs?
    }
  }, [widgetApi, t, createMeeting]);

  return { scheduleMeeting };
}
