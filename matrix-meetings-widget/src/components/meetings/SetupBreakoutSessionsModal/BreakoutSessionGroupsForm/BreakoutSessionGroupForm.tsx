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
  RoomMemberStateEventContent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { Box, Card, CardContent, TextField } from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { ChangeEvent, ReactElement, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MemberSelectionDropdown } from '../../MemberSelectionDropdown';
import { BreakoutSessionGroup } from './types';

type BreakoutSessionGroupFormProps = {
  group: BreakoutSessionGroup;
  onGroupChange: (group: Partial<BreakoutSessionGroup>) => void;
  allMemberEvents: StateEvent<RoomMemberStateEventContent>[];
  selectableMemberEvents: StateEvent<RoomMemberStateEventContent>[];
};

export function BreakoutSessionGroupForm({
  group,
  onGroupChange,
  allMemberEvents,
  selectableMemberEvents,
}: BreakoutSessionGroupFormProps): ReactElement {
  const { t } = useTranslation();
  const isTitleEmpty = group.title.length === 0;

  const handleChangeTitle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onGroupChange({
        title: e.target.value,
      });
    },
    [onGroupChange]
  );

  const handleChangeMembers = useCallback(
    (members: string[]) => {
      onGroupChange({ members });
    },
    [onGroupChange]
  );

  const titleId = useId();
  const cardId = useId();

  const availableMembers = useMemo(() => {
    return selectableMemberEvents.concat(
      allMemberEvents.filter(
        (m) =>
          group.members.includes(m.state_key) &&
          !selectableMemberEvents.includes(m)
      )
    );
  }, [selectableMemberEvents, allMemberEvents, group.members]);

  const filteredSelectedMembers = useMemo(() => {
    return allMemberEvents
      .filter((m) => group.members.includes(m.state_key))
      .sort(
        (a, b) =>
          group.members.indexOf(a.state_key) -
          group.members.indexOf(b.state_key)
      );
  }, [group.members, allMemberEvents]);

  return (
    <Card aria-labelledby={cardId} component="li" elevation={0} sx={{ mt: 2 }}>
      <Box id={cardId} sx={visuallyHidden}>
        {group.title}
      </Box>

      <CardContent>
        <TextField
          // don't use the required property of the text field because we don't
          // want it to add a asterisk (*) to the title.
          InputProps={{ required: true }}
          error={isTitleEmpty}
          fullWidth
          helperText={
            isTitleEmpty &&
            t(
              'breakoutSessionGroup.groupTitleHelperText',
              'A title is required'
            )
          }
          id={titleId}
          label={t('breakoutSessionGroup.groupTitle', 'Group title (required)')}
          margin="dense"
          onChange={handleChangeTitle}
          value={group.title}
        />

        <MemberSelectionDropdown
          availableMembers={availableMembers}
          selectedMembers={filteredSelectedMembers}
          label={t('breakoutSessionGroup.selectUser', 'Select participants')}
          onSelectedMembersUpdated={handleChangeMembers}
          ownUserPopupContent={t(
            'breakoutSessionGroup.youAreAlwaysMember',
            'The organizer will always join all breakout sessions.'
          )}
          noOptionsText={t(
            'memberSelectionDropdown.noMembers',
            'No further members.'
          )}
        />
      </CardContent>
    </Card>
  );
}
