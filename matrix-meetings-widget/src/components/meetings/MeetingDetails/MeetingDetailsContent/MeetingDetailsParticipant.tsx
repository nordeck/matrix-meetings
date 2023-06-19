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

import { ElementAvatar } from '@matrix-widget-toolkit/mui';
import { ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { useTranslation } from 'react-i18next';
import { ellipsis } from '../../../../lib/ellipsis';
import { MeetingParticipant } from '../../../../reducer/meetingsApi';
import { getParticipantMembership } from '../../MeetingCardEditParticipantsContent/ParticipantItem';

export function MeetingDetailsParticipant({
  participant,
  isOrganizer = false,
}: {
  participant: MeetingParticipant;
} & { isOrganizer?: boolean }) {
  const { t } = useTranslation();
  const titleId = useId();
  const subtitleId = useId();

  const secondaryText = getParticipantMembership(participant);
  return (
    <ListItem
      aria-describedby={secondaryText ? subtitleId : undefined}
      aria-labelledby={titleId}
      disableGutters
      divider={isOrganizer}
    >
      <ListItemIcon sx={{ mr: 1, minWidth: 0 }}>
        <ElementAvatar
          sx={{
            width: 32,
            height: 32,

            '&, &&.MuiChip-avatar': {
              fontSize: 25,
            },
          }}
          userId={participant.userId}
          displayName={participant.displayName}
          avatarUrl={
            participant.rawEvent.content.avatar_url
              ? participant.rawEvent.content.avatar_url
              : participant.displayName
          }
        />
      </ListItemIcon>

      <ListItemText
        primary={participant.displayName}
        primaryTypographyProps={{ sx: ellipsis, id: titleId }}
        secondary={
          isOrganizer
            ? t('meetingDetails.content.organizer', 'Organizer')
            : secondaryText
        }
        secondaryTypographyProps={{ id: subtitleId }}
      />
    </ListItem>
  );
}
