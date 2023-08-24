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

import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import { Box, Button, Divider, Stack } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';

import { navigateToRoom } from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Meeting } from '../../../reducer/meetingsApi';
import { withCurrentRoomMeeting } from '../../common/withRoomMeeting';
import { MeetingDetails } from '../../meetings/MeetingDetails';

type CockpitPanelProps = {
  meeting: Meeting;
};

export const CockpitPanel = withCurrentRoomMeeting(
  ({ meeting }: CockpitPanelProps) => {
    const { t } = useTranslation();
    const widgetApi = useWidgetApi();

    const openMeeting = useCallback(() => {
      if (meeting.parentRoomId) {
        navigateToRoom(widgetApi, meeting.parentRoomId);
      }
    }, [meeting.parentRoomId, widgetApi]);

    const titleId = useId();
    const meetingTimeId = useId();

    return (
      <Stack height="100%">
        {meeting.parentRoomId && (
          <Box component="nav" px={2}>
            <Box mx="auto" my={2}>
              <Button
                fullWidth
                onClick={openMeeting}
                startIcon={<ArrowCircleLeftIcon />}
                variant="contained"
              >
                {t('cockpitPanel.toParentRoom', 'Back to parent room')}
              </Button>
            </Box>

            <Divider />
          </Box>
        )}

        <Box px={2}>
          <MeetingDetails
            meetingTimeId={meetingTimeId}
            recurrenceId={meeting.recurrenceId}
            roomId={meeting.meetingId}
            titleId={titleId}
            uid={meeting.calendarUid}
            hideJoinButton
          />
        </Box>
      </Stack>
    );
  },
);
