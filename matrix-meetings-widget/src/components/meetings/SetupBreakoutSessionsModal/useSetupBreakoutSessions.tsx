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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { ModalButtonKind } from 'matrix-widget-api';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Meeting,
  useCreateBreakoutSessionsMutation,
} from '../../../reducer/meetingsApi';
import {
  CancelSetupBreakoutSessionsModal,
  SETUP_BREAKOUT_SESSIONS_MODAL_ROUTE,
  SetupBreakoutSessionsModalData,
  SetupBreakoutSessionsModalResult,
  SubmitSetupBreakoutSessionsModal,
} from './types';

export function useSetupBreakoutSessions(): {
  setupBreakoutSessions: (parentMeeting: Meeting) => Promise<void>;
} {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const [createBreakoutSessions] = useCreateBreakoutSessionsMutation();
  const setupBreakoutSessions = useCallback(
    async (parentMeeting: Meeting) => {
      const data = await widgetApi.openModal<
        SetupBreakoutSessionsModalResult,
        SetupBreakoutSessionsModalData
      >(
        SETUP_BREAKOUT_SESSIONS_MODAL_ROUTE,
        t('setupBreakoutSessionsModal.title', 'Schedule Breakout Session'),
        {
          buttons: [
            {
              id: SubmitSetupBreakoutSessionsModal,
              kind: ModalButtonKind.Primary,
              label: t(
                'setupBreakoutSessionsModal.create',
                'Create Breakout Session'
              ),
              disabled: true,
            },
            {
              id: CancelSetupBreakoutSessionsModal,
              kind: ModalButtonKind.Secondary,
              label: t('setupBreakoutSessionsModal.cancel', 'Cancel'),
            },
          ],
          data: { parentMeeting },
        }
      );

      if (data && data.type === SubmitSetupBreakoutSessionsModal) {
        await createBreakoutSessions({
          breakoutSessions: data.breakoutSessions,
        }).unwrap();

        // TODO: what if an error occurs?
      }
    },
    [widgetApi, t, createBreakoutSessions]
  );

  return { setupBreakoutSessions };
}
