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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import CloseIcon from '@mui/icons-material/Close';
import {
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
} from '../../../../reducer/meetingsApi';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { UpdateFailedDialog } from '../../MeetingCard/MeetingCardMenu';
import { editMeetingThunk } from '../../ScheduleMeetingModal';
import { DeleteMeetingDialog } from './DeleteMeetingDialog';
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

  const dispatch = useAppDispatch();
  const handleClickEditMeeting = useCallback(async () => {
    try {
      if (meeting) {
        await dispatch(editMeetingThunk(meeting)).unwrap();
      }
    } catch (error) {
      console.error('Error updating meeting', error);
      setShowErrorDialog(true);
    }
  }, [dispatch, meeting]);

  const handleClickOpenDeleteConfirm = useCallback(() => {
    setOpenDeleteConfirm(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setOpenDeleteConfirm(false);
  }, []);

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

      <DeleteMeetingDialog
        meeting={meeting}
        open={openDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
      />
    </>
  );
}
