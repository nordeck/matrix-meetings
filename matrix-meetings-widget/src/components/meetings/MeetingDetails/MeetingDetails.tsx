/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { Divider } from '@mui/material';
import {
  WithMeetingProps,
  withRoomIdMeeting,
} from '../../common/withRoomMeeting';
import { MeetingDetailsContent } from './MeetingDetailsContent';
import { MeetingDetailsHeader } from './MeetingDetailsHeader';

type MeetingDetailsProps = WithMeetingProps & {
  /** The id for the title element */
  titleId?: string;

  /** The id of the meeting time element */
  meetingTimeId?: string;

  onClose?: () => void;

  hideJoinButton?: boolean;
};

export const MeetingDetails = withRoomIdMeeting(
  ({
    meeting,
    titleId,
    meetingTimeId,
    onClose,
    hideJoinButton,
  }: MeetingDetailsProps) => {
    return (
      <div role="region" aria-label="Meeting details">
        <MeetingDetailsHeader
          meeting={meeting}
          onClose={onClose}
          titleId={titleId}
          hideJoinButton={hideJoinButton}
        />
        <Divider variant="middle" />
        <MeetingDetailsContent
          meeting={meeting}
          meetingTimeId={meetingTimeId}
        />
      </div>
    );
  }
);
