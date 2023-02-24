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

export type AvailableWidget = {
  id: string;
  name: string;
};

export type MeetingSharingInformation = {
  jitsi: {
    // jitsi_dial_in_number
    dialInNumber?: string;
    // jitsi_pin
    pin?: number;
  };
};

export type MeetingsBotConfiguration = {
  jitsi: {
    dialInEnabled: boolean;
  };
  openXChange?: {
    meetingUrlTemplate?: string;
  };
};
