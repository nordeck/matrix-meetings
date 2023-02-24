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

import { Palette } from '@mui/material';
import { t } from 'i18next';
import { DateTime } from 'luxon';

export type TimeDistanceState =
  | {
      renderLabel: false;
      updateInterval: number | null;
    }
  | {
      renderLabel: true;
      updateInterval: number;
      animated: boolean;
      labelColor: keyof Palette;
      labelText: string;
      rotateIcon: boolean;
    };

type GetTimeDistanceStateProps = {
  now: string;
  startDate: string;
  endDate: string;
};

export function getTimeDistanceState({
  now,
  startDate,
  endDate,
}: GetTimeDistanceStateProps): TimeDistanceState {
  const startDiff = DateTime.fromISO(startDate).diff(DateTime.fromISO(now));
  const startHours = startDiff.as('hour');
  const startMinutes = startDiff.as('minute');
  const startDurationFormat =
    startHours >= 1.0 ? 'hh:mm:ss' : startMinutes >= 1.0 ? 'mm:ss' : 'ss';

  const endDiff = DateTime.fromISO(endDate).diff(DateTime.fromISO(now));
  const endHours = endDiff.as('hour');
  const endMinutes = endDiff.as('minute');
  const endDurationFormat =
    endHours >= 1.0 ? 'hh:mm:ss' : endMinutes >= 1.0 ? 'mm:ss' : 'ss';

  // Meeting is more than 8 hours in the future
  if (startHours > 8) {
    return {
      renderLabel: false,
      updateInterval: 30 * 60 * 1000,
    };
  }

  // Meeting starts in 1 to 8 hours
  if (startMinutes >= 60) {
    return {
      renderLabel: true,
      updateInterval: 5 * 60 * 1000,
      animated: false,
      labelText: t('timeDistance.futureText', '{{duration, relativetime}}', {
        duration: Math.floor(startHours),
        formatParams: { duration: { range: 'hour' } },
      }),
      labelColor: 'info',
      rotateIcon: false,
    };
  }

  // meeting starts in 5 to 60 minutes
  if (startMinutes > 5) {
    return {
      renderLabel: true,
      updateInterval: 60 * 1000,
      animated: false,
      labelText: t('timeDistance.futureText', '{{duration, relativetime}}', {
        duration: Math.floor(startMinutes),
        formatParams: { duration: { range: 'minute' } },
      }),
      labelColor: 'info',
      rotateIcon: false,
    };
  }

  // meeting starts in less than 5 minutes
  if (startMinutes > 1) {
    return {
      renderLabel: true,
      updateInterval: 1000,
      animated: true,
      labelText: t('timeDistance.futureText', '{{duration, relativetime}}', {
        duration: Math.floor(startMinutes),
        formatParams: { duration: { range: 'minute' } },
      }),
      labelColor: 'warning',
      rotateIcon: false,
    };
  }

  // meeting starts in less than 1 minute
  if (startHours > 0) {
    return {
      renderLabel: true,
      updateInterval: 1000,
      animated: true,
      labelText: t('timeDistance.futureTextExact', 'in {{duration}}', {
        duration: startDiff.toFormat(startDurationFormat),
      }),
      labelColor: 'error',
      rotateIcon: false,
    };
  }

  // the meeting is still running for more than one hour
  if (endMinutes >= 60) {
    return {
      renderLabel: true,
      updateInterval: 1000,
      animated: false,
      labelText: t(
        'timeDistance.remainingText',
        'Ends {{duration, relativetime}}',
        {
          duration: Math.floor(endHours),
          formatParams: { duration: { range: 'hour' } },
        }
      ),
      labelColor: 'primary',
      rotateIcon: true,
    };
  }

  // the meeting is still running for more than one minute
  if (endMinutes > 1) {
    return {
      renderLabel: true,
      updateInterval: 1000,
      animated: false,
      labelText: t(
        'timeDistance.remainingText',
        'Ends {{duration, relativetime}}',
        {
          duration: Math.floor(endMinutes),
          formatParams: { duration: { range: 'minutes' } },
        }
      ),
      labelColor: 'primary',
      rotateIcon: true,
    };
  }

  // the meeting is running
  if (endMinutes > 0) {
    return {
      renderLabel: true,
      updateInterval: 1000,
      animated: false,
      labelText: t('timeDistance.remainingTextExact', 'Ends in {{duration}}', {
        duration: endDiff.toFormat(endDurationFormat),
      }),
      labelColor: 'primary',
      rotateIcon: true,
    };
  }

  // stop rendering a label for this meeting
  return {
    updateInterval: null,
    renderLabel: false,
  };
}
