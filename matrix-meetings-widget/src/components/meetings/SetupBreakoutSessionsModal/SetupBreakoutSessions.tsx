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
  Box,
  FormControl,
  FormGroup,
  FormLabel,
  Grid,
  TextField,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import moment, { Moment } from 'moment';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getInitialMeetingTimes } from '../../../lib/utils';
import { Meeting } from '../../../reducer/meetingsApi';
import {
  EndDatePicker,
  EndTimePicker,
  StartDatePicker,
  StartTimePicker,
  useDatePickersState,
} from '../../common/DateTimePickers';
import { MeetingNotEndedGuard } from '../../common/MeetingNotEndedGuard';
import { WidgetsSelectionDropdown } from '../WidgetsSelectionDropdown';
import {
  BreakoutSessionGroup,
  BreakoutSessionGroupsForm,
} from './BreakoutSessionGroupsForm';
import { CreateBreakoutSessions } from './types';

export type SetupBreakoutSessionsProps = {
  onBreakoutSessionsChange: (value: CreateBreakoutSessions | undefined) => void;
  parentMeeting: Meeting;
};

export const SetupBreakoutSessions = ({
  onBreakoutSessionsChange,
  parentMeeting,
}: SetupBreakoutSessionsProps) => {
  const { t } = useTranslation();
  const { initialStartDate, initialEndDate } = useMemo(
    () => getInitialMeetingTimes({ parentMeeting }),
    [parentMeeting]
  );
  const [startDate, setStartDate] = useState(moment(initialStartDate.toISO()));
  const [endDate, setEndDate] = useState(moment(initialEndDate.toISO()));
  const [groups, setGroups] = useState<BreakoutSessionGroup[]>([]);
  const [description, setDescription] = useState('');
  const [widgets, setWidgets] = useState<Array<string>>([]);

  useEffect(() => {
    setStartDate(moment(initialStartDate.toISO()));
  }, [initialStartDate]);

  useEffect(() => {
    moment(initialEndDate.toISO());
  }, [initialEndDate]);

  const handleChangeDescription = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
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
    },
    [startDate]
  );

  const handleEndDateChange = useCallback((value: Moment) => {
    setEndDate(value);
  }, []);

  const { showDatePickers, startDateError, endDateError } = useDatePickersState(
    { parentMeeting, startTime: startDate, endTime: endDate }
  );

  useEffect(() => {
    if (
      startDateError ||
      endDateError ||
      groups.some((g) => !g.title || !g.members.length) ||
      !groups.length
    ) {
      onBreakoutSessionsChange(undefined);
    } else {
      onBreakoutSessionsChange({
        description,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        widgetIds: widgets,
        groups: groups.map((group) => ({
          title: group.title,
          participants: group.members,
        })),
      });
    }
  }, [
    description,
    endDate,
    endDateError,
    groups,
    onBreakoutSessionsChange,
    startDate,
    startDateError,
    widgets,
  ]);

  const descriptionId = useId();

  return (
    <MeetingNotEndedGuard
      meeting={parentMeeting}
      withMessage={t(
        'setupBreakoutSessions.meetingIsOver',
        'The meeting is over you can not create any new breakout sessions.'
      )}
    >
      <Box component="form" display="flex" flexWrap="wrap" p={1}>
        <TextField
          fullWidth
          id={descriptionId}
          label={t('setupBreakoutSessions.description', 'Description')}
          margin="normal"
          minRows={2}
          multiline
          onChange={handleChangeDescription}
          value={description}
        />

        <Grid container spacing={{ sm: showDatePickers ? 0 : 2, xs: 0 }}>
          <Grid item sm={showDatePickers ? 12 : 6} xs={12}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={visuallyHidden}>
                {t('setupBreakoutSessions.startAt', 'Start at')}
              </FormLabel>

              <FormGroup>
                <Grid container spacing={{ sm: 2, sx: 0 }}>
                  {showDatePickers && (
                    <Grid item sm={6} xs={12}>
                      <StartDatePicker
                        error={startDateError}
                        onChange={handleStartDateChange}
                        value={startDate}
                      />
                    </Grid>
                  )}

                  <Grid item sm={showDatePickers ? 6 : 12} xs={12}>
                    <StartTimePicker
                      error={startDateError}
                      hideHelperText={showDatePickers}
                      onChange={handleStartDateChange}
                      value={startDate}
                    />
                  </Grid>
                </Grid>
              </FormGroup>
            </FormControl>
          </Grid>

          <Grid item sm={showDatePickers ? 12 : 6} xs={12}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={visuallyHidden}>
                {t('setupBreakoutSessions.endAt', 'End at')}
              </FormLabel>

              <FormGroup>
                <Grid container spacing={{ sm: 2, sx: 0 }}>
                  {showDatePickers && (
                    <Grid item sm={6} xs={12}>
                      <EndDatePicker
                        error={endDateError}
                        onChange={handleEndDateChange}
                        value={endDate}
                      />
                    </Grid>
                  )}

                  <Grid item sm={showDatePickers ? 6 : 12} xs={12}>
                    <EndTimePicker
                      error={endDateError}
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

        <WidgetsSelectionDropdown
          autoSelectAllWidgets
          onChange={setWidgets}
          selectedWidgets={widgets}
        />

        <BreakoutSessionGroupsForm
          onGroupsChange={setGroups}
          parentMeeting={parentMeeting}
        />
      </Box>
    </MeetingNotEndedGuard>
  );
};
