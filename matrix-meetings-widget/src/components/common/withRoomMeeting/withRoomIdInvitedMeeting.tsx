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

import { ComponentType, useMemo } from 'react';
import { makeSelectInvitedMeeting } from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { WithMeetingInvitationProps } from './types';

type WithRoomIdInvitedMeetingProps = {
  roomId: string | undefined;
};

/**
 * HOC that provides the meeting invitation of a selected room
 * to the {@link WrappedComponent}.
 * This will both provide meetings and breakout sessions.
 *
 * {@link WrappedComponent} should request {@link WithMeetingInvitationProps}.
 * The resulting component will requests {@link WithMeetingRoomIdProps}.
 *
 * @param WrappedComponent - a component that includes the props of {@link WithMeetingInvitationProps}.
 * @returns the given component with the additional {@link WithRoomIdInvitedMeetingProps} and without the props of {@link WithMeetingInvitationProps}, or an error state if the room contains no meeting.
 */
export function withRoomIdInvitedMeeting<T>(
  WrappedComponent: ComponentType<T & WithMeetingInvitationProps>,
): ComponentType<T & WithRoomIdInvitedMeetingProps> {
  return (props: T & WithRoomIdInvitedMeetingProps) => {
    const selectInvitedMeeting = useMemo(makeSelectInvitedMeeting, []);
    const meeting = useAppSelector((state) => {
      if (!props.roomId) {
        return undefined;
      }

      return selectInvitedMeeting(state, props.roomId);
    });

    if (!meeting) {
      return null;
    }

    return <WrappedComponent {...props} meeting={meeting} />;
  };
}
