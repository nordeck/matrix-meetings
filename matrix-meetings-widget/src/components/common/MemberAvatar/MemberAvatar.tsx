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

import { getRoomMemberDisplayName } from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { Avatar } from '@mui/material';
import { useMemo } from 'react';
import {
  makeSelectAllRoomMemberEventsByRoomId,
  makeSelectRoomMemberEventByUserId,
} from '../../../reducer/meetingsApi/meetingsApi';
import { useAppSelector } from '../../../store';
import { createUserAvatarUrl } from './createUserAvatarUrl';
import { getColor } from './getColor';
import { getInitialLetter } from './getInitialLetter';

export type MemberAvatarProps = {
  /** The id of the user */
  userId: string;

  /** The room of the user event. Defaults to the current room */
  roomId?: string;

  /** A css class that is added to the `<Avatar/>` component */
  className?: string;
};

export function MemberAvatar({ userId, roomId, className }: MemberAvatarProps) {
  const widgetApi = useWidgetApi();

  const selectAllRoomMemberEventsByRoomId = useMemo(
    makeSelectAllRoomMemberEventsByRoomId,
    []
  );
  const allRoomMembers = useAppSelector((state) =>
    selectAllRoomMemberEventsByRoomId(
      state,
      roomId ?? widgetApi.widgetParameters.roomId
    )
  );

  const selectRoomMemberEventByUserId = useMemo(
    makeSelectRoomMemberEventByUserId,
    []
  );
  const memberEvent = useAppSelector((state) =>
    selectRoomMemberEventByUserId(
      state,
      roomId ?? widgetApi.widgetParameters.roomId,
      userId
    )
  );

  const displayName = useMemo(
    () =>
      memberEvent
        ? getRoomMemberDisplayName(memberEvent, allRoomMembers)
        : userId,
    [allRoomMembers, memberEvent, userId]
  );

  const avatarUrl = useMemo(() => {
    const userAvatar = allRoomMembers.find((m) => m?.state_key === userId)
      ?.content.avatar_url;

    if (userAvatar) {
      return createUserAvatarUrl(userAvatar);
    } else {
      return undefined;
    }
  }, [allRoomMembers, userId]);

  return (
    <Avatar
      alt=""
      aria-hidden
      className={className}
      src={avatarUrl}
      sx={{
        // increase the specificity of the css selector to override styles of
        // chip or button components that provide their own css for avatars.
        '&, &&.MuiChip-avatar': {
          bgcolor: getColor(userId),
          fontSize: 18,
          width: 24,
          height: 24,
          color: 'white',
        },
      }}
    >
      {getInitialLetter(displayName)}
    </Avatar>
  );
}
