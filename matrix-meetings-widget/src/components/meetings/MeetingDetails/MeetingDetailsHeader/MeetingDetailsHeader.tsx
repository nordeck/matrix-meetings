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
  Meeting,
  makeSelectRoomPermissions,
  selectNordeckMeetingMetadataEventByRoomId,
  selectRoomPowerLevelsEventByRoomId,
  useCloseMeetingMutation,
} from '../../../../reducer/meetingsApi';
import { useAppSelector } from '../../../../store';
import { ConfirmDeleteDialog } from '../../../common/ConfirmDeleteDialog';
import { withoutYearDateFormat } from '../../../common/DateTimePickers';
import { UpdateFailedDialog } from '../../MeetingCard/MeetingCardMenu';
import { ScheduledDeletionWarning } from '../../MeetingCard/ScheduledDeletionWarning';
import { useEditMeeting } from '../../ScheduleMeetingModal';
import { MeetingDetailsJoinButton } from './MeetingDetailsJoinButton';
import { getOpenXChangeExternalReference } from './OpenXchangeButton';
import { OpenXchangeButton } from './OpenXchangeButton/OpenXchangeButton';

export function MeetingDetailsHeader({
  meeting,
  onClose,
  titleId,
  hideJoinButton,
}: {
  meeting: Meeting;
  onClose?: DispatchWithoutAction;
  titleId?: string;
  hideJoinButton?: boolean;
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
      widgetApi.widgetParameters.userId,
    ),
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
      meeting.meetingId,
    );

    return event;
  });

  const isMessagingEnabled = useAppSelector((state) => {
    const event = selectRoomPowerLevelsEventByRoomId(state, meeting.meetingId);
    return event?.content.events_default === 0;
  });

  const openXChangeReference = useMemo(
    () => metadataEvent && getOpenXChangeExternalReference(metadataEvent),
    [metadataEvent],
  );
  const isExternalReference = openXChangeReference !== undefined;

  const handleClickEditMeeting = useCallback(async () => {
    try {
      if (meeting) {
        await editMeeting(
          meeting,
          metadataEvent?.content.calendar,
          isMessagingEnabled,
        );
      }
    } catch {
      setShowErrorDialog(true);
    }
  }, [
    editMeeting,
    isMessagingEnabled,
    meeting,
    metadataEvent?.content.calendar,
  ]);

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

  const isMeetingInvitation = meeting.participants.some(
    (p) =>
      p.userId === widgetApi.widgetParameters.userId &&
      p.membership === 'invite',
  );

  const joinButtonTitleId = useId();

  return (
    <>
      <Stack alignItems="baseline" direction="row">
        <Box display="flex" flexWrap="wrap" flex={1} mt={2} overflow="hidden">
          <DialogTitle
            component="h3"
            id={titleId}
            sx={{
              pb: '0 !important',
              pt: '0 !important',
              pr: '0 !important',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {meeting?.title}
          </DialogTitle>
          <Box display="flex" flexWrap="wrap" alignItems="baseline" ml={3}>
            {!hideJoinButton && (
              <MeetingDetailsJoinButton
                aria-describedby={joinButtonTitleId}
                meetingType={meeting.type}
                roomId={meeting.meetingId}
              />
            )}

            {!isMeetingInvitation && (
              <>
                {canUpdateMeeting && isExternalReference && (
                  <OpenXchangeButton reference={openXChangeReference}>
                    {t(
                      'meetingDetails.header.editInOpenXchangeMenu',
                      'Edit meeting in Open-Xchange',
                    )}
                  </OpenXchangeButton>
                )}
                {canUpdateMeeting && !isExternalReference && (
                  <Button
                    variant="outlined"
                    onClick={handleClickEditMeeting}
                    sx={{ mr: 1, mb: 1 }}
                  >
                    {t('meetingDetails.header.editMenu', 'Edit')}
                  </Button>
                )}

                {canCloseMeeting && openXChangeReference && (
                  <OpenXchangeButton
                    color="error.main"
                    reference={openXChangeReference}
                  >
                    {t(
                      'meetingDetails.header.deleteInOpenXchangeMenu',
                      'Delete meeting in Open-Xchange',
                    )}
                  </OpenXchangeButton>
                )}
                {canCloseMeeting && !openXChangeReference && (
                  <Button
                    variant="outlined"
                    onClick={handleClickOpenDeleteConfirm}
                    color="error"
                  >
                    {t('meetingDetails.header.deleteMenu', 'Delete')}
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>
        {onClose && (
          <Tooltip onClick={onClose} title={t('close', 'Close')}>
            <IconButton autoFocus sx={{ mr: 3 }}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {showErrorDialog && <UpdateFailedDialog setOpen={setShowErrorDialog} />}

      <ConfirmDeleteDialog
        confirmTitle={t('meetingDetails.header.deleteConfirmButton', 'Delete')}
        description={t(
          'meetingDetails.header.deleteConfirmMessage',
          'Are you sure you want to delete the meeting “{{title}}” on {{startTime, datetime}} and every content related to it?',
          {
            title: meeting.title,
            startTime: new Date(meeting.startTime),
            formatParams: {
              startTime: withoutYearDateFormat,
            },
          },
        )}
        loading={
          isDeleting ||
          (deleteResponse !== undefined &&
            !deleteResponse.acknowledgement.error)
        }
        onCancel={handleCloseDeleteConfirm}
        onConfirm={handleClickDeleteConfirm}
        open={openDeleteConfirm}
        title={t('meetingDetails.header.deleteConfirmHeader', 'Delete meeting')}
      >
        {meeting.deletionTime !== undefined && (
          <ScheduledDeletionWarning deletionTime={meeting.deletionTime} />
        )}

        {(isError || deleteResponse?.acknowledgement.error) && (
          <Alert severity="error">
            <AlertTitle>
              {t(
                'meetingDetails.header..deleteFailedTitle',
                'Failed to delete the meeting',
              )}
            </AlertTitle>
            {t('meetingDetails.header..deleteFailed', 'Please try again.')}
          </Alert>
        )}
      </ConfirmDeleteDialog>
    </>
  );
}
