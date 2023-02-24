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
import { useEffect, useState } from 'react';
import { SetupBreakoutSessions } from './SetupBreakoutSessions';
import {
  CancelSetupBreakoutSessionsModal,
  CreateBreakoutSessions,
  SetupBreakoutSessionsModalData,
  SetupBreakoutSessionsModalResult,
  SubmitSetupBreakoutSessionsModal,
} from './types';

export const SetupBreakoutSessionsModal = () => {
  const widgetApi = useWidgetApi();
  // TODO: the widget config is always available for widgets. Maybe we want to change
  //       the interface to support both or throw when called from a non-modal?
  const widgetConfig =
    widgetApi.getWidgetConfig<SetupBreakoutSessionsModalData>()!;

  const [breakoutSessions, setBreakoutSessions] = useState<
    CreateBreakoutSessions | undefined
  >();
  const isValid = breakoutSessions !== undefined;

  useEffect(() => {
    widgetApi.setModalButtonEnabled(SubmitSetupBreakoutSessionsModal, isValid);
  }, [isValid, widgetApi]);

  useEffect(() => {
    const subscription = widgetApi
      .observeModalButtons()
      .subscribe(async (buttonId) => {
        switch (buttonId) {
          case CancelSetupBreakoutSessionsModal:
            await widgetApi.closeModal();
            break;

          case SubmitSetupBreakoutSessionsModal:
            if (breakoutSessions) {
              await widgetApi.closeModal<SetupBreakoutSessionsModalResult>({
                breakoutSessions,
                type: SubmitSetupBreakoutSessionsModal,
              });
            }
            break;
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [breakoutSessions, widgetApi]);

  return (
    <SetupBreakoutSessions
      onBreakoutSessionsChange={setBreakoutSessions}
      parentMeeting={widgetConfig.data.parentMeeting}
    />
  );
};
