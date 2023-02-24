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

import { StateEvent } from '@matrix-widget-toolkit/api';
import { nanoid } from '@reduxjs/toolkit';
import Joi from 'joi';
import { DateTime } from 'luxon';
import { formatICalDate } from '../../utils';
import { CalendarEntry, calendarEntrySchema } from './calendarEntry';
import { isValidEvent } from './validation';

export const STATE_EVENT_NORDECK_MEETING_METADATA =
  'net.nordeck.meetings.metadata';

export type NordeckMeetingMetadataEvent = {
  creator: string;
  calendar: CalendarEntry[];
  force_deletion_at?: number;
  external_data?: Record<string, Record<string, unknown>>;
  auto_deletion_offset?: number;
  start_time?: string;
  end_time?: string;
};

const nordeckMeetingMetadataEventSchema = Joi.object<
  NordeckMeetingMetadataEvent,
  true
>({
  creator: Joi.string().required(),
  // Optional for backward compatibility, is resolved during migration
  calendar: Joi.array()
    .items(calendarEntrySchema)
    .min(1)
    .required()
    .when('start_time', { is: Joi.exist(), then: Joi.optional() }),
  force_deletion_at: Joi.number().strict().optional(),
  external_data: Joi.object().pattern(/.*/, Joi.object()).optional(),
  auto_deletion_offset: Joi.number().strict().optional(),
  start_time: Joi.string().isoDate().optional(),
  end_time: Joi.string().isoDate().optional(),
})
  // backward compatibility: if one is present, both must be present
  .and('start_time', 'end_time')
  // backward compatibility: it can't be both start_time and calendar
  .oxor('start_time', 'calendar')
  .unknown();

export function isValidNordeckMeetingMetadataEvent(
  event: StateEvent<unknown>
): event is StateEvent<NordeckMeetingMetadataEvent> {
  return isValidEvent(
    event,
    STATE_EVENT_NORDECK_MEETING_METADATA,
    nordeckMeetingMetadataEventSchema
  );
}

/**
 * Migrate from the old format of the metadata format to the new one.
 *
 * Should be done on every read from the room.
 */
export function migrateNordeckMeetingMetadataEventSchema(
  metadataEvent: StateEvent<NordeckMeetingMetadataEvent>
): StateEvent<NordeckMeetingMetadataEvent> {
  if (
    metadataEvent.content.start_time &&
    metadataEvent.content.end_time &&
    !metadataEvent.content.calendar
  ) {
    const { start_time, end_time, auto_deletion_offset, ...content } =
      metadataEvent.content;

    let forceDeletionAt = content.force_deletion_at;
    if (
      content.force_deletion_at === undefined &&
      auto_deletion_offset !== undefined
    ) {
      forceDeletionAt = DateTime.fromISO(end_time)
        .plus({ minutes: auto_deletion_offset })
        .toMillis();
    }

    return {
      ...metadataEvent,
      content: {
        ...content,
        calendar: [
          {
            uid: nanoid(),
            dtstart: formatICalDate(DateTime.fromISO(start_time)),
            dtend: formatICalDate(DateTime.fromISO(end_time)),
          },
        ],
        force_deletion_at: forceDeletionAt,
      },
    };
  }

  return metadataEvent;
}
