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
  CreateBreakoutSessionsOptions,
  Meeting,
} from '../../../reducer/meetingsApi';

export type SetupBreakoutSessionsModalData = {
  parentMeeting: Meeting;
};

export type CreateBreakoutSessions =
  CreateBreakoutSessionsOptions['breakoutSessions'];

export type SetupBreakoutSessionsModalResult = {
  breakoutSessions: CreateBreakoutSessions;
  type: typeof SubmitSetupBreakoutSessionsModal;
};

/**
 * An action that is triggered when the Breakoutsessions schedule modal is canceled.
 */
export const CancelSetupBreakoutSessionsModal =
  'nic.schedule.breakoutsessions.cancel';

/**
 * An action that is triggered when the Breakoutsessions schedule modal is submitted.
 */
export const SubmitSetupBreakoutSessionsModal =
  'nic.schedule.breakoutsessions.submit';

/**
 * Route of the schedule meeting modal.
 */
export const SETUP_BREAKOUT_SESSIONS_MODAL_ROUTE = '/setup-breakout-sessions';
