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

import { Alert } from '@mui/material';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

export function ScheduledDeletionWarning({
  deletionTime,
}: {
  deletionTime: string;
}) {
  const { t } = useTranslation();
  const { range, remainingTime } = humanizeRemainingTime(deletionTime);

  return (
    <Alert role="status" severity="warning">
      {range === 'soon'
        ? t(
            'meetingCard.meetingRoomWillBeDeletedSoon',
            'Meeting room will be automatically deleted soon.'
          )
        : t(
            'meetingCard.meetingRoomWillBeDeleted',
            'Meeting room will be automatically deleted {{remainingTime, relativetime}}.',
            {
              remainingTime,
              formatParams: { remainingTime: { range } },
            }
          )}
    </Alert>
  );
}

function humanizeRemainingTime(time: string):
  | {
      range: 'day' | 'hour' | 'minute';
      remainingTime: number;
    }
  | { range: 'soon'; remainingTime?: undefined } {
  const diff = DateTime.fromISO(time).diff(DateTime.now());
  const days = diff.as('day');

  if (days >= 1) {
    return { range: 'day', remainingTime: Math.floor(days) };
  }

  const hours = diff.as('hour');

  if (hours >= 1) {
    return { range: 'hour', remainingTime: Math.floor(hours) };
  }

  const minutes = diff.as('minute');

  if (minutes >= 1) {
    return { range: 'minute', remainingTime: Math.floor(minutes) };
  }

  return { range: 'soon' };
}
