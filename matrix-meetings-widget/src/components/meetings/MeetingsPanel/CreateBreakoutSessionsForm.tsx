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

import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { ReactElement, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  withCurrentRoomMeeting,
  WithMeetingProps,
} from '../../common/withRoomMeeting';
import { useSetupBreakoutSessions } from '../SetupBreakoutSessionsModal';

export const CreateBreakoutSessionsForm = withCurrentRoomMeeting(
  function CreateBreakoutSessionsForm({
    meeting: parentMeeting,
  }: WithMeetingProps): ReactElement {
    const { t } = useTranslation();

    const { setupBreakoutSessions } = useSetupBreakoutSessions();
    const openModal = useCallback(async () => {
      await setupBreakoutSessions(parentMeeting);
    }, [setupBreakoutSessions, parentMeeting]);

    return (
      <Button
        fullWidth
        onClick={openModal}
        startIcon={<AddIcon />}
        variant="contained"
      >
        {t(
          'meetingsPanel.scheduleBreakoutSession',
          'Schedule Breakout Session'
        )}
      </Button>
    );
  }
);
