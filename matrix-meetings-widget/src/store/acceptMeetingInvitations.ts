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

import { WidgetApi } from '@matrix-widget-toolkit/api';
import { isDefined } from '../lib/utils';
import {
  makeSelectAllMeetingIds,
  makeSelectMeeting,
} from '../reducer/meetingsApi';
import { RootState } from './store';

type AcceptInvitationsOpts = {
  userId: string | undefined;
  state: RootState;
  widgetApi: WidgetApi;
  acceptedMeetingIds: Set<string>;
};

/**
 * Automatically join a meeting invitation if the current user is the meeting
 * creator.
 *
 * @param param0 - {@link AcceptInvitationsOpts}
 */
export async function acceptMeetingInvitations({
  state,
  userId,
  widgetApi,
  acceptedMeetingIds,
}: AcceptInvitationsOpts) {
  const allMeetingIds = makeSelectAllMeetingIds({
    hasMemberId: userId,
    isChildOfRoomId: widgetApi.widgetParameters.roomId,
    includeBreakoutSessions: true,
    ignoreRecurrenceRulesAndDateFilters: true,
  })(state, {
    startDate: '0000-00-00T00:00:00Z',
    endDate: '9999-12-31T23:23:59Z',
  });

  const allMeetingMembers = allMeetingIds

    // get all meeting objects
    .map((roomId) =>
      makeSelectMeeting()(state, roomId.id, roomId.uid, roomId.recurrenceId)
    )

    // discard all meetings that are not created by the own user
    .filter((m) => m?.creator === userId)

    // discard all meetings without invitations
    .map((m) =>
      m?.participants.find(
        (p) => p.userId === userId && p.membership === 'invite'
      )
    )
    .filter(isDefined)

    // don't accept meetings that were already accepted
    .filter((m) => !acceptedMeetingIds.has(m.rawEvent.room_id));

  for (const member of allMeetingMembers) {
    try {
      acceptedMeetingIds.add(member.rawEvent.room_id);

      await widgetApi.sendStateEvent(
        member.rawEvent.type,
        {
          ...member.rawEvent.content,
          membership: 'join',
        },
        {
          roomId: member.rawEvent.room_id,
          stateKey: member.rawEvent.state_key,
        }
      );
    } catch (_) {
      acceptedMeetingIds.delete(member.rawEvent.room_id);
    }
  }
}
