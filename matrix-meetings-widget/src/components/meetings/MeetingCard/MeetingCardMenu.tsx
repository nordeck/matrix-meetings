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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  AlertTitle,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { Dispatch, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Meeting,
  makeSelectRoomPermissions,
  selectNordeckMeetingMetadataEventByRoomId,
  selectRoomPowerLevelsEventByRoomId,
  useCloseMeetingMutation,
} from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { ConfirmDeleteDialog } from '../../common/ConfirmDeleteDialog';
import { withoutYearDateFormat } from '../../common/DateTimePickers';
import {
  MenuButton,
  MenuButtonItem,
  OpenXchangeMenuButtonItem,
  getOpenXChangeExternalReference,
} from '../../common/MenuButton';
import { useEditMeeting } from '../ScheduleMeetingModal';
import { ScheduledDeletionWarning } from './ScheduledDeletionWarning';

type MeetingCardMenuProps = {
  meeting: Meeting;
  'aria-describedby'?: string;
};

export function MeetingCardMenu({
  meeting,
  'aria-describedby': ariaDescribedBy,
}: MeetingCardMenuProps) {
  const widgetApi = useWidgetApi();
  const { t } = useTranslation();

  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const [
    closeMeeting,
    { isLoading: isDeleting, isError, data: deleteResponse, reset },
  ] = useCloseMeetingMutation();

  const selectRoomPermissions = useMemo(makeSelectRoomPermissions, []);
  const {
    canCloseMeeting,
    canUpdateMeetingDetails,
    canUpdateMeetingWidgets,
    canUpdateMeetingParticipantsInvite,
    canUpdateMeetingParticipantsKick,
    canUpdateMeetingPermissions,
  } = useAppSelector((state) =>
    selectRoomPermissions(
      state,
      meeting.meetingId,
      widgetApi.widgetParameters.userId,
    ),
  );

  const metadataEvent = useAppSelector((state) => {
    const event = selectNordeckMeetingMetadataEventByRoomId(
      state,
      meeting.meetingId,
    );

    return event;
  });

  const openXChangeReference = useMemo(
    () => metadataEvent && getOpenXChangeExternalReference(metadataEvent),
    [metadataEvent],
  );
  const isExternalReference = openXChangeReference !== undefined;
  const canUpdateMeeting =
    canUpdateMeetingDetails &&
    canUpdateMeetingWidgets &&
    canUpdateMeetingParticipantsInvite &&
    canUpdateMeetingParticipantsKick &&
    canUpdateMeetingPermissions;

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

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

  const { editMeeting } = useEditMeeting();

  const isMessagingEnabled = useAppSelector((state) => {
    const event = selectRoomPowerLevelsEventByRoomId(state, meeting.meetingId);
    return event?.content.events_default === 0;
  });

  const handleClickEditMeeting = useCallback(async () => {
    try {
      await editMeeting(meeting, isMessagingEnabled);
    } catch {
      setShowErrorDialog(true);
    }
  }, [editMeeting, meeting, isMessagingEnabled]);

  if (!canUpdateMeeting || !canCloseMeeting) {
    // If the menu would be empty, skip it
    return <></>;
  }

  return (
    <>
      <MenuButton
        aria-describedby={ariaDescribedBy}
        buttonLabel={t('meetingCard.moreSettings', 'More settings')}
        onOpen={reset}
      >
        {canUpdateMeeting && isExternalReference && (
          <OpenXchangeMenuButtonItem
            icon={<EditIcon />}
            reference={openXChangeReference}
          >
            {t(
              'meetingCard.editInOpenXchangeMenu',
              'Edit meeting in Open-Xchange',
            )}
          </OpenXchangeMenuButtonItem>
        )}

        {canUpdateMeeting && !isExternalReference && (
          <MenuButtonItem icon={<EditIcon />} onClick={handleClickEditMeeting}>
            {t('meetingCard.editMenu', 'Edit meeting')}
          </MenuButtonItem>
        )}

        {canCloseMeeting && openXChangeReference && (
          <OpenXchangeMenuButtonItem
            color="error.main"
            icon={<DeleteIcon />}
            reference={openXChangeReference}
          >
            {t(
              'meetingCard.deleteInOpenXchangeMenu',
              'Delete meeting in Open-Xchange',
            )}
          </OpenXchangeMenuButtonItem>
        )}

        {canCloseMeeting && !openXChangeReference && (
          <MenuButtonItem
            color="error.main"
            icon={<DeleteIcon />}
            onClick={handleClickOpenDeleteConfirm}
          >
            {t('meetingCard.deleteMenu', 'Delete meeting')}
          </MenuButtonItem>
        )}
      </MenuButton>

      {showErrorDialog && <UpdateFailedDialog setOpen={setShowErrorDialog} />}

      <ConfirmDeleteDialog
        confirmTitle={t('meetingCard.deleteConfirmButton', 'Delete')}
        description={t(
          'meetingCard.deleteConfirmMessage',
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
        title={t('meetingCard.deleteConfirmHeader', 'Delete meeting')}
      >
        {meeting.deletionTime !== undefined && (
          <ScheduledDeletionWarning deletionTime={meeting.deletionTime} />
        )}

        {(isError || deleteResponse?.acknowledgement.error) && (
          <Alert severity="error">
            <AlertTitle>
              {t(
                'meetingCard.deleteFailedTitle',
                'Failed to delete the meeting',
              )}
            </AlertTitle>
            {t('meetingCard.deleteFailed', 'Please try again.')}
          </Alert>
        )}
      </ConfirmDeleteDialog>
    </>
  );
}

export function UpdateFailedDialog({
  setOpen,
}: {
  setOpen: Dispatch<boolean>;
}) {
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      onClose={handleClose}
      open
    >
      <DialogTitle id={titleId}>
        {t('meetingCard.updateFailedTitle', 'Failed to update the meeting')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId}>
          {t('meetingCard.updateFailed', 'Please try again')}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {t('meetingCard.updateFailedClose', 'Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
