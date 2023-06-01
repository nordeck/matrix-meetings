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

import { calculateUserPowerLevel } from '@matrix-widget-toolkit/api';
import { ElementAvatar } from '@matrix-widget-toolkit/mui';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  Autocomplete,
  AutocompleteRenderGetTagProps,
  Chip,
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
  ReactNode,
  useCallback,
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

/**
 * Props for the {@link MemberSelectionDropdown} component.
 */
type MemberSelectionDropdownProps = {
  /** The available member options */
  availableMembers: MemberSelection[];

  /** The selected members */
  selectedMembers: MemberSelection[];

  /** Is called when the selected members are updated */
  onSelectedMembersUpdated: (selectedMembers: string[]) => void;

  /** Is called when the input value changes */
  onInputChange?: (value: string) => void;

  /** The label text for the input field */
  label: string;

  /** The content of the popup that is displayed when the user hovers over his own  */
  ownUserPopupContent: string;

  /** The content of the popup that is displayed when the user cannot kick user with higher power level */
  hasPowerToKickPopupContent?: string;

  /** meeting id */
  meetingId?: string;

  /** Disables options filtering, makes sense when options are filtered already */
  disableFilterOptions?: boolean;

  /** If true, it shows the loadingText in place of suggestions. */
  loading?: boolean;

  /** Text to display when there are no options. */
  noOptionsText?: ReactNode;

  /** Text to display when in a loading state. */
  loadingText?: ReactNode;
};

export type MemberSelection = {
  state_key: string;

  content: {
    displayname?: string | null;
    avatar_url?: string | null;
  };
};

/**
 * A dropdown to select members from a list of `m.room.member` events.
 * The own user (as specified by the {@link WidgetApi}) can't be removed
 * from the selection.
 *
 * @param param0 - {@link MemberSelectionDropdownProps}
 */
export function MemberSelectionDropdown({
  availableMembers,
  selectedMembers,
  onSelectedMembersUpdated,
  onInputChange,
  label,
  ownUserPopupContent,
  hasPowerToKickPopupContent,
  meetingId,
  disableFilterOptions,
  loading,
  noOptionsText,
  loadingText,
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
    (members: MemberSelection[]) => {
      const newMembers = members
        .map((m) => m.state_key)
        .filter(
          (m) => m !== widgetApi.widgetParameters.userId && hasPowerToRemove(m)
        );

      // add all users that are not kickable
      const notKickableUsers = selectedMembers
        .map((m) => m.state_key)
        .filter(
          (m) => m !== widgetApi.widgetParameters.userId && !hasPowerToRemove(m)
        );

      // the own user should always be the first entry
      newMembers.unshift(...notKickableUsers);

      if (
        widgetApi.widgetParameters.userId &&
        availableMembers.some(
          (e) => e.state_key === widgetApi.widgetParameters.userId
        )
      ) {
        newMembers.unshift(widgetApi.widgetParameters.userId);
      }

      return newMembers;
    },
    [
      availableMembers,
      hasPowerToRemove,
      selectedMembers,
      widgetApi.widgetParameters.userId,
    ]
  );

  const handleOnChange = useCallback(
    (_: React.SyntheticEvent<Element, Event>, value: MemberSelection[]) => {
      onSelectedMembersUpdated(ensureUsers(value));
    },
    [ensureUsers, onSelectedMembersUpdated]
  );

  const handleInputChange = useCallback(
    (_: React.SyntheticEvent<Element, Event>, value: string) => {
      onInputChange?.(value);
    },
    [onInputChange]
  );

  const renderInput = useCallback(
    (props) => {
      return (
        <TextField
          {...props}
          InputProps={{
            ...props.InputProps,
            margin: 'dense',
            'aria-describedby': instructionId,
          }}
          label={label}
          size="medium"
        />
      );
    },
    [instructionId, label]
  );

  const getOptionLabel = useCallback(
    (o: MemberSelection) => o.content.displayname ?? o.state_key,
    []
  );

  const filterOptionsDisabled = useCallback((x: MemberSelection[]) => x, []);

  const handleClickOwnUser = useCallback(() => {
    // No-op
  }, []);

  const renderTags = useCallback(
    (value: MemberSelection[], getTagProps: AutocompleteRenderGetTagProps) =>
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
    (props: HTMLAttributes<HTMLLIElement>, option: MemberSelection) => (
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
            selectedCount: selectedMembers.length,
            count: availableMembers.length,
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
        filterOptions={disableFilterOptions ? filterOptionsDisabled : undefined}
        id={id}
        multiple
        loading={loading}
        noOptionsText={noOptionsText}
        loadingText={loadingText}
        onChange={handleOnChange}
        onInputChange={handleInputChange}
        options={availableMembers}
        renderInput={renderInput}
        renderOption={renderOption}
        renderTags={renderTags}
        sx={{ my: 1 }}
        value={selectedMembers}
      />
    </>
  );
}

function MemberOption({
  ListItemProps,
  member,
}: {
  ListItemProps: ListItemProps;
  member: MemberSelection;
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
