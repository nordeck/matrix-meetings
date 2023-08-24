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
  MeetingSharingInformation,
  useGetConfigurationQuery,
  useGetMeetingSharingInformationQuery,
} from '../../../reducer/meetingBotApi';

type useJitsiDialInInformationResponse =
  | { isLoading: true; isError: false; data?: undefined }
  | {
      isLoading: false;
      isError: boolean;
      data?: MeetingSharingInformation['jitsi'];
    };

export function useJitsiDialInInformation(
  roomId: string,
): useJitsiDialInInformationResponse {
  const {
    data: configuration,
    isLoading: isLoadingConfiguration,
    isError: isErrorConfiguration,
  } = useGetConfigurationQuery();

  const {
    data: information,
    isLoading: isLoadingInformation,
    isError: isErrorInformation,
  } = useGetMeetingSharingInformationQuery({ roomId });

  // early exit if not configured. ignore all errors.
  if (
    !isLoadingConfiguration &&
    !isErrorConfiguration &&
    !configuration?.jitsi?.dialInEnabled
  ) {
    return {
      isLoading: false,
      isError: false,
      data: {},
    };
  }

  if (isLoadingConfiguration || isLoadingInformation) {
    return {
      isLoading: true,
      isError: false,
    };
  }

  if (isErrorConfiguration || isErrorInformation) {
    return {
      isError: true,
      isLoading: false,
    };
  }

  return {
    isLoading: false,
    isError: false,
    data: information?.jitsi ?? {},
  };
}
