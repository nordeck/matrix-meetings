/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { Frequency } from 'rrule';
import { parseRRule, parseRRuleSafe } from './format';

describe('parseRRule', () => {
  it('should parse RRULE', () => {
    expect(parseRRule('FREQ=DAILY;INTERVAL=2;COUNT=5')).toEqual({
      freq: Frequency.DAILY,
      interval: 2,
      count: 5,
    });
  });

  it('should fail if a RRULE with a dtstart is passed', () => {
    expect(() =>
      parseRRule(
        'DTSTART:29990101T100000Z\nRRULE:FREQ=DAILY;INTERVAL=2;COUNT=5'
      )
    ).toThrow('rule should not include DTSTART or similar');
  });
});

describe('parseRRuleSafe', () => {
  it('should parse RRULE', () => {
    expect(parseRRuleSafe('FREQ=DAILY;INTERVAL=2;COUNT=5')).toEqual({
      freq: Frequency.DAILY,
      interval: 2,
      count: 5,
    });
  });

  it('should return undefined if a RRULE with a dtstart is passed', () => {
    expect(
      parseRRuleSafe(
        'DTSTART:29990101T100000Z\nRRULE:FREQ=DAILY;INTERVAL=2;COUNT=5'
      )
    ).toBeUndefined();
  });

  it('should return undefined if a RRULE parsing fails', () => {
    expect(
      parseRRuleSafe('frequency=DAILY;INTERVAL=2;COUNT=5')
    ).toBeUndefined();
  });
});
