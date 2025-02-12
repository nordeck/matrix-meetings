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

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Badge, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Dispatch, MouseEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ellipsis } from '../../../lib/ellipsis';

type ToggleListViewProps = {
  showInvitations: boolean;
  onChange: Dispatch<boolean>;

  meetingsViewId?: string;
  invitationsViewId?: string;
};

export function ToggleListView({
  showInvitations,
  onChange,
  invitationsViewId,
  meetingsViewId,
}: ToggleListViewProps) {
  const { t } = useTranslation();

  const handleChangeInvitationsView = useCallback(
    (_: MouseEvent, value: string) => {
      onChange(value === 'invitations');
    },
    [onChange],
  );

  return (
    <ToggleButtonGroup
      aria-label={t('meetingsPanel.tabTitle', 'Views')}
      exclusive
      fullWidth
      onChange={handleChangeInvitationsView}
      size="small"
      sx={{
        maxWidth: 327,
        mx: 'auto',

        '& .MuiToggleButton-root': {
          mb: 1,
          textTransform: 'unset',
        },
      }}
      value={showInvitations ? 'invitations' : 'meetings'}
    >
      <ToggleButton
        aria-controls={!showInvitations ? meetingsViewId : undefined}
        aria-expanded={!showInvitations}
        value="meetings"
      >
        <CalendarMonthIcon />
        <Box component="span" ml={1} sx={ellipsis}>
          {t('meetingsPanel.tabTitleMeetings', 'Meetings')}
        </Box>
      </ToggleButton>
      <ToggleButton
        aria-controls={showInvitations ? invitationsViewId : undefined}
        aria-expanded={showInvitations}
        value="invitations"
      >
        <Badge color="error" overlap="circular" variant="dot">
          <NotificationsIcon />
        </Badge>
        <Box component="span" ml={1} sx={ellipsis}>
          {t('meetingsPanel.tabTitleInvitations', 'Invitations')}
        </Box>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
