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
import { getCalendarEvent } from '@nordeck/matrix-meetings-calendar';
import { ComponentType, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { selectNordeckMeetingMetadataEventByRoomId } from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { useUpdateOnDate } from '../hooks';
import { WithMeetingProps } from './types';
import { withRoomIdMeeting } from './withRoomIdMeeting';

/**
 * HOC that provides the meeting of the current room to the {@link WrappedComponent}.
 * This will both provide meetings and breakout sessions.
 *
 * @param WrappedComponent - a component that includes the props of {@link WithMeetingProps}.
 * @returns the given component without the props of {@link WithMeetingProps} or an error state if the room contains no meeting.
 */
export function withCurrentRoomMeeting<T>(
  WrappedComponent: ComponentType<T & WithMeetingProps>,
): ComponentType<T> {
  return (props: T) => {
    const widgetApi = useWidgetApi();

    const entry = useAppSelector((state) => {
      if (widgetApi.widgetParameters.roomId) {
        const metadata = selectNordeckMeetingMetadataEventByRoomId(
          state,
          widgetApi.widgetParameters.roomId,
        );

        return metadata
          ? getCalendarEvent(metadata.content.calendar)
          : undefined;
      }

      return undefined;
    }, shallowEqual);

    const NewComponent = useMemo(() => withRoomIdMeeting(WrappedComponent), []);

    // As the meeting is the current instance of a recurring meeting, we have
    // to reevaluate the meeting every time the end of the meeting instance is
    // reached!
    useUpdateOnDate(entry?.endTime);

    return (
      <NewComponent
        {...props}
        recurrenceId={entry?.recurrenceId}
        roomId={widgetApi.widgetParameters.roomId}
        uid={entry?.uid}
      />
    );
  };
}
