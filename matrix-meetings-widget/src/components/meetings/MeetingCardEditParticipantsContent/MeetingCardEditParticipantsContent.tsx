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

import { List, ListSubheader } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { useTranslation } from 'react-i18next';
import { Meeting, MeetingParticipant } from '../../../reducer/meetingsApi';
import { MeetingInvitationGuard } from '../../common/MeetingInvitationGuard';
import { ParticipantItem } from './ParticipantItem';

type MeetingCardEditParticipantsContentProps = {
  meeting: Meeting;
};

export function MeetingCardEditParticipantsContent({
  meeting,
}: MeetingCardEditParticipantsContentProps) {
  const { t } = useTranslation();

  const headerId = useId();

  return (
    <MeetingInvitationGuard meeting={meeting}>
      <List
        aria-labelledby={headerId}
        dense
        disablePadding
        subheader={
          <ListSubheader
            aria-hidden="true"
            disableGutters
            disableSticky
            id={headerId}
          >
            {t('meetingCard.editParticipants.menuTitle', 'Participants')}
          </ListSubheader>
        }
      >
        {meeting.participants.sort(sortByNameAndStatus).map((p) => (
          <ParticipantItem key={p.userId} participant={p} />
        ))}
      </List>
    </MeetingInvitationGuard>
  );
}

export function sortByNameAndStatus(
  a: MeetingParticipant,
  b: MeetingParticipant
) {
  if (a.membership === b.membership) {
    return a.displayName.localeCompare(b.displayName);
  }

  return (
    (a.membership === 'join' ? 0 : a.membership === 'invite' ? 1 : 2) -
    (b.membership === 'join' ? 0 : b.membership === 'invite' ? 1 : 2)
  );
}
