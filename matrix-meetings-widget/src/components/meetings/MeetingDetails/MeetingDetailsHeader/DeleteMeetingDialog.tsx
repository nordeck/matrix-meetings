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

import { navigateToRoom } from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { LoadingButton } from '@mui/lab';
import { Alert, AlertTitle } from '@mui/material';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { DispatchWithoutAction, Fragment, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  deleteCalendarEvent,
  isSingleCalendarSourceEntry,
} from '../../../../lib/utils';
import {
  Meeting,
  MutationResponse,
  meetingsApi,
  selectNordeckMeetingMetadataEventByRoomId,
  useCloseMeetingMutation,
} from '../../../../reducer/meetingsApi';
import { StateThunkConfig, useAppDispatch } from '../../../../store/store';
import { ConfirmDeleteDialog } from '../../../common/ConfirmDeleteDialog';
import { withoutYearDateFormat } from '../../../common/DateTimePickers';
import { ScheduledDeletionWarning } from '../../MeetingCard/ScheduledDeletionWarning';

export function DeleteMeetingDialog({
  meeting,
  open,
  onClose,
}: {
  meeting: Meeting;
  open: boolean;
  onClose: DispatchWithoutAction;
}) {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const [deleteSingleMeetingState, setDeleteSingleMeetingState] = useState({
    loading: false,
    error: false,
  });

  const [
    closeMeeting,
    {
      isLoading: isCloseMeetingLoading,
      isError,
      data: deleteResponse,
      reset: resetDelete,
    },
  ] = useCloseMeetingMutation();

  const reset = useCallback(() => {
    resetDelete();
    setDeleteSingleMeetingState({ loading: false, error: false });
  }, [resetDelete]);

  const handleCheckNavigateToParent = useCallback(() => {
    const isInMeetingRoom =
      meeting.meetingId === widgetApi.widgetParameters.roomId;

    if (isInMeetingRoom && meeting.parentRoomId) {
      navigateToRoom(widgetApi, meeting.parentRoomId);
    }

    onClose();
  }, [meeting.meetingId, meeting.parentRoomId, onClose, widgetApi]);

  const handleClickDeleteConfirm = useCallback(async () => {
    reset();

    try {
      const { acknowledgement } = await closeMeeting({
        roomId: meeting.meetingId,
      }).unwrap();

      if (!acknowledgement?.error) {
        handleCheckNavigateToParent();
      }
    } catch {
      // ignore
    }
  }, [closeMeeting, handleCheckNavigateToParent, meeting.meetingId, reset]);

  const dispatch = useAppDispatch();

  const handleClickDeleteSingleMeetingConfirm = useCallback(async () => {
    reset();
    setDeleteSingleMeetingState({ loading: true, error: false });

    try {
      const result = await dispatch(
        deleteSingleMeetingOccurrenceThunk(meeting),
      ).unwrap();

      if (result?.acknowledgement.error) {
        setDeleteSingleMeetingState({ loading: false, error: true });
      } else {
        handleCheckNavigateToParent();
        setDeleteSingleMeetingState({ loading: false, error: false });
      }
    } catch {
      setDeleteSingleMeetingState({ loading: false, error: true });
    }
  }, [dispatch, handleCheckNavigateToParent, meeting, reset]);

  let description: string;
  let confirmTitle: string;
  let additionalButtons = <Fragment />;

  if (isSingleCalendarSourceEntry(meeting.calendarEntries)) {
    description = t(
      'meetingDetails.header.deleteConfirmMessage',
      'Are you sure you want to delete the meeting “{{title}}” on {{startTime, datetime}} and every content related to it?',
      {
        title: meeting.title,
        startTime: new Date(meeting.startTime),
        formatParams: {
          startTime: withoutYearDateFormat,
        },
      },
    );

    confirmTitle = t('meetingDetails.header.deleteConfirmButton', 'Delete');
  } else {
    description = t(
      'meetingDetails.header.deleteSeriesConfirmMessage',
      'Are you sure you want to delete the meeting or the meeting series “{{title}}” on {{startTime, datetime}} and every content related to it?',
      {
        title: meeting.title,
        startTime: new Date(meeting.startTime),
        formatParams: {
          startTime: withoutYearDateFormat,
        },
      },
    );

    confirmTitle = t(
      'meetingDetails.header.deleteSeriesConfirmButton',
      'Delete series',
    );

    additionalButtons = (
      <LoadingButton
        color="error"
        loading={deleteSingleMeetingState.loading}
        onClick={handleClickDeleteSingleMeetingConfirm}
        variant="outlined"
      >
        {t(
          'meetingDetails.header.deleteMeetingConfirmButton',
          'Delete meeting',
        )}
      </LoadingButton>
    );
  }

  const isCloseMeetingError = isError || deleteResponse?.acknowledgement.error;

  return (
    <ConfirmDeleteDialog
      additionalButtons={additionalButtons}
      confirmTitle={confirmTitle}
      description={description}
      loading={
        isCloseMeetingLoading ||
        (deleteResponse !== undefined && !deleteResponse.acknowledgement.error)
      }
      onCancel={onClose}
      onConfirm={handleClickDeleteConfirm}
      onEnter={reset}
      open={open}
      title={t('meetingDetails.header.deleteConfirmHeader', 'Delete meeting')}
    >
      {meeting.deletionTime !== undefined && (
        <ScheduledDeletionWarning deletionTime={meeting.deletionTime} />
      )}

      {(isCloseMeetingError || deleteSingleMeetingState.error) && (
        <Alert severity="error">
          <AlertTitle>
            {t(
              'meetingDetails.header.deleteFailedTitle',
              'Failed to delete the meeting',
            )}
          </AlertTitle>
          {t('meetingDetails.header.deleteFailed', 'Please try again.')}
        </Alert>
      )}
    </ConfirmDeleteDialog>
  );
}

export const deleteSingleMeetingOccurrenceThunk = createAsyncThunk<
  MutationResponse | undefined,
  Meeting,
  StateThunkConfig
>('editMeetingThunk', async (meeting, { getState, dispatch }) => {
  const state = getState();

  const meetingCalendar = selectNordeckMeetingMetadataEventByRoomId(
    state,
    meeting.meetingId,
  )?.content.calendar;

  if (!meetingCalendar || !meeting.recurrenceId) {
    return undefined;
  }

  const updatedMeetingCalendar = deleteCalendarEvent(
    meetingCalendar,
    meeting.calendarUid,
    meeting.recurrenceId,
  );

  // only update if something changed. the widget API will get stuck if we
  // override the event with the same content.
  if (!isEqual(meetingCalendar, updatedMeetingCalendar)) {
    return await dispatch(
      meetingsApi.endpoints.updateMeetingDetails.initiate({
        roomId: meeting.meetingId,
        updates: { calendar: updatedMeetingCalendar },
      }),
    ).unwrap();
  }

  return undefined;
});
