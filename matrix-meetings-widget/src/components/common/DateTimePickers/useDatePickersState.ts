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

import { DateTime, Interval } from 'luxon';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getInitialMeetingTimes } from '../../../lib/utils';
import { Meeting } from '../../../reducer/meetingsApi';
import { fullLongDateFormat, timeOnlyDateFormat } from './dateFormat';

type DatePickersState = {
  showDatePickers: boolean;
  minStartDate: DateTime;
  startDateError: false | string;
  endDateError: false | string;
};

type UseDatePickersStateProps = {
  parentMeeting?: Meeting;
  startTime: DateTime;
  endTime: DateTime;
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
        startTime < getMinStartDate() &&
        t(
          'dateTimePickers.error.meetingStartTooEarly',
          'Meeting cannot start in the past.'
        );
      const endDateError =
        endTime <= startTime &&
        t(
          'dateTimePickers.error.meetingStartBeforeEnd',
          'Meeting should start before it ends.'
        );

      return {
        showDatePickers: true,
        startDateError,
        endDateError,
        minStartDate: getMinStartDate(),
      };
    } else {
      // Breakout session mode
      const isMeetingSpanningSingleDay = getMinStartDate().hasSame(
        maxEndDate,
        'day'
      );

      const isInvalidStartTime = !Interval.fromDateTimes(
        getMinStartDate(),
        maxEndDate.plus(1)
      ).contains(startTime);
      const isInvalidEndTime = !Interval.fromDateTimes(
        getMinStartDate(),
        maxEndDate.plus(1)
      ).contains(endTime);
      const endTimeBeforeStart = endTime < startTime;

      const formatParams = isMeetingSpanningSingleDay
        ? timeOnlyDateFormat
        : fullLongDateFormat;

      const startDateError =
        isInvalidStartTime &&
        t(
          'dateTimePickers.error.breakoutSessionInvalidStartTime',
          'Breakout session should start between {{minDate, datetime}} and {{maxDate, datetime}}.',
          {
            minDate: getMinStartDate(),
            maxDate: maxEndDate,
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
              minDate: getMinStartDate(),
              maxDate: maxEndDate,
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
        minStartDate: getMinStartDate(),
      };
    }
  }, [endTime, getMinStartDate, maxEndDate, parentMeeting, startTime, t]);
}
