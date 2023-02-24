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

import { Meeting } from '../../../reducer/meetingsApi';

export type CreateMeeting = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  widgetIds: string[];
  participants: string[];
  rrule?: string | undefined;
};

export type ScheduleMeetingModalRequest = {
  meeting?: Meeting;
};

export type ScheduleMeetingModalResult = {
  meeting: CreateMeeting;
  type: typeof SubmitScheduleMeetingModal;
};

/**
 * An action that is triggered when the meeting schedule modal is canceled.
 */
export const CancelScheduleMeetingModal = 'nic.schedule.meeting.cancel';

/**
 * An action that is triggered when the meeting schedule modal is submitted.
 */
export const SubmitScheduleMeetingModal = 'nic.schedule.meeting.submit';

/**
 * Route of the schedule meeting modal.
 */
export const SCHEDULE_MEETING_MODAL_ROUTE = '/schedule-meeting';
