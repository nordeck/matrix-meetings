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

import { Frequency } from 'rrule';
import {
  getDefaultCustomRuleProperties,
  getDefaultRecurringMeetingEnd,
} from './defaults';

describe('getDefaultRecurringMeetingEnd', () => {
  it.each`
    frequency                       | defaultUntilDate                        | defaultAfterMeetingCount
    ${Frequency[Frequency.DAILY]}   | ${new Date('2022-02-01T23:59:59.999Z')} | ${30}
    ${Frequency[Frequency.WEEKLY]}  | ${new Date('2022-04-03T23:59:59.999Z')} | ${13}
    ${Frequency[Frequency.MONTHLY]} | ${new Date('2023-01-02T23:59:59.999Z')} | ${12}
    ${Frequency[Frequency.YEARLY]}  | ${new Date('2027-01-02T23:59:59.999Z')} | ${5}
    ${undefined}                    | ${new Date('2027-01-02T23:59:59.999Z')} | ${5}
  `(
    'should get default until date of $defaultUntilDate and after meeting count of $defaultAfterMeetingCount for $frequency recurring meetings',
    ({ frequency, defaultUntilDate, defaultAfterMeetingCount }) => {
      const startDate = new Date('2022-01-02T13:10:00.000Z');

      expect(
        getDefaultRecurringMeetingEnd(
          Frequency[frequency as keyof typeof Frequency],
          startDate,
        ),
      ).toEqual({
        defaultUntilDate,
        defaultAfterMeetingCount,
      });
    },
  );
});

describe('getDefaultCustomRuleProperties', () => {
  it.each`
    startDate                               | defaultCustomMonth | defaultCustomNthMonthday | defaultCustomWeekday | defaultCustomNth
    ${new Date('2022-10-03T12:00:00.000Z')} | ${10}              | ${3}                     | ${0}                 | ${1}
    ${new Date('2022-10-31T12:00:00.000Z')} | ${10}              | ${31}                    | ${0}                 | ${-1}
    ${new Date('2022-10-24T12:00:00.000Z')} | ${10}              | ${24}                    | ${0}                 | ${4}
    ${new Date('2022-02-01T12:00:00.000Z')} | ${2}               | ${1}                     | ${1}                 | ${1}
    ${new Date('2022-02-09T12:00:00.000Z')} | ${2}               | ${9}                     | ${2}                 | ${2}
    ${new Date('2022-02-20T12:00:00.000Z')} | ${2}               | ${20}                    | ${6}                 | ${3}
    ${new Date('2022-02-21T12:00:00.000Z')} | ${2}               | ${21}                    | ${0}                 | ${3}
  `(
    'should get default custom rule properties for start date of $startDate',
    ({
      startDate,
      defaultCustomMonth,
      defaultCustomNthMonthday,
      defaultCustomWeekday,
      defaultCustomNth,
    }) => {
      expect(getDefaultCustomRuleProperties(startDate)).toEqual({
        defaultCustomMonth,
        defaultCustomNthMonthday,
        defaultCustomWeekday,
        defaultCustomNth,
      });
    },
  );
});
