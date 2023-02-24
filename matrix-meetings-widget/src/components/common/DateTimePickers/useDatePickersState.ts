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

import { DateTime } from 'luxon';
import moment, { Moment } from 'moment';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getInitialMeetingTimes } from '../../../lib/utils';
import { Meeting } from '../../../reducer/meetingsApi';
import { fullLongDateFormat, timeOnlyDateFormat } from './dateFormat';

type DatePickersState = {
  showDatePickers: boolean;
  minStartDate: Moment;
  startDateError: false | string;
  endDateError: false | string;
};

type UseDatePickersStateProps = {
  parentMeeting?: Meeting;
  startTime: Moment;
  endTime: Moment;
  minStartTimeOverride?: DateTime;
};

export function useDatePickersState({
  parentMeeting,
  startTime,
  endTime,
  minStartTimeOverride = undefined,
}: UseDatePickersStateProps): DatePickersState {
  const { t } = useTranslation();

  const { getMinStartDate, maxEndDate } = useMemo(
    () =>
      getInitialMeetingTimes({
        parentMeeting,
        minStartDateOverride: minStartTimeOverride,
      }),
    [parentMeeting, minStartTimeOverride]
  );

  return useMemo(() => {
    if (!parentMeeting) {
      // Meeting mode
      const startDateError =
        startTime.isBefore(moment(getMinStartDate().toISO())) &&
        t(
          'dateTimePickers.error.meetingStartTooEarly',
          'Meeting cannot start in the past.'
        );
      const endDateError =
        endTime.isSameOrBefore(startTime) &&
        t(
          'dateTimePickers.error.meetingStartBeforeEnd',
          'Meeting should start before it ends.'
        );

      return {
        showDatePickers: true,
        startDateError,
        endDateError,
        minStartDate: moment(getMinStartDate().toISO()),
      };
    } else {
      // Breakout session mode
      const isMeetingSpanningSingleDay = moment(
        getMinStartDate().toISO()
      ).isSame(moment(maxEndDate.toISO()), 'day');

      const isInvalidStartTime = !startTime.isBetween(
        moment(getMinStartDate().toISO()),
        moment(maxEndDate.toISO()),
        null,
        '[]'
      );
      const isInvalidEndTime = !endTime.isBetween(
        moment(getMinStartDate().toISO()),
        moment(maxEndDate.toISO()),
        null,
        '[]'
      );
      const endTimeBeforeStart = endTime.isBefore(startTime);

      const formatParams = isMeetingSpanningSingleDay
        ? timeOnlyDateFormat
        : fullLongDateFormat;

      const startDateError =
        isInvalidStartTime &&
        t(
          'dateTimePickers.error.breakoutSessionInvalidStartTime',
          'Breakout session should start between {{minDate, datetime}} and {{maxDate, datetime}}.',
          {
            minDate: moment(getMinStartDate().toISO()),
            maxDate: moment(maxEndDate.toISO()),
            formatParams: {
              minDate: formatParams,
              maxDate: formatParams,
            },
          }
        );

      const endDateError =
        (endTimeBeforeStart &&
          t(
            'dateTimePickers.error.breakoutSessionStartBeforeEnd',
            'Breakout session should start before it ends.'
          )) ||
        (isInvalidEndTime &&
          (t(
            'dateTimePickers.error.breakoutSessionInvalidEndTime',
            'Breakout session should end between {{minDate, datetime}} and {{maxDate, datetime}}.',
            {
              minDate: moment(getMinStartDate().toISO()),
              maxDate: moment(maxEndDate.toISO()),
              formatParams: {
                minDate: formatParams,
                maxDate: formatParams,
              },
            }
          ) as string));

      return {
        showDatePickers: !isMeetingSpanningSingleDay,
        startDateError,
        endDateError,
        minStartDate: moment(getMinStartDate().toISO()),
      };
    }
  }, [endTime, getMinStartDate, maxEndDate, parentMeeting, startTime, t]);
}
