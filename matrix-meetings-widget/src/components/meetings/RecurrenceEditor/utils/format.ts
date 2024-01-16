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

import { formatRRuleText as calendarFormatRRuleText } from '@nordeck/matrix-meetings-calendar';
import { TFunction } from 'i18next';
import { Settings } from 'luxon';
import { Options, RRule } from 'rrule';

export function stringifyRRule(ruleOptions: Partial<Options>): string {
  const rule = RRule.optionsToString(ruleOptions);

  if (!rule.startsWith('RRULE:')) {
    throw new Error('ruleOptions should not include DTSTART or similar');
  }

  return rule.substring('RRULE:'.length);
}

export const formatRRuleText = (rule: string, t: TFunction): string => {
  /* IMPORTANT: This comments define the nested keys used below and are used to
     extract them via i18next-parser

     These keys from calendar library:

    t('recurrenceEditor.ordinals.first', 'first')
    t('recurrenceEditor.ordinals.fourth', 'fourth')
    t('recurrenceEditor.ordinals.last', 'last')
    t('recurrenceEditor.ordinals.second', 'second')
    t('recurrenceEditor.ordinals.third', 'third')

    t('recurrenceEditor.ruleText.daily_one', 'Every day$t(recurrenceEditor.ruleText.recurrenceEnd, {'context': '{{recurrenceEnd}}' })')
    t('recurrenceEditor.ruleText.daily_other', 'Every {{count}} days$t(recurrenceEditor.ruleText.recurrenceEnd, {'context': '{{recurrenceEnd}}' })')
    t('recurrenceEditor.ruleText.monthly_bymonthday_one', 'Every month on the $t(recurrenceEditor.ruleText.ordinal, {'count': {{bymonthday}}, 'ordinal': true })$t(recurrenceEditor.ruleText.recurrenceEnd, {'context': '{{recurrenceEnd}}' })')
    t('recurrenceEditor.ruleText.monthly_bymonthday_other', 'Every {{count}} months on the $t(recurrenceEditor.ruleText.ordinal, {'count': {{bymonthday}}, 'ordinal': true })$t(recurrenceEditor.ruleText.recurrenceEnd, {'context': '{{recurrenceEnd}}' })')
    t('recurrenceEditor.ruleText.monthly_byweekday_one': 'Every month on the {{ordinalLabel}} {{byweekday}}$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.monthly_byweekday_other': 'Every {{count}} months on the {{ordinalLabel}} {{byweekday}}$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })'
    t('recurrenceEditor.ruleText.monthly_simple_one': 'Every month$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.monthly_simple_other': 'Every {{count}} months$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')

    t('recurrenceEditor.ruleText.unknown': 'Unsupported recurrence')
    t('recurrenceEditor.ruleText.weekly_all_one': 'Every week$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.weekly_all_other': 'Every {{count}} weeks$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.weekly_some_one': 'Every week on {{weekdays, list}}$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.weekly_some_other': 'Every {{count}} weeks on {{weekdays, list}}$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.weekly_weekdays_one': 'Every weekday$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.weekly_weekdays_other': 'Every {{count}} weeks on weekdays$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.yearly_bymonthday_one': 'Every {{monthLabel}} on the $t(recurrenceEditor.ruleText.ordinal, {\'count\': {{bymonthday}}, \'ordinal\': true })$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.yearly_bymonthday_other': 'Every {{count}} years on the $t(recurrenceEditor.ruleText.ordinal, {\'count\': {{bymonthday}}, \'ordinal\': true }) of {{monthLabel}}$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.yearly_byweekday_one': 'Every {{monthLabel}} on the {{ordinalLabel}} {{byweekday}}$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.yearly_byweekday_other': 'Every {{count}} years on the {{ordinalLabel}} {{byweekday}} of {{monthLabel}}$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.yearly_simple_one': 'Every year$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')
    t('recurrenceEditor.ruleText.yearly_simple_other': 'Every {{count}} years$t(recurrenceEditor.ruleText.recurrenceEnd, {\'context\': \'{{recurrenceEnd}}\' })')

     These are general keys that can be used inside every other rule:

    t('recurrenceEditor.ruleText.recurrenceEnd_never', '')
    t('recurrenceEditor.ruleText.recurrenceEnd_until', ' until {{ untilDate, datetime(year: \'numeric\'; month: \'long\'; day: \'numeric\') }}')
    t('recurrenceEditor.ruleText.recurrenceEnd_count', ' $t(recurrenceEditor.ruleText.afterMeetingCount, {"count": {{afterMeetingCount}}, "ordinal": false })')

     This keys are required to support multiple plurals:

    t('recurrenceEditor.ruleText.afterMeetingCount', { defaultValue_one: 'for one time', defaultValue: 'for {{count}} times', count: 0 })
    t('recurrenceEditor.ruleText.ordinal', { defaultValue_one: '{{count}}st', defaultValue_two: '{{count}}nd', defaultValue_few: '{{count}}rd', defaultValue: '{{count}}th', count: 0, ordinal: true })
  */

  return calendarFormatRRuleText(rule, t, Settings.defaultLocale);
};
