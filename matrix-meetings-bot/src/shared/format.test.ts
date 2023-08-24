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

import { t } from 'i18next';
import { Frequency } from 'rrule';
import { formatRRuleText, parseRRule, parseRRuleSafe } from './format';

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
        'DTSTART:29990101T100000Z\nRRULE:FREQ=DAILY;INTERVAL=2;COUNT=5',
      ),
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
        'DTSTART:29990101T100000Z\nRRULE:FREQ=DAILY;INTERVAL=2;COUNT=5',
      ),
    ).toBeUndefined();
  });

  it('should return undefined if a RRULE parsing fails', () => {
    expect(
      parseRRuleSafe('frequency=DAILY;INTERVAL=2;COUNT=5'),
    ).toBeUndefined();
  });
});

describe('formatRRuleText', () => {
  it.each`
    rule                                                                             | exepctedTextEn                                                             | expectedTextDe
    ${'FREQ=DAILY'}                                                                  | ${'Every day'}                                                             | ${'Jeden Tag'}
    ${'FREQ=DAILY;INTERVAL=1'}                                                       | ${'Every day'}                                                             | ${'Jeden Tag'}
    ${'FREQ=DAILY;COUNT=1'}                                                          | ${'Every day for one time'}                                                | ${'Jeden Tag für einen Termin'}
    ${'FREQ=DAILY;UNTIL=20221030T140000Z'}                                           | ${'Every day until October 30, 2022'}                                      | ${'Jeden Tag bis zum 30. Oktober 2022'}
    ${'FREQ=DAILY;COUNT=14'}                                                         | ${'Every day for 14 times'}                                                | ${'Jeden Tag für 14 Termine'}
    ${'FREQ=DAILY;INTERVAL=2'}                                                       | ${'Every 2 days'}                                                          | ${'Jeden 2. Tag'}
    ${'FREQ=WEEKLY'}                                                                 | ${'Every week'}                                                            | ${'Jede Woche'}
    ${'FREQ=WEEKLY;INTERVAL=2'}                                                      | ${'Every 2 weeks'}                                                         | ${'Jede 2. Woche'}
    ${'FREQ=WEEKLY;INTERVAL=2;COUNT=1'}                                              | ${'Every 2 weeks for one time'}                                            | ${'Jede 2. Woche für einen Termin'}
    ${'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'}                                            | ${'Every weekday'}                                                         | ${'Jeden Montag bis Freitag'}
    ${'FREQ=WEEKLY;BYDAY=MO,TU,FR,WE,TH'}                                            | ${'Every weekday'}                                                         | ${'Jeden Montag bis Freitag'}
    ${'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TU,WE,TH,FR'}                                 | ${'Every 2 weeks on weekdays'}                                             | ${'Jede 2. Woche von Montag bis Freitag'}
    ${'FREQ=WEEKLY;BYDAY=MO'}                                                        | ${'Every week on Monday'}                                                  | ${'Jede Woche am Montag'}
    ${'FREQ=WEEKLY;INTERVAL=4;BYDAY=MO'}                                             | ${'Every 4 weeks on Monday'}                                               | ${'Jede 4. Woche am Montag'}
    ${'FREQ=WEEKLY;BYDAY=MO,TU,WE'}                                                  | ${'Every week on Monday, Tuesday, and Wednesday'}                          | ${'Jede Woche am Montag, Dienstag und Mittwoch'}
    ${'FREQ=WEEKLY;BYDAY=WE,MO,TU'}                                                  | ${'Every week on Monday, Tuesday, and Wednesday'}                          | ${'Jede Woche am Montag, Dienstag und Mittwoch'}
    ${'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TU,WE'}                                       | ${'Every 2 weeks on Monday, Tuesday, and Wednesday'}                       | ${'Jede 2. Woche am Montag, Dienstag und Mittwoch'}
    ${'FREQ=WEEKLY;BYDAY=MO,SU'}                                                     | ${'Every week on Monday and Sunday'}                                       | ${'Jede Woche am Montag und Sonntag'}
    ${'FREQ=WEEKLY;INTERVAL=2;UNTIL=20221030T140000Z'}                               | ${'Every 2 weeks until October 30, 2022'}                                  | ${'Jede 2. Woche bis zum 30. Oktober 2022'}
    ${'FREQ=WEEKLY;COUNT=14'}                                                        | ${'Every week for 14 times'}                                               | ${'Jede Woche für 14 Termine'}
    ${'FREQ=WEEKLY;BYDAY=MO;COUNT=14'}                                               | ${'Every week on Monday for 14 times'}                                     | ${'Jede Woche am Montag für 14 Termine'}
    ${'FREQ=MONTHLY'}                                                                | ${'Every month'}                                                           | ${'Jeden Monat'}
    ${'FREQ=MONTHLY;COUNT=1'}                                                        | ${'Every month for one time'}                                              | ${'Jeden Monat für einen Termin'}
    ${'FREQ=MONTHLY;INTERVAL=2'}                                                     | ${'Every 2 months'}                                                        | ${'Jeden 2. Monat'}
    ${'FREQ=MONTHLY;BYSETPOS=-1;BYDAY=MO'}                                           | ${'Every month on the last Monday'}                                        | ${'Jeden Monat am letzten Montag'}
    ${'FREQ=MONTHLY;BYMONTHDAY=2'}                                                   | ${'Every month on the 2nd'}                                                | ${'Jeden Monat am 2.'}
    ${'FREQ=MONTHLY;BYMONTHDAY=3'}                                                   | ${'Every month on the 3rd'}                                                | ${'Jeden Monat am 3.'}
    ${'FREQ=MONTHLY;BYMONTHDAY=5'}                                                   | ${'Every month on the 5th'}                                                | ${'Jeden Monat am 5.'}
    ${'FREQ=MONTHLY;BYMONTHDAY=21'}                                                  | ${'Every month on the 21st'}                                               | ${'Jeden Monat am 21.'}
    ${'FREQ=MONTHLY;INTERVAL=2;BYSETPOS=1;BYDAY=MO;COUNT=1'}                         | ${'Every 2 months on the first Monday for one time'}                       | ${'Jeden 2. Monat am ersten Montag für einen Termin'}
    ${'FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=1;UNTIL=20221001T140000Z'}                 | ${'Every 2 months on the 1st until October 1, 2022'}                       | ${'Jeden 2. Monat am 1. bis zum 1. Oktober 2022'}
    ${'FREQ=YEARLY'}                                                                 | ${'Every year'}                                                            | ${'Jedes Jahr'}
    ${'FREQ=YEARLY;INTERVAL=4'}                                                      | ${'Every 4 years'}                                                         | ${'Jedes 4. Jahr'}
    ${'FREQ=YEARLY;COUNT=4'}                                                         | ${'Every year for 4 times'}                                                | ${'Jedes Jahr für 4 Termine'}
    ${'FREQ=YEARLY;BYSETPOS=3;BYDAY=MO;BYMONTH=2'}                                   | ${'Every February on the third Monday'}                                    | ${'Jeden Februar am dritten Montag'}
    ${'FREQ=YEARLY;INTERVAL=2;BYSETPOS=3;BYDAY=MO;BYMONTH=2'}                        | ${'Every 2 years on the third Monday of February'}                         | ${'Jedes 2. Jahr am dritten Montag im Februar'}
    ${'FREQ=YEARLY;INTERVAL=2;BYSETPOS=3;BYDAY=MO;BYMONTH=2;UNTIL=20221231T140000Z'} | ${'Every 2 years on the third Monday of February until December 31, 2022'} | ${'Jedes 2. Jahr am dritten Montag im Februar bis zum 31. Dezember 2022'}
    ${'FREQ=YEARLY;BYMONTHDAY=24;BYMONTH=12'}                                        | ${'Every December on the 24th'}                                            | ${'Jeden Dezember am 24.'}
    ${'FREQ=YEARLY;BYMONTHDAY=24;BYMONTH=12;UNTIL=20221231T140000Z'}                 | ${'Every December on the 24th until December 31, 2022'}                    | ${'Jeden Dezember am 24. bis zum 31. Dezember 2022'}
    ${'FREQ=YEARLY;BYMONTHDAY=24;BYMONTH=12;COUNT=1'}                                | ${'Every December on the 24th for one time'}                               | ${'Jeden Dezember am 24. für einen Termin'}
    ${'FREQ=YEARLY;INTERVAL=4;BYMONTHDAY=29;BYMONTH=2'}                              | ${'Every 4 years on the 29th of February'}                                 | ${'Jedes 4. Jahr am 29. Februar'}
    ${'FREQ=HOURLY'}                                                                 | ${'Unsupported recurrence'}                                                | ${'Nicht unterstützte Wiederholung'}
  `('should format $rule', async ({ rule, exepctedTextEn, expectedTextDe }) => {
    expect(formatRRuleText(rule, t, 'en')).toEqual(exepctedTextEn);

    expect(formatRRuleText(rule, t, 'de')).toEqual(expectedTextDe);
  });
});
