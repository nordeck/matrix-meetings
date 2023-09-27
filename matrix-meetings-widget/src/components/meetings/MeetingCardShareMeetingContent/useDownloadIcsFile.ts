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

import { isArray, uniq } from 'lodash';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { tzlib_get_ical_block } from 'timezones-ical-library';
import { CalendarEntry, DateTimeEntry } from '../../../lib/matrix';
import { formatICalDate, isDefined, parseICalDate } from '../../../lib/utils';
import {
  Meeting,
  selectNordeckMeetingMetadataEventByRoomId,
} from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
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

  const metadataEvent = useAppSelector((state) =>
    selectNordeckMeetingMetadataEventByRoomId(state, meeting.meetingId),
  );

  const filename = useMemo(
    () =>
      `${meeting.title}_${DateTime.fromISO(meeting.startTime).toFormat(
        'yyyyLLdd_HHmm',
      )}.ics`,
    [meeting.startTime, meeting.title],
  );

  const [blobUrl, setBlobUrl] = useState<string | undefined>();

  useEffect(() => {
    const value = createIcsFile({
      meeting,
      meetingCalendar: metadataEvent?.content.calendar ?? [],
      meetingUrl: url,
      message,
    });

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
  }, [meeting, message, metadataEvent?.content.calendar, url]);

  return useMemo(
    () => ({
      href: blobUrl,
      filename,
      error: undefined,
    }),
    [blobUrl, filename],
  );
}

export function createIcsFile({
  meeting,
  meetingCalendar,
  meetingUrl,
  message,
}: {
  meeting: Meeting;
  meetingCalendar: CalendarEntry[];
  meetingUrl: string;
  message: string;
}): string | undefined {
  const allTimezones = uniq(
    meetingCalendar
      .flatMap((c) => [
        c.dtstart.tzid,
        c.dtend.tzid,
        c.recurrenceId?.tzid,
        // exdates will be added as UTC so we don't need to consider their timezones
      ])
      .filter((c) => c !== 'UTC')
      .filter(isDefined),
  );
  const tzStrings = allTimezones.map(generateVTimezone).filter(isDefined);

  let g = '';

  g += 'BEGIN:VCALENDAR\r\n';
  g += 'VERSION:2.0\r\n';
  g += `PRODID:-//nordeck.net//matrix-meetings//EN\r\n`;

  for (const tzString of tzStrings) {
    g += tzString.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n').trim() + '\r\n';
  }

  for (const calendarEntry of meetingCalendar) {
    g += 'BEGIN:VEVENT\r\n';
    g += `UID:${meeting.meetingId}-${calendarEntry.uid}\r\n`;
    g += `SEQUENCE:${DateTime.now().toUnixInteger()}\r\n`;
    g += `DTSTAMP:${formatICalDate(DateTime.now(), 'UTC').value}Z\r\n`;
    g += `LAST-MODIFIED:${formatICalDate(DateTime.now(), 'UTC').value}Z\r\n`;
    g += writeDateProperty('DTSTART', calendarEntry.dtstart);
    g += writeDateProperty('DTEND', calendarEntry.dtend);
    if (calendarEntry.rrule) {
      g += `RRULE:${calendarEntry.rrule}\r\n`;
    }
    if (calendarEntry.recurrenceId) {
      g += writeDateProperty('RECURRENCE-ID', calendarEntry.recurrenceId);
    }
    if (calendarEntry.exdate && calendarEntry.exdate.length > 0) {
      const exdates = calendarEntry.exdate.map(
        // We add the exdates in UTC
        (ex) => `${formatICalDate(parseICalDate(ex), 'UTC').value}Z`,
      );
      g += `EXDATE:${exdates}\r\n`;
    }
    g += `SUMMARY:${escape(meeting.title, false)}\r\n`;
    g += `LOCATION:${escape(meetingUrl, false)}\r\n`;
    g += `DESCRIPTION:${escape(message, false)}\r\n`;
    g += 'END:VEVENT\r\n';
  }

  g += 'END:VCALENDAR';

  return foldLines(g);
}

export function generateVTimezone(timezone: string): string | null {
  const result = tzlib_get_ical_block(timezone);

  if (isArray(result) && result.length >= 1) {
    return result[0];
  }

  return null;
}

function writeDateProperty(
  property: string,
  dateTimeEntry: DateTimeEntry,
): string {
  if (dateTimeEntry.tzid === 'UTC') {
    return `${property}:${dateTimeEntry.value}Z\r\n`;
  } else {
    return `${property};TZID=${dateTimeEntry.tzid}:${dateTimeEntry.value}\r\n`;
  }
}

/**
 * Escapes special characters in the given string
 *
 * Based on https://github.com/sebbo2002/ical-generator/blob/71a354b597219ac8209caf341571c25418fc2690/src/tools.ts
 */
export function escape(str: string | unknown, inQuotes: boolean): string {
  return String(str)
    .replace(inQuotes ? /[\\"]/g : /[\\;,]/g, function (match) {
      return '\\' + match;
    })
    .replace(/(?:\r\n|\r|\n)/g, '\\n');
}

/**
 * Trim line length of given string
 *
 * Based on https://github.com/sebbo2002/ical-generator/blob/71a354b597219ac8209caf341571c25418fc2690/src/tools.ts
 */
export function foldLines(input: string): string {
  return input
    .split('\r\n')
    .map(function (line) {
      let result = '';
      let c = 0;
      for (let i = 0; i < line.length; i++) {
        let ch = line.charAt(i);

        // surrogate pair, see https://mathiasbynens.be/notes/javascript-encoding#surrogate-pairs
        if (ch >= '\ud800' && ch <= '\udbff') {
          ch += line.charAt(++i);
        }

        // TextEncoder is available in browsers and node.js >= 11.0.0
        const charsize = new TextEncoder().encode(ch).length;
        c += charsize;
        if (c > 74) {
          result += '\r\n ';
          c = charsize;
        }

        result += ch;
      }
      return result;
    })
    .join('\r\n');
}
