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
  CalendarEntry,
  formatICalDate,
  normalizeCalendarEntry,
  overrideCalendarEntries,
} from '@nordeck/matrix-meetings-calendar';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { t } from 'i18next';
import { DateTime } from 'luxon';
import { ModalButtonKind } from 'matrix-widget-api';
import { meetingBotApi } from '../../../reducer/meetingBotApi';
import {
  Meeting,
  UpdateMeetingDetailsOptions,
  meetingsApi,
  selectNordeckMeetingMetadataEventByRoomId,
  selectRoomPowerLevelsEventByRoomId,
} from '../../../reducer/meetingsApi';
import { StateThunkConfig } from '../../../store/store';
import {
  CancelScheduleMeetingModal,
  CreateMeeting,
  SCHEDULE_MEETING_MODAL_ROUTE,
  ScheduleMeetingModalRequest,
  ScheduleMeetingModalResult,
  SubmitScheduleMeetingModal,
} from './types';

export const editMeetingThunk = createAsyncThunk<
  void,
  Meeting,
  StateThunkConfig
>(
  'editMeetingThunk',
  async (meeting, { getState, extra: { widgetApi }, dispatch }) => {
    const state = getState();

    const isMessagingEnabled =
      selectRoomPowerLevelsEventByRoomId(state, meeting.meetingId)?.content
        .events_default === 0;

    const meetingCalendar =
      selectNordeckMeetingMetadataEventByRoomId(state, meeting.meetingId)
        ?.content.calendar ?? [];

    const updatedMeeting = await widgetApi.openModal<
      ScheduleMeetingModalResult,
      ScheduleMeetingModalRequest
    >(
      SCHEDULE_MEETING_MODAL_ROUTE,
      t('editMeetingModal.title', 'Edit Meeting'),
      {
        buttons: [
          {
            id: SubmitScheduleMeetingModal,
            kind: ModalButtonKind.Primary,
            label: t('editMeetingModal.save', 'Save'),
            disabled: true,
          },
          {
            id: CancelScheduleMeetingModal,
            kind: ModalButtonKind.Secondary,
            label: t('editMeetingModal.cancel', 'Cancel'),
          },
        ],
        data: { meeting, isMessagingEnabled },
      },
    );

    if (updatedMeeting && updatedMeeting.type === SubmitScheduleMeetingModal) {
      try {
        const availableWidgets = await dispatch(
          meetingBotApi.endpoints.getAvailableWidgets.initiate(),
        ).unwrap();

        const {
          meetingDetails,
          addUserIds,
          removeUserIds,
          addWidgets,
          removeWidgets,
          powerLevels,
        } = diffMeeting(
          meeting,
          isMessagingEnabled,
          updatedMeeting.meeting,
          availableWidgets.map((w) => w.id),
          meetingCalendar,
        );

        const detailsResult = await dispatch(
          meetingsApi.endpoints.updateMeetingDetails.initiate({
            roomId: meeting.meetingId,
            updates: meetingDetails,
          }),
        ).unwrap();

        const participantsResult = await dispatch(
          meetingsApi.endpoints.updateMeetingParticipants.initiate({
            roomId: meeting.meetingId,
            addUserIds,
            removeUserIds,
          }),
        ).unwrap();

        const widgetsResult = await dispatch(
          meetingsApi.endpoints.updateMeetingWidgets.initiate({
            roomId: meeting.meetingId,
            addWidgets,
            removeWidgets,
          }),
        ).unwrap();

        let meetingPermissionsResult;
        if (powerLevels.messaging !== undefined) {
          meetingPermissionsResult = await dispatch(
            meetingsApi.endpoints.updateMeetingPermissions.initiate({
              roomId: meeting.meetingId,
              powerLevels: {
                messaging: powerLevels.messaging,
              },
            }),
          ).unwrap();
        }

        if (
          detailsResult.acknowledgement.error ||
          participantsResult.acknowledgements.some((a) => a.error) ||
          widgetsResult.acknowledgements.some((a) => a.error) ||
          meetingPermissionsResult?.acknowledgement.error
        ) {
          throw new Error('Error while updating');
        }
      } catch {
        throw new Error('Error while updating');
      }
    }
  },
);

function diffActiveWidgets(
  oldActiveWidgets: string[],
  newActiveWidget: string[],
  availableWidgets: string[],
) {
  const addWidgets = new Array<string>();
  const removeWidgets = new Array<string>();

  availableWidgets.forEach((id) => {
    const wasActive = oldActiveWidgets.includes(id);
    const isActive = newActiveWidget.includes(id);

    if (isActive && !wasActive) {
      addWidgets.push(id);
    } else if (!isActive && wasActive) {
      removeWidgets.push(id);
    }
  });

  return { addWidgets, removeWidgets };
}

function diffParticipants(
  oldParticipants: string[],
  newParticipants: string[],
) {
  const addUserIds = newParticipants.filter(
    (id) => !oldParticipants.includes(id),
  );
  const removeUserIds = oldParticipants.filter(
    (id) => !newParticipants.includes(id),
  );

  return { addUserIds, removeUserIds };
}

export const diffMeeting = (
  oldMeeting: Meeting,
  isMessagingEnabled: boolean,
  newMeeting: CreateMeeting,
  availableWidgets: string[],
  oldMeetingCalendar: CalendarEntry[],
) => {
  const { addWidgets, removeWidgets } = diffActiveWidgets(
    oldMeeting.widgets,
    newMeeting.widgetIds,
    availableWidgets,
  );
  const { addUserIds, removeUserIds } = diffParticipants(
    oldMeeting.participants.map((p) => p.userId),
    newMeeting.participants,
  );

  const tzid = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const newCalendarEntry = normalizeCalendarEntry({
    uid: oldMeeting.calendarUid,
    dtstart: formatICalDate(DateTime.fromISO(newMeeting.startTime), tzid),
    dtend: formatICalDate(DateTime.fromISO(newMeeting.endTime), tzid),
    rrule: newMeeting.rrule,
    recurrenceId: newMeeting.recurrenceId
      ? formatICalDate(DateTime.fromISO(newMeeting.recurrenceId), tzid)
      : undefined,
  });

  const meetingDetails: UpdateMeetingDetailsOptions['updates'] = {
    title: newMeeting.title,
    description: newMeeting.description,
    calendar: overrideCalendarEntries(oldMeetingCalendar, newCalendarEntry),
  };

  const newMeetingIsMessagingEnabled = newMeeting.powerLevels?.messaging === 0;
  const powerLevels = {
    messaging:
      isMessagingEnabled !== newMeetingIsMessagingEnabled
        ? newMeeting.powerLevels?.messaging
        : undefined,
  };
  return {
    meetingDetails,
    addUserIds,
    removeUserIds,
    addWidgets,
    removeWidgets,
    powerLevels,
  };
};
