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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { DateTime } from 'luxon';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getInitialMeetingTimes,
  isBotUser,
  isRecurringCalendarSourceEntry,
  parseICalDate,
} from '../../../lib/utils';
import {
  Meeting,
  makeSelectAllRoomMemberEventsByRoomId,
  makeSelectMeeting,
} from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import {
  EndDatePicker,
  EndTimePicker,
  StartDatePicker,
  StartTimePicker,
  useDatePickersState,
} from '../../common/DateTimePickers';
import { MeetingNotEndedGuard } from '../../common/MeetingNotEndedGuard';
import { MeetingHasBreakoutSessionsWarning } from '../MeetingCard/MeetingHasBreakoutSessionsWarning';
import { MemberSelectionDropdown } from '../MemberSelectionDropdown';
import { MemberSelection } from '../MemberSelectionDropdown/MemberSelectionDropdown';
import { RecurrenceEditor } from '../RecurrenceEditor';
import { WidgetsSelectionDropdown } from '../WidgetsSelectionDropdown';
import { getMessagingPowerLevel } from './getMessagingPowerLevel';
import { CreateMeeting } from './types';
import { useUserSearchResults } from './useUserSearchResults';

export type ScheduleMeetingProps = {
  onMeetingChange: (meeting: CreateMeeting | undefined) => void;
  initialMeeting?: Meeting | undefined;
  initialIsMessagingEnabled?: boolean;
  parentRoomId?: string;
};

export const ScheduleMeeting = ({
  onMeetingChange,
  initialMeeting,
  initialIsMessagingEnabled,
}: ScheduleMeetingProps) => {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const { initialStartDate, initialEndDate } = useMemo(
    getInitialMeetingTimes,
    [],
  );

  const [isDirty, setIsDirty] = useState(false);

  const [title, setTitle] = useState(initialMeeting?.title ?? '');
  const [description, setDescription] = useState(
    initialMeeting?.description ?? '',
  );
  const [startDate, setStartDate] = useState(
    initialMeeting
      ? DateTime.fromISO(initialMeeting.startTime)
      : initialStartDate,
  );
  const [endDate, setEndDate] = useState(
    initialMeeting ? DateTime.fromISO(initialMeeting.endTime) : initialEndDate,
  );

  const [participants, setParticipants] = useState<string[]>(() => {
    if (initialMeeting?.participants) {
      return initialMeeting?.participants.map((p) => p.userId);
    } else if (widgetApi.widgetParameters.userId) {
      return [widgetApi.widgetParameters.userId];
    } else {
      return [];
    }
  });

  const [participantTerm, setParticipantTerm] = useState('');

  const [isMessagingEnabledState, setIsMessagingEnabled] = useState<
    boolean | undefined
  >(undefined);

  const isMessagingEnabled =
    isMessagingEnabledState ?? initialIsMessagingEnabled;

  const [widgets, setWidgets] = useState<string[]>(
    () => initialMeeting?.widgets ?? [],
  );
  const [recurrence, setRecurrence] = useState<{
    rrule: string | undefined;
    isValid: boolean;
    isDirty: boolean;
  }>({
    rrule: initialMeeting?.calendarEntries[0].rrule,
    isValid: true,
    isDirty: false,
  });
  const selectMeeting = useMemo(makeSelectMeeting, []);
  const parentMeeting = useAppSelector((state) => {
    if (!initialMeeting?.parentRoomId) {
      return undefined;
    }

    return selectMeeting(
      state,
      initialMeeting.parentRoomId,
      initialMeeting.calendarUid,
      initialMeeting.recurrenceId,
    );
  });

  const isMeetingCreation = !initialMeeting;
  const isEditingRecurringMeeting =
    initialMeeting &&
    initialMeeting.recurrenceId === undefined &&
    isRecurringCalendarSourceEntry(initialMeeting.calendarEntries);
  const startDateReadOnly =
    !isEditingRecurringMeeting &&
    initialMeeting &&
    parseICalDate(initialMeeting.calendarEntries[0].dtstart) <= DateTime.now()
      ? t(
          'scheduleMeeting.meetingAlreadyStarted',
          'The meeting already started.',
        )
      : undefined;

  const selectAllRoomMemberEventsByRoomId = useMemo(
    makeSelectAllRoomMemberEventsByRoomId,
    [],
  );

  const roomMemberEvents = useAppSelector((state) =>
    selectAllRoomMemberEventsByRoomId(
      state,
      initialMeeting?.meetingId ?? widgetApi.widgetParameters.roomId,
    ),
  );

  // keeps users that were found via users directory search and selected
  const [selectedUsers, setSelectedUsers] = useState<MemberSelection[]>([]);

  const handleChangeTitle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIsDirty(true);
      setTitle(e.target.value);
    },
    [setTitle],
  );

  const handleChangeDescription = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIsDirty(true);
      setDescription(e.target.value);
    },
    [setDescription],
  );

  const handleStartDateChange = useCallback(
    (value: DateTime) => {
      setStartDate(value);
      setEndDate((currentEndDate) => {
        return currentEndDate.plus(value.diff(startDate));
      });
      setIsDirty(true);
    },
    [startDate],
  );

  const handleEndDateChange = useCallback((value: DateTime) => {
    setEndDate(value);
    setIsDirty(true);
  }, []);

  const { loading, results, error } = useUserSearchResults(
    participantTerm,
    100,
  );

  const userResults: MemberSelection[] = useMemo(
    () =>
      results
        .filter((r) => !participants.includes(r.userId) && !isBotUser(r.userId))
        .map((r) => ({
          userId: r.userId,
          displayName: r.displayName,
          avatarUrl: r.avatarUrl,
        })),
    [results, participants],
  );

  const selectedRoomMembers: MemberSelection[] = useMemo(
    () =>
      roomMemberEvents
        .filter((m) => participants.includes(m.state_key))
        .map((m) => ({
          userId: m.state_key,
          displayName: m.content.displayname ?? undefined,
          avatarUrl: m.content.avatar_url ?? undefined,
        })),
    [roomMemberEvents, participants],
  );

  const availableMembers = useMemo(
    () => [...selectedRoomMembers, ...selectedUsers, ...userResults],
    [selectedRoomMembers, selectedUsers, userResults],
  );

  const selectedMembers = useMemo(
    () =>
      [...selectedRoomMembers, ...selectedUsers].sort(
        (a, b) =>
          participants.indexOf(a.userId) - participants.indexOf(b.userId),
      ),
    [selectedRoomMembers, selectedUsers, participants],
  );

  const handleChangeParticipants = useCallback(
    (participants: string[]) => {
      const roomMemberIds = roomMemberEvents.map((m) => m.state_key);
      const userParticipants = participants.filter(
        (p) => !roomMemberIds.includes(p),
      );

      const newSelectedUsers = selectedUsers.filter((u) =>
        userParticipants.includes(u.userId),
      );

      const newSelectedUsersIds = newSelectedUsers.map((u) => u.userId);
      userParticipants
        .filter((u) => !newSelectedUsersIds.includes(u))
        .forEach((u) => {
          const result = userResults.find((r) => r.userId === u);
          if (result) {
            newSelectedUsers.push(result);
          }
        });

      setIsDirty(true);
      setParticipants(participants);
      setSelectedUsers(newSelectedUsers);
    },
    [roomMemberEvents, userResults, selectedUsers],
  );

  const handleInputChange = useCallback((value: string) => {
    setParticipantTerm(value);
  }, []);

  const handleChangeMessagingPermissions = useCallback(
    (_, checked: boolean) => {
      setIsDirty(true);
      setIsMessagingEnabled(checked);
    },
    [],
  );

  const handleChangeWidgets = useCallback(
    (value: string[]) => {
      setWidgets(value);

      // Skip setting it to dirty in the first call as the widget picker always
      // triggers once at startup
      if (widgets.length > 0) {
        setIsDirty(true);
      }
    },
    [widgets.length],
  );

  const handleChangeRecurrence = useCallback(
    (rrule: string | undefined, isValid: boolean, isDirty: boolean) => {
      setRecurrence({ rrule, isValid, isDirty });
    },
    [],
  );

  const minStartTimeOverride = isEditingRecurringMeeting
    ? parseICalDate(initialMeeting.calendarEntries[0].dtstart)
    : undefined;
  const { showDatePickers, startDateError, endDateError, minStartDate } =
    useDatePickersState({
      parentMeeting,
      startTime: startDate,
      endTime: endDate,
      minStartTimeOverride,
    });

  useEffect(() => {
    const startTimeError =
      (!initialMeeting || !startDateReadOnly) && startDateError;
    const isInvalid =
      !title || startTimeError || endDateError || !recurrence.isValid;
    if (isInvalid || (!recurrence.isDirty && !isDirty)) {
      onMeetingChange(undefined);
    } else {
      const messaging =
        isMessagingEnabled === undefined
          ? undefined
          : isMessagingEnabled
          ? 0
          : getMessagingPowerLevel();
      const powerLevels =
        messaging !== undefined
          ? {
              messaging,
            }
          : undefined;
      onMeetingChange({
        title: title.trim(),
        description,
        startTime: startDate.toISO(),
        endTime: endDate.toISO(),
        participants,
        powerLevels,
        widgetIds: widgets,
        rrule: !initialMeeting?.recurrenceId ? recurrence.rrule : undefined,
        recurrenceId: initialMeeting?.recurrenceId,
      });
    }
  }, [
    description,
    endDate,
    endDateError,
    initialMeeting,
    isDirty,
    onMeetingChange,
    participants,
    isMessagingEnabled,
    recurrence.isDirty,
    recurrence.isValid,
    recurrence.rrule,
    startDate,
    startDateError,
    startDateReadOnly,
    title,
    widgets,
  ]);

  const titleError = isDirty && !title;

  // initialMeeting can be undefined, but only if we create a normal meeting
  // because breakout sessions are created using a different form.
  const isBreakoutSession =
    initialMeeting?.type === 'net.nordeck.meetings.breakoutsession';

  const isEditingSingleRecurrence =
    initialMeeting && initialMeeting.recurrenceId !== undefined;

  const titleId = useId();
  const descriptionId = useId();
  const messagingId = useId();

  return (
    <MeetingNotEndedGuard meeting={initialMeeting} withMessage>
      {initialMeeting && (
        <MeetingHasBreakoutSessionsWarning meeting={initialMeeting} />
      )}

      <Stack direction="column" flexWrap="wrap" sx={{ px: 1, pt: 1 }}>
        <TextField
          // don't use the required property of the text field because we don't
          // want it to add a asterisk (*) to the title.
          InputProps={{ required: true }}
          // limit the title field analog to https://spec.matrix.org/v1.1/client-server-api/#mroomname
          inputProps={{ maxLength: 255 }}
          error={titleError}
          fullWidth
          helperText={
            titleError &&
            t('scheduleMeeting.titleHelperText', 'A title is required')
          }
          id={titleId}
          label={t('scheduleMeeting.title', 'Title (required)')}
          margin="dense"
          onChange={handleChangeTitle}
          value={title}
          sx={{ mt: 0 }}
          disabled={isEditingSingleRecurrence}
        />

        <Grid container>
          <Grid item xs={12}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={visuallyHidden}>
                {t('scheduleMeeting.startAt', 'Start at')}
              </FormLabel>

              <FormGroup>
                <Grid container spacing={{ sm: 2, xs: 0 }}>
                  {showDatePickers && (
                    <Grid item sm={6} xs={12}>
                      <StartDatePicker
                        error={isDirty && startDateError}
                        minDate={minStartDate}
                        onChange={handleStartDateChange}
                        readOnly={startDateReadOnly}
                        value={startDate}
                      />
                    </Grid>
                  )}

                  <Grid item sm={showDatePickers && 6} xs={12}>
                    <StartTimePicker
                      error={isDirty && startDateError}
                      hideHelperText={showDatePickers}
                      onChange={handleStartDateChange}
                      readOnly={startDateReadOnly}
                      value={startDate}
                    />
                  </Grid>
                </Grid>
              </FormGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={visuallyHidden}>
                {t('scheduleMeeting.endAt', 'End at')}
              </FormLabel>

              <FormGroup>
                <Grid container spacing={{ sm: 2, xs: 0 }}>
                  {showDatePickers && (
                    <Grid item sm={6} xs={12}>
                      <EndDatePicker
                        enablePast={isEditingRecurringMeeting}
                        error={isDirty && endDateError}
                        onChange={handleEndDateChange}
                        value={endDate}
                      />
                    </Grid>
                  )}

                  <Grid item sm={showDatePickers && 6} xs={12}>
                    <EndTimePicker
                      error={isDirty && endDateError}
                      hideHelperText={showDatePickers}
                      onChange={handleEndDateChange}
                      value={endDate}
                    />
                  </Grid>
                </Grid>
              </FormGroup>
            </FormControl>
          </Grid>
        </Grid>

        <TextField
          fullWidth
          id={descriptionId}
          inputProps={{ maxLength: 20000 }}
          label={t('scheduleMeeting.description', 'Description')}
          margin="dense"
          minRows={2}
          multiline
          onChange={handleChangeDescription}
          value={description}
          disabled={isEditingSingleRecurrence}
        />

        <MemberSelectionDropdown
          availableMembers={availableMembers}
          selectedMembers={selectedMembers}
          hasPowerToKickPopupContent={t(
            'scheduleMeeting.hasPowerToKickUser',
            "You don't have the permission to remove this participant.",
          )}
          label={t('scheduleMeeting.participants', 'Participants')}
          meetingId={initialMeeting?.meetingId}
          onSelectedMembersUpdated={handleChangeParticipants}
          onInputChange={handleInputChange}
          ownUserPopupContent={
            initialMeeting
              ? t(
                  'scheduleMeeting.cannotRemoveOwnUser',
                  "You can't remove yourself from the meeting.",
                )
              : t(
                  'scheduleMeeting.youAreAlwaysMember',
                  'The organizer will always join the meeting.',
                )
          }
          disableFilterOptions
          loading={loading}
          error={!!error}
          noOptionsText={
            participantTerm.length === 0
              ? t('scheduleMeeting.typeToSearch', 'Type to search for a user…')
              : t('memberSelectionDropdown.noMembers', 'No further members.')
          }
          disabled={isEditingSingleRecurrence}
        />

        <Stack direction="row" justifyContent="flex-end">
          <FormControl size="small" sx={{ mt: 1, mb: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={
                    isMessagingEnabled === undefined || isMessagingEnabled
                  }
                  id={messagingId}
                  onChange={handleChangeMessagingPermissions}
                  sx={{ ml: 2 }}
                />
              }
              label={t(
                'scheduleMeeting.allowMessaging',
                'Allow messaging for all participants',
              )}
              sx={{ mx: 0 }}
              labelPlacement="start"
              disabled={isEditingSingleRecurrence}
            />
          </FormControl>
        </Stack>

        <WidgetsSelectionDropdown
          autoSelectAllWidgets={!initialMeeting}
          onChange={handleChangeWidgets}
          selectedWidgets={widgets}
          disabled={isEditingSingleRecurrence}
        />

        {!isBreakoutSession && (
          <RecurrenceEditor
            isMeetingCreation={isMeetingCreation}
            onChange={handleChangeRecurrence}
            rule={recurrence.rrule}
            startDate={startDate.toJSDate()}
            disabled={isEditingSingleRecurrence}
          />
        )}
      </Stack>
    </MeetingNotEndedGuard>
  );
};
