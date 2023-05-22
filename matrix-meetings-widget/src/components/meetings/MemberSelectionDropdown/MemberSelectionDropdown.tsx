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
import { ElementAvatar } from '@matrix-widget-toolkit/mui';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  Alert,
  AlertTitle,
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
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { shallowEqual } from 'react-redux';
import { ellipsis } from '../../../lib/ellipsis';
import { isBotUser } from '../../../lib/utils';
import { selectRoomPowerLevelsEventByRoomId } from '../../../reducer/meetingsApi';
import {
  filterAllRoomMemberEventsByRoomId,
  selectRoomMemberEventEntities,
} from '../../../reducer/meetingsApi/meetingsApi';
import { useAppSelector } from '../../../store';
import { useUserSearchResults } from './useUserSearchResults';

/**
 * Props for the {@link MemberSelectionDropdown} component.
 */
type MemberSelectionDropdownProps = {
  /** Allows to search and invite users */
  searchHomeserverUsers?: boolean;

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

type MemberState = StateEvent<RoomMemberStateEventContent> | MemberSearchState;

type MemberSearchState = {
  state_key: string;

  content: {
    displayname?: string | null;
    avatar_url?: string | null;
  };
};

function isMemberSearchState(
  memberState: MemberState
): memberState is MemberSearchState {
  return (
    (memberState as StateEvent<RoomMemberStateEventContent>).content
      .membership === undefined
  );
}

/**
 * A dropdown to select members from a list of `m.room.member` events.
 * The own user (as specified by the {@link WidgetApi}) can't be removed
 * from the selection.
 *
 * @param param0 - {@link MemberSelectionDropdownProps}
 */
export function MemberSelectionDropdown({
  searchHomeserverUsers,
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

  const [term, setTerm] = useState('');

  const instructionId = useId();
  const tagInstructionId = useId();
  const ownUserInstructionsId = useId();
  const hasPowerToKickUserId = useId();

  const homeserverUsers: Record<string, MemberSearchState> = useMemo(
    () => ({}),
    []
  );

  const { loading, results, error } = useUserSearchResults(term, 100);

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

  const availableMemberOptions: MemberState[] = useMemo(() => {
    if (searchHomeserverUsers) {
      return results
        .filter(
          (r) => !selectedMembers.includes(r.userId) && !isBotUser(r.userId)
        )
        .map((r) => {
          return {
            content: {
              displayname: r.displayName,
              avatar_url: r.avatarUrl,
            },
            state_key: r.userId,
          };
        });
    }

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
  }, [
    searchHomeserverUsers,
    allMemberEvents,
    selectableMemberEvents,
    selectedMembers,
    results,
  ]);

  const selectedMemberOptions = useMemo(() => {
    return selectedMembers.flatMap(
      (selectedMember) =>
        allMemberEvents.find((m) => selectedMember === m.state_key) ??
        homeserverUsers[selectedMember] ??
        []
    );
  }, [allMemberEvents, homeserverUsers, selectedMembers]);

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
    (members: MemberState[]) => {
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
    (_: React.SyntheticEvent<Element, Event>, value: MemberState[]) => {
      const memberSearches = value.filter(isMemberSearchState);

      memberSearches
        .filter(
          (ms) =>
            !allMemberEvents.some((me) => me.state_key === ms.state_key) &&
            !homeserverUsers[ms.state_key]
        )
        .forEach((ms) => {
          homeserverUsers[ms.state_key] = ms;
        });

      const memberSearchUserIds = memberSearches.map((ms) => ms.state_key);
      Object.keys(homeserverUsers)
        .filter((key) => !memberSearchUserIds.includes(key))
        .forEach((key) => {
          delete homeserverUsers[key];
        });

      onSelectedMembersUpdated(ensureUsers(value));
    },
    [homeserverUsers, ensureUsers, onSelectedMembersUpdated, allMemberEvents]
  );

  const handleInputChange = useCallback(
    (_: React.SyntheticEvent<Element, Event>, value: string) => {
      setTerm(value);
    },
    []
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
                {showSelectAll && !searchHomeserverUsers && (
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
    [
      canSelectAll,
      handleSelectAll,
      instructionId,
      label,
      showSelectAll,
      searchHomeserverUsers,
      t,
    ]
  );

  const getOptionLabel = useCallback(
    (o: MemberState) => o.content.displayname ?? o.state_key,
    []
  );

  const filterOptions = useCallback((x: MemberState[]) => x, []);

  const handleClickOwnUser = useCallback(() => {
    // No-op
  }, []);

  const renderTags = useCallback(
    (value: MemberState[], getTagProps: AutocompleteRenderGetTagProps) =>
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
                avatar={
                  <ElementAvatar
                    userId={option.state_key}
                    displayName={option.content.displayname ?? undefined}
                    avatarUrl={option.content.avatar_url ?? undefined}
                  />
                }
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
            avatar={
              <ElementAvatar
                userId={option.state_key}
                displayName={option.content.displayname ?? undefined}
                avatarUrl={option.content.avatar_url ?? undefined}
              />
            }
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
    (props: HTMLAttributes<HTMLLIElement>, option: MemberState) => (
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
      {error && (
        <Alert severity="error" variant="outlined">
          <AlertTitle>
            {t(
              'memberSelectionDropdown.searchHomeserverUsersFailed',
              'Failed to search users on homeserver'
            )}
          </AlertTitle>
          {error.message}
        </Alert>
      )}

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
        filterSelectedOptions={!searchHomeserverUsers}
        fullWidth
        getOptionLabel={getOptionLabel}
        filterOptions={searchHomeserverUsers ? filterOptions : undefined}
        id={id}
        multiple
        loading={searchHomeserverUsers ? loading : undefined}
        noOptionsText={
          searchHomeserverUsers && term.length === 0
            ? t(
                'memberSelectionDropdown.typeToSearch',
                'Type to search for a user…'
              )
            : t('memberSelectionDropdown.noMembers', 'No further members.')
        }
        loadingText={t('memberSelectionDropdown.loading', 'Loading…')}
        onChange={handleOnChange}
        onInputChange={searchHomeserverUsers ? handleInputChange : undefined}
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
  member: MemberState;
}) {
  const titleId = useId();

  return (
    <ListItem {...ListItemProps} aria-labelledby={titleId} dense>
      <ListItemIcon sx={{ mr: 1, minWidth: 0 }}>
        <ElementAvatar
          userId={member.state_key}
          displayName={member.content.displayname ?? undefined}
          avatarUrl={member.content.avatar_url ?? undefined}
        />
      </ListItemIcon>

      <ListItemText
        id={titleId}
        primary={member.content.displayname ?? member.state_key}
        primaryTypographyProps={{ sx: ellipsis }}
      />
    </ListItem>
  );
}
