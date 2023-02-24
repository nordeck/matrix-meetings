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
  extractWidgetApiParameters,
  navigateToRoom,
} from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { IconButton, Tooltip } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isMeetingBreakOutRoom } from '../../../reducer/meetingsApi';

type OpenMeetingRoomButtonProps = {
  roomId: string;
  meetingType?: string;
  'aria-describedby'?: string;
};

export function OpenMeetingRoomButton({
  roomId,
  meetingType,
  'aria-describedby': ariaDescribedBy,
}: OpenMeetingRoomButtonProps) {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const breakoutSessionMode = isMeetingBreakOutRoom(meetingType);

  const url = useMemo(() => {
    const { clientOrigin } = extractWidgetApiParameters();
    return `${clientOrigin}/#/room/${/* TODO! meeting.room_alias ||*/ roomId}`;
  }, [roomId]);

  const handleOnClick = useCallback(() => {
    navigateToRoom(widgetApi, roomId);
  }, [roomId, widgetApi]);

  const openRoomLabel = breakoutSessionMode
    ? t(
        'openMeetingRoomButton.openMeetingRoom',
        'Open the breakout session room',
        { context: 'breakout' }
      )
    : t('openMeetingRoomButton.openMeetingRoom', 'Open the meeting room');

  return (
    <Tooltip title={openRoomLabel}>
      <IconButton
        aria-describedby={ariaDescribedBy}
        color="primary"
        component={breakoutSessionMode ? 'a' : 'button'}
        href={breakoutSessionMode ? url : undefined}
        onClick={breakoutSessionMode ? undefined : handleOnClick}
        target={breakoutSessionMode ? '_blank' : undefined}
      >
        <ExitToAppIcon />
      </IconButton>
    </Tooltip>
  );
}
