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

import { TFunction } from 'i18next';
import { sortBy } from 'lodash';
import { Info } from 'luxon';
import { Frequency, Options, RRule } from 'rrule';
import { getOrdinalLabel } from '../CustomRecurringMeeting/OrdinalSelect';
import { isWeekdays, normalizeByWeekday, normalizeNumeric } from './helpers';

export function parseRRule(rule: string): Partial<Options> {
  // parseString automatically ignores the missing RRULE: prefix
  const ruleOptions = RRule.parseString(rule);

  if (ruleOptions.dtstart) {
    throw new Error('rule should not include DTSTART or similar');
  }

  return ruleOptions;
}

export function stringifyRRule(ruleOptions: Partial<Options>): string {
  const rule = RRule.optionsToString(ruleOptions);

  if (!rule.startsWith('RRULE:')) {
    throw new Error('ruleOptions should not include DTSTART or similar');
  }

  return rule.substring('RRULE:'.length);
}

export const formatRRuleText = (rule: string, t: TFunction): string => {
  // TODO: Right now this function might ignore unknown properties. Instead it
  // could also show a warning for edge cases (e.g. a month with two weekdays)
  const ruleOptions = parseRRule(rule);
  const count = ruleOptions.interval ?? 1;
  const afterMeetingCount = ruleOptions.count ?? 0;
  const untilDate = ruleOptions.until ?? new Date();

  /* IMPORTANT: This comments define the nested keys used below and are used to
     extract them via i18next-parser

     These are general keys that can be used inside every other rule:

    t('recurrenceEditor.ruleText.recurrenceEnd_never', '')
    t('recurrenceEditor.ruleText.recurrenceEnd_until', ' until {{ untilDate, datetime(year: \'numeric\'; month: \'long\'; day: \'numeric\') }}')
    t('recurrenceEditor.ruleText.recurrenceEnd_count', ' $t(recurrenceEditor.ruleText.afterMeetingCount, {"count": {{afterMeetingCount}}, "ordinal": false })')

     This keys are required to support multiple plurals:

    t('recurrenceEditor.ruleText.afterMeetingCount', { defaultValue_one: 'for one time', defaultValue: 'for {{count}} times', count: 0 })
    t('recurrenceEditor.ruleText.ordinal', { defaultValue_one: '{{count}}st', defaultValue_two: '{{count}}nd', defaultValue_few: '{{count}}rd', defaultValue: '{{count}}th', count: 0, ordinal: true })
  */
  let recurrenceEnd = 'never';

  if (ruleOptions.until !== null && ruleOptions.until !== undefined) {
    recurrenceEnd = 'until';
  } else if (ruleOptions.count !== null && ruleOptions.count !== undefined) {
    recurrenceEnd = 'count';
  }

  if (ruleOptions.freq === Frequency.DAILY) {
    return t('recurrenceEditor.ruleText.daily', {
      count,
      defaultValue_one:
        'Every day$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
      defaultValue:
        'Every {{count}} days$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
      untilDate,
      afterMeetingCount,
      recurrenceEnd,
    });
  }

  const byweekday = normalizeByWeekday(ruleOptions.byweekday);

  if (ruleOptions.freq === Frequency.WEEKLY) {
    if (isWeekdays(byweekday)) {
      // Exactly Mo-Fr (workdays)
      return t('recurrenceEditor.ruleText.weekly', {
        count,
        defaultValue_one:
          'Every weekday$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        defaultValue:
          'Every {{count}} weeks on weekdays$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        untilDate,
        afterMeetingCount,
        recurrenceEnd,
        context: 'weekdays',
      });
    } else if (byweekday && byweekday.length > 0) {
      // Some weekdays
      return t('recurrenceEditor.ruleText.weekly', {
        count,
        defaultValue_one:
          'Every week on {{weekdays, list}}$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        defaultValue:
          'Every {{count}} weeks on {{weekdays, list}}$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        untilDate,
        afterMeetingCount,
        recurrenceEnd,
        context: 'some',
        weekdays: sortBy(byweekday).map(formatWeekdayAsLocaleString),
      });
    } else {
      // No weekdays
      return t('recurrenceEditor.ruleText.weekly', {
        count,
        defaultValue_one:
          'Every week$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        defaultValue:
          'Every {{count}} weeks$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        untilDate,
        afterMeetingCount,
        recurrenceEnd,
        context: 'all',
      });
    }
  }

  const bymonthday = normalizeNumeric(ruleOptions.bymonthday);

  if (ruleOptions.freq === Frequency.MONTHLY) {
    if (bymonthday !== undefined) {
      // By monthday
      return t('recurrenceEditor.ruleText.monthly', {
        count,
        defaultValue_one:
          'Every month on the $t(recurrenceEditor.ruleText.ordinal, {"count": {{bymonthday}}, "ordinal": true })$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        defaultValue:
          'Every {{count}} months on the $t(recurrenceEditor.ruleText.ordinal, {"count": {{bymonthday}}, "ordinal": true })$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        untilDate,
        afterMeetingCount,
        recurrenceEnd,
        bymonthday,
        context: 'bymonthday',
      });
    } else if (byweekday !== undefined) {
      // By weekday
      const bysetpos = normalizeNumeric(ruleOptions.bysetpos) ?? 1;

      return t('recurrenceEditor.ruleText.monthly', {
        count,
        defaultValue_one:
          'Every month on the {{ordinalLabel}} {{byweekday}}$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        defaultValue:
          'Every {{count}} months on the {{ordinalLabel}} {{byweekday}}$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        untilDate,
        afterMeetingCount,
        recurrenceEnd,
        byweekday: formatWeekdayAsLocaleString(
          normalizeNumeric(byweekday) ?? 0
        ),
        ordinalLabel: getOrdinalLabel(bysetpos, t),
        context: 'byweekday',
      });
    } else {
      // Just montly
      return t('recurrenceEditor.ruleText.monthly', {
        count,
        defaultValue_one:
          'Every month$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        defaultValue:
          'Every {{count}} months$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        untilDate,
        afterMeetingCount,
        recurrenceEnd,
        context: 'simple',
      });
    }
  }

  if (ruleOptions.freq === Frequency.YEARLY) {
    const bymonth = normalizeNumeric(ruleOptions.bymonth) ?? 1;
    const monthLabel = Info.months()[bymonth - 1];

    if (bymonthday !== undefined) {
      // By monthday
      return t('recurrenceEditor.ruleText.yearly', {
        count,
        defaultValue_one:
          'Every {{monthLabel}} on the $t(recurrenceEditor.ruleText.ordinal, {"count": {{bymonthday}}, "ordinal": true })$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        defaultValue:
          'Every {{count}} years on the $t(recurrenceEditor.ruleText.ordinal, {"count": {{bymonthday}}, "ordinal": true }) of {{monthLabel}}$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        untilDate,
        afterMeetingCount,
        recurrenceEnd,
        bymonthday,
        monthLabel,
        context: 'bymonthday',
      });
    } else if (byweekday !== undefined) {
      // By weekday
      const bysetpos = normalizeNumeric(ruleOptions.bysetpos) ?? 1;

      return t('recurrenceEditor.ruleText.yearly', {
        count,
        defaultValue_one:
          'Every {{monthLabel}} on the {{ordinalLabel}} {{byweekday}}$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        defaultValue:
          'Every {{count}} years on the {{ordinalLabel}} {{byweekday}} of {{monthLabel}}$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        untilDate,
        afterMeetingCount,
        recurrenceEnd,
        monthLabel,
        byweekday: formatWeekdayAsLocaleString(
          normalizeNumeric(byweekday) ?? 0
        ),
        ordinalLabel: getOrdinalLabel(bysetpos, t),
        context: 'byweekday',
      });
    } else {
      // Just yearly
      return t('recurrenceEditor.ruleText.yearly', {
        count,
        defaultValue_one:
          'Every year$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        defaultValue:
          'Every {{count}} years$t(recurrenceEditor.ruleText.recurrenceEnd, {"context": "{{recurrenceEnd}}" })',
        untilDate,
        afterMeetingCount,
        recurrenceEnd,
        context: 'simple',
      });
    }
  }

  return t('recurrenceEditor.ruleText.unknown', 'Unsupported recurrence');
};

function formatWeekdayAsLocaleString(byWeekday: number): string {
  return Info.weekdays()[byWeekday];
}
