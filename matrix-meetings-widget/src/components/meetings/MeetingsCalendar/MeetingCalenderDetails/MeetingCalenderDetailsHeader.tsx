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

import { navigateToRoom } from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { DispatchWithoutAction, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  makeSelectRoomPermissions,
  Meeting,
  selectNordeckMeetingMetadataEventByRoomId,
  useCloseMeetingMutation,
} from '../../../../reducer/meetingsApi';
import { useAppSelector } from '../../../../store';
import { ConfirmDeleteDialog } from '../../../common/ConfirmDeleteDialog';
import { withoutYearDateFormat } from '../../../common/DateTimePickers';
import { getOpenXChangeExternalReference } from '../../../common/MenuButton';
import { UpdateFailedDialog } from '../../MeetingCard/MeetingCardMenu';
import { ScheduledDeletionWarning } from '../../MeetingCard/ScheduledDeletionWarning';
import { useEditMeeting } from '../../ScheduleMeetingModal';
import { MeetingCalenderDetailsJoinButton } from './MeetingCalenderDetailsJoinButton';

export function MeetingCalenderDetailsHeader({
  meeting,
  onClose,
  isBigWindow,
  'aria-describedby': ariaDescribedBy,
}: {
  meeting: Meeting;
  onClose: DispatchWithoutAction;
  isBigWindow: boolean;
  'aria-describedby'?: string;
}) {
  const widgetApi = useWidgetApi();
  const { t } = useTranslation();
  const { editMeeting } = useEditMeeting();
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const selectRoomPermissions = useMemo(makeSelectRoomPermissions, []);
  const {
    canCloseMeeting,
    canUpdateMeetingDetails,
    canUpdateMeetingWidgets,
    canUpdateMeetingParticipantsInvite,
    canUpdateMeetingParticipantsKick,
  } = useAppSelector((state) =>
    selectRoomPermissions(
      state,
      meeting.meetingId,
      widgetApi.widgetParameters.userId
    )
  );
  const canUpdateMeeting =
    canUpdateMeetingDetails &&
    canUpdateMeetingWidgets &&
    canUpdateMeetingParticipantsInvite &&
    canUpdateMeetingParticipantsKick;

  const [
    closeMeeting,
    { isLoading: isDeleting, isError, data: deleteResponse },
  ] = useCloseMeetingMutation();

  const metadataEvent = useAppSelector((state) => {
    const event = selectNordeckMeetingMetadataEventByRoomId(
      state,
      meeting.meetingId
    );

    return event;
  });

  const openXChangeReference = useMemo(
    () => metadataEvent && getOpenXChangeExternalReference(metadataEvent),
    [metadataEvent]
  );
  const isExternalReference = openXChangeReference !== undefined;

  const handleClickEditMeeting = useCallback(async () => {
    try {
      if (meeting) {
        await editMeeting(meeting);
      }
    } catch {
      setShowErrorDialog(true);
    }
  }, [editMeeting, meeting]);

  const handleClickOpenDeleteConfirm = useCallback(() => {
    setOpenDeleteConfirm(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setOpenDeleteConfirm(false);
  }, []);

  const handleClickDeleteConfirm = useCallback(async () => {
    try {
      const { acknowledgement } = await closeMeeting({
        roomId: meeting.meetingId,
      }).unwrap();

      if (!acknowledgement?.error) {
        const isInMeetingRoom =
          meeting.meetingId === widgetApi.widgetParameters.roomId;

        if (isInMeetingRoom && meeting.parentRoomId) {
          navigateToRoom(widgetApi, meeting.parentRoomId);
        }

        handleCloseDeleteConfirm();
      }
    } catch {
      // ignore
    }
  }, [
    closeMeeting,
    handleCloseDeleteConfirm,
    meeting.meetingId,
    meeting.parentRoomId,
    widgetApi,
  ]);

  const titleId = useId();

  return (
    <>
      <Stack alignItems="baseline" direction="row">
        <Box display="flex" flexWrap="wrap" flex={1} my={2}>
          <DialogTitle
            component="h3"
            id={ariaDescribedBy}
            sx={{ pb: '0 !important', pt: '0 !important', alignSelf: 'center' }}
          >
            {meeting?.title}
          </DialogTitle>
          <Box
            display="flex"
            flexWrap="wrap"
            alignItems="baseline"
            ml={isBigWindow ? 0 : 3}
          >
            <MeetingCalenderDetailsJoinButton
              aria-describedby={titleId}
              meetingType={meeting.type}
              roomId={meeting.meetingId}
            />
            {canUpdateMeeting && !isExternalReference && (
              <Button
                variant="outlined"
                onClick={handleClickEditMeeting}
                sx={{ mr: 1, mt: isBigWindow ? 0 : 1 }}
              >
                {t('meetingCalenderDetails.header.editMenu', 'Edit')}
              </Button>
            )}

            {canCloseMeeting && !openXChangeReference && (
              <Button
                variant="outlined"
                onClick={handleClickOpenDeleteConfirm}
                color="error"
                sx={{ mr: 1, mt: isBigWindow ? 0 : 1 }}
              >
                {t('meetingCalenderDetails.header.deleteMenu', 'Delete')}
              </Button>
            )}
          </Box>
        </Box>
        <Tooltip onClick={onClose} title={t('close', 'Close')}>
          <IconButton autoFocus sx={{ mr: 3 }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {showErrorDialog && <UpdateFailedDialog setOpen={setShowErrorDialog} />}

      <ConfirmDeleteDialog
        confirmTitle={t(
          'meetingCalenderDetails.header.deleteConfirmButton',
          'Delete'
        )}
        description={t(
          'meetingCalenderDetails.header.deleteConfirmMessage',
          'Are you sure you want to delete the meeting “{{title}}” on {{startTime, datetime}} and every content related to it?',
          {
            title: meeting.title,
            startTime: new Date(meeting.startTime),
            formatParams: {
              startTime: withoutYearDateFormat,
            },
          }
        )}
        loading={
          isDeleting ||
          (deleteResponse !== undefined &&
            !deleteResponse.acknowledgement.error)
        }
        onCancel={handleCloseDeleteConfirm}
        onConfirm={handleClickDeleteConfirm}
        open={openDeleteConfirm}
        title={t(
          'meetingCalenderDetails.header.deleteConfirmHeader',
          'Delete meeting'
        )}
      >
        {meeting.deletionTime !== undefined && (
          <ScheduledDeletionWarning deletionTime={meeting.deletionTime} />
        )}

        {(isError || deleteResponse?.acknowledgement.error) && (
          <Alert severity="error">
            <AlertTitle>
              {t(
                'meetingCalenderDetails.header..deleteFailedTitle',
                'Failed to delete the meeting'
              )}
            </AlertTitle>
            {t(
              'meetingCalenderDetails.header..deleteFailed',
              'Please try again.'
            )}
          </Alert>
        )}
      </ConfirmDeleteDialog>
    </>
  );
}
