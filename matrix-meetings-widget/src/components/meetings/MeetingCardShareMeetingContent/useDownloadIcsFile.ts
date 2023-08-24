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

import ical from 'ical-generator';
import { isArray } from 'lodash';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { tzlib_get_ical_block } from 'timezones-ical-library';
import { parseICalDate } from '../../../lib/utils';
import { Meeting } from '../../../reducer/meetingsApi';
import { useMeetingEmail } from './useMeetingEmail';
import { useMeetingUrl } from './useMeetingUrl';

type UseDownloadIcsFile = {
  href: string | undefined;
  filename: string;
  error: string | undefined;
};

export function useDownloadIcsFile(meeting: Meeting): UseDownloadIcsFile {
  const { url } = useMeetingUrl(meeting);
  const { message } = useMeetingEmail(meeting);

  const filename = useMemo(
    () =>
      `${meeting.title}_${DateTime.fromISO(meeting.startTime).toFormat(
        'yyyyLLdd_HHmm',
      )}.ics`,
    [meeting.startTime, meeting.title],
  );

  const [blobUrl, setBlobUrl] = useState<string | undefined>();

  useEffect(() => {
    const value = createIcsFile(meeting, url, message);

    if (value) {
      const blob = new Blob([value]);

      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setBlobUrl('');
    }

    return () => {};
  }, [meeting, message, url]);

  return useMemo(
    () => ({
      href: blobUrl,
      filename,
      error: undefined,
    }),
    [blobUrl, filename],
  );
}

export function createIcsFile(
  meeting: Meeting,
  meetingUrl: string,
  message: string,
): string | undefined {
  const cal = ical();

  // TODO: consider all entries (incl recurrenceId and exdate)

  if (meeting.calendarEntries[0].dtstart.tzid !== 'UTC') {
    cal.timezone({
      name: meeting.calendarEntries[0].dtstart.tzid,
      generator: generateVTimezone,
    });
  }

  cal.createEvent({
    id: `${meeting.meetingId}-${meeting.calendarUid}`,
    summary: meeting.title,
    stamp: DateTime.now(),
    description: message,
    start: parseICalDate(meeting.calendarEntries[0].dtstart),
    end: parseICalDate(meeting.calendarEntries[0].dtend),
    location: meetingUrl,
    repeating: meeting.calendarEntries[0].rrule
      ? `RRULE:${meeting.calendarEntries[0].rrule}`
      : undefined,
    // TODO: Add recurrenceId
    // TODO: Add exdate
    timezone: meeting.calendarEntries[0].dtstart.tzid,
    // TODO: the url field is not supported everywhere and will create errors
    // TODO: attendees can only be added if the email is known
  });

  return cal.toString();
}

export function generateVTimezone(timezone: string): string | null {
  const result = tzlib_get_ical_block(timezone);

  if (isArray(result) && result.length >= 1) {
    return result[0];
  }

  return null;
}
