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
import { ElementAvatar } from '@matrix-widget-toolkit/mui';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { useMemo } from 'react';
import {
  makeSelectAllRoomMemberEventsByRoomId,
  makeSelectRoomMemberEventByUserId,
} from '../../../reducer/meetingsApi/meetingsApi';
import { useAppSelector } from '../../../store';

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

  const displayName = memberEvent
    ? getRoomMemberDisplayName(memberEvent, allRoomMembers)
    : userId;

  return (
    <ElementAvatar
      className={className}
      userId={userId}
      displayName={displayName}
      avatarUrl={memberEvent?.content.avatar_url ?? undefined}
    />
  );
}
