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

import { describe, expect, it } from 'vitest';
import { mockNordeckMeetingMetadataEvent } from '../../testUtils';
import {
  isValidNordeckMeetingMetadataEvent,
  migrateNordeckMeetingMetadataEventSchema,
} from './nordeckMeetingMetadataEvent';

describe('isValidNordeckMeetingMetadataEvent', () => {
  it('should accept event', () => {
    expect(
      isValidNordeckMeetingMetadataEvent({
        content: {
          creator: '@test:matrix.org',
          calendar: [
            {
              uid: 'uuid',
              dtstart: { tzid: 'Europe/Berlin', value: '20200101T000000' },
              dtend: { tzid: 'Europe/Berlin', value: '20200101T000000' },
            },
          ],
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'net.nordeck.meetings.metadata',
      }),
    ).toBe(true);
  });

  it('should accept event with external_data', () => {
    expect(
      isValidNordeckMeetingMetadataEvent({
        content: {
          creator: '@test:matrix.org',
          calendar: [
            {
              uid: 'uuid',
              dtstart: { tzid: 'Europe/Berlin', value: '20200101T000000' },
              dtend: { tzid: 'Europe/Berlin', value: '20200101T000000' },
            },
          ],
          external_data: {
            'my.provider': {
              'my.property': 'text',
              'my.property.1': {
                a: 'b',
              },
            },
          },
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'net.nordeck.meetings.metadata',
      }),
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidNordeckMeetingMetadataEvent({
        content: {
          creator: '@test:matrix.org',
          calendar: [
            {
              uid: 'uuid',
              dtstart: {
                tzid: 'Europe/Berlin',
                value: '20200101T000000',
                additional: 'tmp',
              },
              dtend: {
                tzid: 'Europe/Berlin',
                value: '20200101T000000',
                additional: 'tmp',
              },
              additional: 'tmp',
            },
          ],
          additional: 'tmp',
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'net.nordeck.meetings.metadata',
      }),
    ).toBe(true);
  });

  it('should reject invalid event type', () => {
    expect(
      isValidNordeckMeetingMetadataEvent({
        content: {
          creator: '@test:matrix.org',
          calendar: [
            {
              uid: 'uuid',
              dtstart: { tzid: 'Europe/Berlin', value: '20200101T000000' },
              dtend: { tzid: 'Europe/Berlin', value: '20200101T000000' },
            },
          ],
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'any.other.type',
      }),
    ).toBe(false);
  });

  it.each<Object>([
    { creator: null },
    { creator: undefined },
    { creator: 111 },
    { calendar: null },
    { calendar: undefined },
    { calendar: 111 },
    { calendar: [] },
    { calendar: [null] },
    { calendar: [undefined] },
    { force_deletion_at: null },
    { force_deletion_at: 'text' },
    { external_data: [] },
    { external_data: { 'my.provider': [] } },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      isValidNordeckMeetingMetadataEvent({
        content: {
          creator: '@test:matrix.org',
          calendar: [
            {
              uid: 'uuid',
              dtstart: { tzid: 'Europe/Berlin', value: '20200101T000000' },
              dtend: { tzid: 'Europe/Berlin', value: '20200101T000000' },
            },
          ],
          force_deletion_at: 100,
          external_data: {
            'my.provider': {
              'my.property': 'text',
              'my.property.1': {
                a: 'b',
              },
            },
          },
          ...patch,
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'net.nordeck.meetings.metadata',
      }),
    ).toBe(false);
  });

  it('should accept event in the legacy format', () => {
    expect(
      isValidNordeckMeetingMetadataEvent({
        content: {
          creator: '@test:matrix.org',
          start_time: '2020-01-01T00:00:00Z',
          end_time: '2020-01-01T01:00:00Z',
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'net.nordeck.meetings.metadata',
      }),
    ).toBe(true);
  });

  const calendar = [
    {
      uid: 'uuid',
      dtstart: { tzid: 'Europe/Berlin', value: '20200101T000000' },
      dtend: { tzid: 'Europe/Berlin', value: '20200101T000000' },
    },
  ];

  it.each<Object>([
    { start_time: null },
    { start_time: undefined },
    { start_time: 111 },
    { start_time: 'invalid-date' },
    { end_time: null },
    { end_time: undefined },
    { end_time: 111 },
    { end_time: 'invalid-date' },
    { calendar },
    { calendar, start_time: undefined },
    { calendar, end_time: undefined },
    { auto_deletion_offset: 'text' },
    { auto_deletion_offset: null },
  ])('should reject legacy format event with patch %p', (patch: Object) => {
    expect(
      isValidNordeckMeetingMetadataEvent({
        content: {
          creator: '@test:matrix.org',
          calendar: undefined as unknown,
          start_time: '2020-01-01T00:00:00Z',
          end_time: '2020-01-01T01:00:00Z',
          force_deletion_at: 100,
          auto_deletion_offset: 200,
          external_data: {
            'my.provider': {
              'my.property': 'text',
              'my.property.1': {
                a: 'b',
              },
            },
          },
          ...patch,
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'net.nordeck.meetings.metadata',
      }),
    ).toBe(false);
  });
});

describe('migrateNordeckMeetingMetadataEventSchema', () => {
  it('should add a calendar entry if start_date and end_date are present', () => {
    const metadata = mockNordeckMeetingMetadataEvent({
      content: { calendar: undefined },
    });
    metadata.content.start_time = '2020-01-01T00:00:00Z';
    metadata.content.end_time = '2020-01-01T01:00:00Z';

    expect(migrateNordeckMeetingMetadataEventSchema(metadata)).toEqual(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: [
            {
              uid: expect.any(String),
              dtstart: { tzid: 'UTC', value: '20200101T000000' },
              dtend: { tzid: 'UTC', value: '20200101T010000' },
            },
          ],
          force_deletion_at: undefined,
        },
      }),
    );
  });

  it('should migrate the auto_deletion_offset', () => {
    const metadata = mockNordeckMeetingMetadataEvent({
      content: { calendar: undefined, auto_deletion_offset: 60 },
    });
    metadata.content.start_time = '2020-01-01T00:00:00Z';
    metadata.content.end_time = '2020-01-01T01:00:00Z';

    expect(migrateNordeckMeetingMetadataEventSchema(metadata)).toEqual(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: [
            {
              uid: expect.any(String),
              dtstart: { tzid: 'UTC', value: '20200101T000000' },
              dtend: { tzid: 'UTC', value: '20200101T010000' },
            },
          ],
          force_deletion_at: new Date('2020-01-01T02:00:00Z').getTime(),
        },
      }),
    );
  });

  it('should migrate the auto_deletion_offset of 0', () => {
    const metadata = mockNordeckMeetingMetadataEvent({
      content: { calendar: undefined, auto_deletion_offset: 0 },
    });
    metadata.content.start_time = '2020-01-01T00:00:00Z';
    metadata.content.end_time = '2020-01-01T01:00:00Z';

    expect(migrateNordeckMeetingMetadataEventSchema(metadata)).toEqual(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: [
            {
              uid: expect.any(String),
              dtstart: { tzid: 'UTC', value: '20200101T000000' },
              dtend: { tzid: 'UTC', value: '20200101T010000' },
            },
          ],
          force_deletion_at: new Date('2020-01-01T01:00:00Z').getTime(),
        },
      }),
    );
  });

  it.each([1000, 0])(
    'should prefer force_deletion_at=%p over the auto_deletion_offset',
    (force_deletion_at) => {
      const metadata = mockNordeckMeetingMetadataEvent({
        content: {
          calendar: undefined,
          auto_deletion_offset: 60,
          force_deletion_at,
        },
      });
      metadata.content.start_time = '2020-01-01T00:00:00Z';
      metadata.content.end_time = '2020-01-01T01:00:00Z';

      expect(migrateNordeckMeetingMetadataEventSchema(metadata)).toEqual(
        mockNordeckMeetingMetadataEvent({
          content: {
            calendar: [
              {
                uid: expect.any(String),
                dtstart: { tzid: 'UTC', value: '20200101T000000' },
                dtend: { tzid: 'UTC', value: '20200101T010000' },
              },
            ],
            force_deletion_at,
          },
        }),
      );
    },
  );

  it('should skip events that already fulfil the newest schema', () => {
    const metadata = mockNordeckMeetingMetadataEvent();

    expect(migrateNordeckMeetingMetadataEventSchema(metadata)).toEqual(
      metadata,
    );
  });
});
