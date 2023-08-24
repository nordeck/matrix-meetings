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

import { Skeleton } from '@mui/material';
import { ComponentType, useMemo } from 'react';
import { makeSelectMeeting } from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { WithMeetingProps } from './types';

type WithMeetingRoomIdProps = {
  roomId: string | undefined;
  uid: string | undefined;
  recurrenceId: string | undefined;
  meeting?: undefined;
};

/**
 * HOC that provides the meeting of a selected room to the {@link WrappedComponent}.
 * This will both provide meetings and breakout sessions.
 *
 * {@link WrappedComponent} should request {@link WithMeetingProps}.
 * The resulting component will requests {@link WithMeetingRoomIdProps}.
 *
 * @remarks Tests can also use {@link WithMeetingProps} to bypass the data loading.
 *
 * @param WrappedComponent - a component that includes the props of {@link WithMeetingProps}.
 * @returns the given component with the additional {@link WithMeetingRoomIdProps} and without the props of {@link WithMeetingProps}, or an error state if the room contains no meeting.
 */
export function withRoomIdMeeting<T>(
  WrappedComponent: ComponentType<T & WithMeetingProps>,
): ComponentType<T & (WithMeetingRoomIdProps | WithMeetingProps)> {
  return (props: T & (WithMeetingRoomIdProps | WithMeetingProps)) => {
    const selectMeeting = useMemo(makeSelectMeeting, []);
    const meeting = useAppSelector((state) => {
      if (!('roomId' in props) || !props.roomId || !props.uid) {
        return props.meeting;
      }

      return selectMeeting(state, props.roomId, props.uid, props.recurrenceId);
    });

    // TODO: what to do when we don't find a meeting?
    if (!meeting) {
      return (
        <Skeleton data-testid="skeleton" height={150} variant="rectangular" />
      );
    }

    return <WrappedComponent {...props} meeting={meeting} />;
  };
}
