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
  calculateUserPowerLevel,
  RoomMemberStateEventContent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  Autocomplete,
  AutocompleteRenderGetTagProps,
  Button,
  Chip,
  InputAdornment,
  ListItem,
  ListItemIcon,
  ListItemProps,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import React, {
  HTMLAttributes,
  ReactElement,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { shallowEqual } from 'react-redux';
import { ellipsis } from '../../../lib/ellipsis';
import { selectRoomPowerLevelsEventByRoomId } from '../../../reducer/meetingsApi';
import {
  filterAllRoomMemberEventsByRoomId,
  selectRoomMemberEventEntities,
} from '../../../reducer/meetingsApi/meetingsApi';
import { useAppSelector } from '../../../store';
import { MemberAvatar } from '../../common/MemberAvatar';

/**
 * Props for the {@link MemberSelectionDropdown} component.
 */
type MemberSelectionDropdownProps = {
  /** A list of all room member events */
  allMemberEvents: StateEvent<RoomMemberStateEventContent>[];

  /**
   * An optional list of member events that can be still selected.
   * These must not include any user that is part of `selectedMembers`.
   *
   * @remarks this is helpful if multiple inputs are used and a single
   *          user can only be part of a single group.
   */
  selectableMemberEvents?: StateEvent<RoomMemberStateEventContent>[];

  /** The selected of user ids of the members (state_key of `m.room.member`) */
  selectedMembers: string[];

  /** Is called when the selected members are updated */
  onSelectedMembersUpdated: (selectedMembers: string[]) => void;

  /** The label text for the input field */
  label: string;

  /** The content of the popup that is displayed when the user hovers over his own  */
  ownUserPopupContent: string;

  /** The content of the popup that is displayed when the user cannot kick user with higher power level */
  hasPowerToKickPopupContent?: string;

  /** meeting id */
  meetingId?: string;

  /** Show a button to select all members */
  showSelectAll?: boolean;
};

/**
 * A dropdown to select members from a list of `m.room.member` events.
 * The own user (as specified by the {@link WidgetApi}) can't be removed
 * from the selection.
 *
 * @param param0 - {@link MemberSelectionDropdownProps}
 */
export function MemberSelectionDropdown({
  selectedMembers,
  onSelectedMembersUpdated,
  allMemberEvents,
  selectableMemberEvents,
  label,
  showSelectAll,
  ownUserPopupContent,
  hasPowerToKickPopupContent,
  meetingId,
}: MemberSelectionDropdownProps): ReactElement {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();
  const instructionId = useId();
  const tagInstructionId = useId();
  const ownUserInstructionsId = useId();
  const hasPowerToKickUserId = useId();

  const allMembersInTheRoom = useAppSelector(
    (state) =>
      meetingId
        ? filterAllRoomMemberEventsByRoomId(
            selectRoomMemberEventEntities(state),
            meetingId
          ).map((e) => e.state_key)
        : [],
    shallowEqual
  );

  const availableMemberOptions = useMemo(() => {
    if (selectableMemberEvents) {
      return selectableMemberEvents.concat(
        allMemberEvents.filter(
          (m) =>
            selectedMembers.includes(m.state_key) &&
            !selectableMemberEvents.includes(m)
        )
      );
    }

    return allMemberEvents;
  }, [allMemberEvents, selectableMemberEvents, selectedMembers]);

  const selectedMemberOptions = useMemo(
    () =>
      allMemberEvents
        .filter((m) => selectedMembers.includes(m.state_key))
        .sort(
          (a, b) =>
            selectedMembers.indexOf(a.state_key) -
            selectedMembers.indexOf(b.state_key)
        ),
    [allMemberEvents, selectedMembers]
  );

  const powerLevelsEvent = useAppSelector(
    (state) => meetingId && selectRoomPowerLevelsEventByRoomId(state, meetingId)
  );

  const hasPowerToRemove = useCallback(
    (memberId: string) => {
      if (!powerLevelsEvent) {
        // See https://github.com/matrix-org/matrix-spec/blob/203b9756f52adfc2a3b63d664f18cdbf9f8bf126/data/event-schemas/schema/m.room.power_levels.yaml#L36-L43
        return true;
      }

      // power levels only apply if the user is part of the room. if the form
      // wasn't submitted yet, the values are not yet persisted in the rooms.
      if (!allMembersInTheRoom.includes(memberId)) {
        return true;
      }

      const ownUserPowerLevel = powerLevelsEvent
        ? calculateUserPowerLevel(
            powerLevelsEvent.content,
            widgetApi.widgetParameters.userId
          )
        : 0;

      const userPowerLevel = powerLevelsEvent
        ? calculateUserPowerLevel(powerLevelsEvent.content, memberId)
        : 0;

      return userPowerLevel < ownUserPowerLevel;
    },
    [allMembersInTheRoom, powerLevelsEvent, widgetApi.widgetParameters.userId]
  );

  const ensureUsers = useCallback(
    (members: StateEvent<RoomMemberStateEventContent>[]) => {
      const newMembers = members
        .map((m) => m.state_key)
        .filter(
          (m) => m !== widgetApi.widgetParameters.userId && hasPowerToRemove(m)
        );

      // add all users that are not kickable
      const notKickableUsers = selectedMembers.filter(
        (m) => m !== widgetApi.widgetParameters.userId && !hasPowerToRemove(m)
      );

      // the own user should always be the first entry
      newMembers.unshift(...notKickableUsers);

      if (
        widgetApi.widgetParameters.userId &&
        allMemberEvents.some(
          (e) => e.state_key === widgetApi.widgetParameters.userId
        )
      ) {
        newMembers.unshift(widgetApi.widgetParameters.userId);
      }

      return newMembers;
    },
    [
      allMemberEvents,
      hasPowerToRemove,
      selectedMembers,
      widgetApi.widgetParameters.userId,
    ]
  );

  const handleOnChange = useCallback(
    (
      _: React.SyntheticEvent<Element, Event>,
      value: StateEvent<RoomMemberStateEventContent>[]
    ) => {
      onSelectedMembersUpdated(ensureUsers(value));
    },
    [ensureUsers, onSelectedMembersUpdated]
  );

  const canSelectAll = selectedMembers.length === availableMemberOptions.length;
  const handleSelectAll = useCallback(() => {
    onSelectedMembersUpdated(ensureUsers(availableMemberOptions));
  }, [availableMemberOptions, ensureUsers, onSelectedMembersUpdated]);

  const renderInput = useCallback(
    (props) => {
      return (
        <TextField
          {...props}
          InputProps={{
            ...props.InputProps,
            margin: 'dense',
            'aria-describedby': instructionId,
            endAdornment: (
              <>
                {showSelectAll && (
                  <InputAdornment
                    position="end"
                    sx={{
                      right: 60,
                      top: 'calc(50%)',
                      position: 'absolute',
                    }}
                  >
                    <Button
                      color="inherit"
                      disabled={canSelectAll}
                      onClick={handleSelectAll}
                    >
                      {t('memberSelectionDropdown.selectAll', 'Select all')}
                    </Button>
                  </InputAdornment>
                )}
                {props.InputProps.endAdornment}
              </>
            ),
          }}
          label={label}
          size="medium"
        />
      );
    },
    [canSelectAll, handleSelectAll, instructionId, label, showSelectAll, t]
  );

  const getOptionLabel = useCallback(
    (o: StateEvent<RoomMemberStateEventContent>) =>
      o.content.displayname ?? o.state_key,
    []
  );

  const handleClickOwnUser = useCallback(() => {
    // No-op
  }, []);

  const renderTags = useCallback(
    (
      value: StateEvent<RoomMemberStateEventContent>[],
      getTagProps: AutocompleteRenderGetTagProps
    ) =>
      value.map((option, index) => {
        const { key, ...chipProps } = getTagProps({ index });
        const isOwnUser =
          option.state_key === widgetApi.widgetParameters.userId;

        const hasPowerToKickUser = hasPowerToRemove(option.state_key);

        if (isOwnUser || !hasPowerToKickUser) {
          return (
            <Tooltip
              describeChild
              key={index}
              title={
                // This fragment is intentional, so that the tooltip doesn't
                // apply the description as a title to the link. Instead we want
                // the text inside the link to be the accessible name.
                <>
                  {isOwnUser ? ownUserPopupContent : hasPowerToKickPopupContent}
                </>
              }
            >
              <Chip
                aria-describedby={
                  isOwnUser ? ownUserInstructionsId : hasPowerToKickUserId
                }
                avatar={<MemberAvatar userId={option.state_key} />}
                label={option.content.displayname ?? option.state_key}
                onClick={handleClickOwnUser}
                {...chipProps}
                onDelete={undefined}
              />
            </Tooltip>
          );
        }

        return (
          <Chip
            aria-describedby={tagInstructionId}
            avatar={<MemberAvatar userId={option.state_key} />}
            key={key}
            label={option.content.displayname ?? option.state_key}
            {...chipProps}
          />
        );
      }),
    [
      handleClickOwnUser,
      hasPowerToRemove,
      hasPowerToKickPopupContent,
      hasPowerToKickUserId,
      ownUserInstructionsId,
      ownUserPopupContent,
      tagInstructionId,
      widgetApi.widgetParameters.userId,
    ]
  );

  const renderOption = useCallback(
    (
      props: HTMLAttributes<HTMLLIElement>,
      option: StateEvent<RoomMemberStateEventContent>
    ) => (
      <MemberOption
        ListItemProps={props}
        key={option.state_key}
        member={option}
      />
    ),
    []
  );

  const id = useId();

  return (
    <>
      <Typography aria-hidden id={ownUserInstructionsId} sx={visuallyHidden}>
        {ownUserPopupContent}
      </Typography>
      <Typography aria-hidden id={hasPowerToKickUserId} sx={visuallyHidden}>
        {hasPowerToKickPopupContent}
      </Typography>

      <Typography aria-hidden id={instructionId} sx={visuallyHidden}>
        {t(
          'memberSelectionDropdown.instructions',
          '{{selectedCount}} of {{count}} entries selected. Use the left and right arrow keys to navigate between them. Use the up and down arrow key to navigate through the available options.',
          {
            selectedCount: selectedMemberOptions.length,
            count: availableMemberOptions.length,
          }
        )}
      </Typography>

      <Typography aria-hidden id={tagInstructionId} sx={visuallyHidden}>
        {t(
          'memberSelectionDropdown.tagInstructions',
          'Use the backspace key to delete the entry.'
        )}
      </Typography>

      <Autocomplete
        disableCloseOnSelect
        disablePortal
        filterSelectedOptions
        fullWidth
        getOptionLabel={getOptionLabel}
        id={id}
        multiple
        noOptionsText={t(
          'memberSelectionDropdown.noMembers',
          'No further members.'
        )}
        onChange={handleOnChange}
        options={availableMemberOptions}
        renderInput={renderInput}
        renderOption={renderOption}
        renderTags={renderTags}
        sx={{ my: 1 }}
        value={selectedMemberOptions}
      />
    </>
  );
}

function MemberOption({
  ListItemProps,
  member,
}: {
  ListItemProps: ListItemProps;
  member: StateEvent<RoomMemberStateEventContent>;
}) {
  const titleId = useId();

  return (
    <ListItem {...ListItemProps} aria-labelledby={titleId} dense>
      <ListItemIcon sx={{ mr: 1, minWidth: 0 }}>
        <MemberAvatar userId={member.state_key} />
      </ListItemIcon>

      <ListItemText
        id={titleId}
        primary={member.content.displayname ?? member.state_key}
        primaryTypographyProps={{ sx: ellipsis }}
      />
    </ListItem>
  );
}
