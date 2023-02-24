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

import { getEnvironment } from '@matrix-widget-toolkit/mui';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  Alert,
  AlertTitle,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  ListSubheader,
  Switch,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  makeSelectRoomPermissions,
  Meeting,
  selectRoomPowerLevelsEventByRoomId,
  useUpdateMeetingPermissionsMutation,
} from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { MeetingNotEndedGuard } from '../../common/MeetingNotEndedGuard';

function getPowerLevel() {
  // this is in a function so we can mock it tests
  const raw = Number.parseInt(
    getEnvironment('REACT_APP_MESSAGING_NOT_ALLOWED_POWER_LEVEL', '100')
  );
  return isNaN(raw) || raw < 0 ? 100 : raw;
}

type MeetingCardEditPermissionsContentProps = {
  meeting: Meeting;
  'aria-describedby'?: string;
};

export function MeetingCardEditPermissionsContent({
  meeting,
  'aria-describedby': ariaDescribedBy,
}: MeetingCardEditPermissionsContentProps) {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const selectRoomPermissions = useMemo(makeSelectRoomPermissions, []);
  const { canUpdateMeetingPermissions } = useAppSelector((state) =>
    selectRoomPermissions(
      state,
      meeting.meetingId,
      widgetApi.widgetParameters.userId
    )
  );

  const [updateMeetingPermissions, { data, isLoading: isUpdating, isError }] =
    useUpdateMeetingPermissionsMutation();
  const handleChangeMessagingPermissions = useCallback(
    async (_, checked: boolean) => {
      await updateMeetingPermissions({
        roomId: meeting.meetingId,
        powerLevels: {
          messaging: checked === true ? 0 : getPowerLevel(),
        },
      }).unwrap();
    },
    [meeting.meetingId, updateMeetingPermissions]
  );

  const isMessagingEnabled = useAppSelector((state) => {
    const event = selectRoomPowerLevelsEventByRoomId(state, meeting.meetingId);
    return event?.content.events_default === 0;
  });

  const titleId = useId();
  const messagingId = useId();

  return (
    <MeetingNotEndedGuard meeting={meeting} withMessage>
      <List
        aria-labelledby={titleId}
        dense
        subheader={
          <ListSubheader
            aria-hidden="true"
            disableGutters
            disableSticky
            id={titleId}
          >
            {t('meetingCard.editPermissions.menuTitle', 'Permissions')}
          </ListSubheader>
        }
      >
        <ListItem disableGutters>
          <FormControl fullWidth size="small">
            <FormControlLabel
              control={
                <Switch
                  checked={isMessagingEnabled}
                  disabled={isUpdating || !canUpdateMeetingPermissions}
                  id={messagingId}
                  inputProps={{ 'aria-describedby': ariaDescribedBy }}
                  onChange={handleChangeMessagingPermissions}
                  sx={{ mx: 2 }}
                />
              }
              label={t(
                'meetingCard.editPermissions.allowMessaging',
                'Allow messaging for all users'
              )}
            />
          </FormControl>
        </ListItem>
      </List>

      {(isError || data?.acknowledgement.error) && (
        <Alert severity="error">
          <AlertTitle>
            {t(
              'meetingCard.editPermissions.updateFailedTitle',
              'Failed to update the permissions'
            )}
          </AlertTitle>
          {t('meetingCard.editPermissions.updateFailed', 'Please try again.')}
        </Alert>
      )}

      {data?.acknowledgement.timeout && (
        <Alert role="status" severity="info">
          <AlertTitle>
            {t(
              'meetingCard.editPermissions.updateTimeoutTitle',
              'The request was sent'
            )}
          </AlertTitle>
          {t(
            'meetingCard.editPermissions.updateTimeout',
            'The change was submitted and will be applied soon.'
          )}
        </Alert>
      )}
    </MeetingNotEndedGuard>
  );
}
