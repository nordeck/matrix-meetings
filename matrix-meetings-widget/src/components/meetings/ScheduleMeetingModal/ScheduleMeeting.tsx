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

import { getEnvironment } from '@matrix-widget-toolkit/mui';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  Alert,
  AlertTitle,
  FormControl,
  FormGroup,
  FormLabel,
  Grid,
  Stack,
  TextField,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { DateTime } from 'luxon';
import moment, { Moment } from 'moment';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getInitialMeetingTimes,
  isRecurringCalendarSourceEntry,
  parseICalDate,
} from '../../../lib/utils';
import {
  makeSelectAllRoomMemberEventsByRoomId,
  makeSelectMeeting,
  Meeting,
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
import { RecurrenceEditor } from '../RecurrenceEditor';
import { WidgetsSelectionDropdown } from '../WidgetsSelectionDropdown';
import { CreateMeeting } from './types';

export type ScheduleMeetingProps = {
  onMeetingChange: (meeting: CreateMeeting | undefined) => void;
  initialMeeting?: Meeting | undefined;
  showParticipants?: boolean;
  parentRoomId?: string;
};

const isParticipantSelectionEnabled =
  getEnvironment('REACT_APP_HIDE_USER_INVITE') !== 'true';

export const ScheduleMeeting = ({
  onMeetingChange,
  initialMeeting,
  showParticipants = true,
}: ScheduleMeetingProps) => {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const { initialStartDate, initialEndDate } = useMemo(
    getInitialMeetingTimes,
    []
  );
  const [isDirty, setIsDirty] = useState(false);
  const [title, setTitle] = useState(initialMeeting?.title ?? '');
  const [description, setDescription] = useState(
    initialMeeting?.description ?? ''
  );
  const [startDate, setStartDate] = useState(
    initialMeeting
      ? moment(
          parseICalDate(initialMeeting.calendarEntries[0].dtstart).toJSDate()
        )
      : moment(initialStartDate.toISO())
  );
  const [endDate, setEndDate] = useState(
    initialMeeting
      ? moment(
          parseICalDate(initialMeeting.calendarEntries[0].dtend).toJSDate()
        )
      : moment(initialEndDate.toISO())
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
  const [widgets, setWidgets] = useState<string[]>(
    () => initialMeeting?.widgets ?? []
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
      initialMeeting.recurrenceId
    );
  });

  const isMeetingCreation = !initialMeeting;
  const isEditingRecurringMeeting =
    initialMeeting &&
    isRecurringCalendarSourceEntry(initialMeeting.calendarEntries);
  const startDateReadOnly =
    !isEditingRecurringMeeting &&
    initialMeeting &&
    parseICalDate(initialMeeting.calendarEntries[0].dtstart) <= DateTime.now()
      ? t(
          'scheduleMeeting.meetingAlreadyStarted',
          'The meeting already started.'
        )
      : undefined;

  const selectAllRoomMemberEventsByRoomId = useMemo(
    makeSelectAllRoomMemberEventsByRoomId,
    []
  );

  const roomMembers = useAppSelector((state) =>
    selectAllRoomMemberEventsByRoomId(state, widgetApi.widgetParameters.roomId)
  );

  const handleChangeTitle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIsDirty(true);
      setTitle(e.target.value);
    },
    [setTitle]
  );

  const handleChangeDescription = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIsDirty(true);
      setDescription(e.target.value);
    },
    [setDescription]
  );

  const handleStartDateChange = useCallback(
    (value: Moment) => {
      setStartDate(value);
      setEndDate((currentEndDate) => {
        const currentDiff = value.diff(startDate);

        return moment(currentEndDate.toDate()).add(currentDiff);
      });
      setIsDirty(true);
    },
    [startDate]
  );

  const handleEndDateChange = useCallback((value: Moment) => {
    setEndDate(value);
    setIsDirty(true);
  }, []);

  const handleChangeParticipants = useCallback((participants: string[]) => {
    setIsDirty(true);
    setParticipants(participants);
  }, []);

  const handleChangeWidgets = useCallback(
    (value: string[]) => {
      setWidgets(value);

      // Skip setting it to dirty in the first call as the widget picker always
      // triggers once at startup
      if (widgets.length > 0) {
        setIsDirty(true);
      }
    },
    [widgets.length]
  );

  const handleChangeRecurrence = useCallback(
    (rrule: string | undefined, isValid: boolean, isDirty: boolean) => {
      setRecurrence({ rrule, isValid, isDirty });
    },
    []
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
      onMeetingChange({
        title: title.trim(),
        description,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        participants,
        widgetIds: widgets,
        rrule: recurrence.rrule,
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

  const titleId = useId();
  const descriptionId = useId();

  return (
    <MeetingNotEndedGuard meeting={initialMeeting} withMessage>
      {initialMeeting && (
        <MeetingHasBreakoutSessionsWarning meeting={initialMeeting} />
      )}

      {isEditingRecurringMeeting && (
        <Alert role="status" severity="info" sx={{ my: 1 }}>
          <AlertTitle>
            {t(
              'scheduleMeeting.recurringMeetingMessage.title',
              'You are editing a recurring meeting'
            )}
          </AlertTitle>
          {t(
            'scheduleMeeting.recurringMeetingMessage.message',
            'All instances of the recurring meeting are edited'
          )}
        </Alert>
      )}

      <Stack direction="column" flexWrap="wrap" p={1}>
        <TextField
          // don't use the required property of the text field because we don't
          // want it to add a asterisk (*) to the title.
          InputProps={{ required: true }}
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
          label={t('scheduleMeeting.description', 'Description')}
          margin="dense"
          minRows={2}
          multiline
          onChange={handleChangeDescription}
          value={description}
        />

        {showParticipants && isParticipantSelectionEnabled && (
          <MemberSelectionDropdown
            allMemberEvents={roomMembers}
            hasPowerToKickPopupContent={t(
              'scheduleMeeting.hasPowerToKickUser',
              "You don't have the permission to remove this participant."
            )}
            label={t('scheduleMeeting.participants', 'Participants')}
            meetingId={initialMeeting?.meetingId}
            onSelectedMembersUpdated={handleChangeParticipants}
            ownUserPopupContent={
              initialMeeting
                ? t(
                    'scheduleMeeting.cannotRemoveOwnUser',
                    "You can't remove yourself from the meeting."
                  )
                : t(
                    'scheduleMeeting.youAreAlwaysMember',
                    'The organizer will always join the meeting.'
                  )
            }
            selectedMembers={participants}
            showSelectAll
          />
        )}

        <WidgetsSelectionDropdown
          autoSelectAllWidgets={!initialMeeting}
          onChange={handleChangeWidgets}
          selectedWidgets={widgets}
        />

        {!isBreakoutSession && (
          <RecurrenceEditor
            isMeetingCreation={isMeetingCreation}
            onChange={handleChangeRecurrence}
            rule={recurrence.rrule}
            startDate={startDate.toDate()}
          />
        )}
      </Stack>
    </MeetingNotEndedGuard>
  );
};
