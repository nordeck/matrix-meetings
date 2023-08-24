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
import { generateRruleSet } from './generateRruleSet';

describe('generateRruleSet', () => {
  it('should generate rrule set in timezone Europe/Berlin', () => {
    const rruleSet = generateRruleSet({
      uid: 'entry-0',
      dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
      dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
      exdate: [{ tzid: 'Europe/Berlin', value: '20210102T100000' }],
      rrule: 'FREQ=DAILY',
    });

    expect(rruleSet.rruleSet.toString()).toEqual(
      'DTSTART:20210101T100000Z\nRRULE:FREQ=DAILY\nEXDATE:20210102T100000Z',
    );
  });

  it('should generate rrule set in timezone UTC', () => {
    const rruleSet = generateRruleSet({
      uid: 'entry-0',
      dtstart: { tzid: 'UTC', value: '20210101T100000' },
      dtend: { tzid: 'UTC', value: '20210101T140000' },
      exdate: [{ tzid: 'UTC', value: '20210102T100000' }],
      rrule: 'FREQ=DAILY',
    });

    expect(rruleSet.rruleSet.toString()).toEqual(
      'DTSTART:20210101T100000Z\nRRULE:FREQ=DAILY\nEXDATE:20210102T100000Z',
    );
  });

  it('should convert date to rule set timezone (Europe/Berlin)', () => {
    const rruleSet = generateRruleSet({
      uid: 'entry-0',
      dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
      dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
      exdate: [{ tzid: 'Europe/Berlin', value: '20210102T100000' }],
      rrule: 'FREQ=DAILY',
    });

    expect(
      rruleSet.toRruleSetDate(DateTime.fromISO('2021-01-01T09:00:00Z')),
    ).toEqual(new Date('2021-01-01T10:00:00Z'));
  });

  it('should convert date from rule set timezone (Europe/Berlin) to locale time', () => {
    const rruleSet = generateRruleSet({
      uid: 'entry-0',
      dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
      dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
      exdate: [{ tzid: 'Europe/Berlin', value: '20210102T100000' }],
      rrule: 'FREQ=DAILY',
    });

    expect(
      rruleSet.fromRruleSetDate(new Date('2021-01-01T10:00:00Z')).toUTC(),
    ).toEqual(DateTime.fromISO('2021-01-01T10:00:00+01:00'));
  });

  it('should detect infinite series', () => {
    const rruleSet = generateRruleSet({
      uid: 'entry-0',
      dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
      dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
      rrule: 'FREQ=DAILY',
    });

    expect(rruleSet.isFinite).toBe(false);
  });

  it('should detect finite series', () => {
    const rruleSet = generateRruleSet({
      uid: 'entry-0',
      dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
      dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
      rrule: 'FREQ=DAILY;COUNT=2',
    });

    expect(rruleSet.isFinite).toBe(true);
  });
});
