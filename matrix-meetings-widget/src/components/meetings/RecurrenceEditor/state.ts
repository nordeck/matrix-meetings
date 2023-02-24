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

import { isEqual, omit } from 'lodash';
import moment, { Moment } from 'moment';
import { Dispatch, useReducer } from 'react';
import { Frequency, Options, RRule } from 'rrule';
import {
  getDefaultCustomRuleProperties,
  getDefaultRecurringMeetingEnd,
  normalizeByWeekday,
  normalizeNumeric,
  parseRRule,
  stringifyRRule,
} from './utils';

export enum RecurrencePreset {
  /** A meeting that is not repeated */
  Once = 'once',
  /** Preset for a meeting repeated every day */
  Daily = 'daily',
  /** Preset for a meeting repeated every week */
  Weekly = 'weekly',
  /** Preset for a meeting repeated every week on Monday to Friday */
  MondayToFriday = 'mondayToFriday',
  /** Preset for a meeting repeated every month */
  Monthly = 'montly',
  /** Preset for a meeting repeated every year */
  Yearly = 'yearly',
  /** A meeting repeated by custom rules */
  Custom = 'custom',
}

export enum CustomRuleMode {
  /** An specifc weekday, like the Monday of the 3. week (in November) */
  ByWeekday = 'byWeekday',
  /** An exact date, like the 5. (November) */
  ByMonthday = 'byMonthday',
}

export enum RecurrenceEnd {
  /** The meeting is repeated forever */
  Never = 'never',
  /** The meeting is repeated until a specific end date  */
  UntilDate = 'untilDate',
  /** The meeting is repeated for n-times */
  AfterMeetingCount = 'afterMeetingCount',
}

export type State = {
  isDirty: boolean;
  /** The date of the first meeting */
  startDate: Date;
  recurrencePreset: RecurrencePreset;
  customFrequency: Frequency;
  customInterval: string;
  customByWeekday: number[];
  customRuleMode: CustomRuleMode;
  /** The month that the occurence happen in: bymonth  */
  customMonth: number;
  /** The n-th day of the month, used in ByMonthday mode: bymonthday */
  customNthMonthday: string;
  /** The weekday that the meeting is recurring at, used in ByWeekday mode: byweekday */
  customWeekday: number;
  /** The n-th week that the meeting is recurring in, used in ByWeekday mode: bysetpos */
  customNth: number;
  recurrenceEnd: RecurrenceEnd;
  untilDate: Moment;
  afterMeetingCount: string;
};

export type Action =
  | { type: 'updateStartDate'; startDate: Date; isMeetingCreation: boolean }
  | { type: 'updateRecurrencePreset'; recurrencePreset: RecurrencePreset }
  | { type: 'updateAfterMeetingCount'; afterMeetingCount: string }
  | { type: 'updateCustomFrequency'; customFrequency: Frequency }
  | { type: 'updateCustomInterval'; customInterval: string }
  | { type: 'updateCustomByWeekday'; customByWeekday: number[] }
  | { type: 'updateCustomRuleMode'; customRuleMode: CustomRuleMode }
  | { type: 'updateCustomMonth'; customMonth: number }
  | { type: 'updateCustomNthMonthday'; customNthMonthday: string }
  | { type: 'updateCustomWeekday'; customWeekday: number }
  | { type: 'updateCustomNth'; customNth: number }
  | { type: 'updateRecurrenceEnd'; recurrenceEnd: RecurrenceEnd }
  | { type: 'updateAfterMeetingCount'; afterMeetingCount: string }
  | { type: 'updateUntilDate'; untilDate: Moment };

export function storeInitializer({
  initialRule,
  initialStartDate,
}: {
  initialRule: string | undefined;
  initialStartDate: Date;
}): State {
  // TODO: In the future we should think about handling unknown cases, e.g. by
  // throwing. For example what happens if frequency is hourly? What if we have
  // montly recurrence and multiple weekdays set? While we don't support these
  // cases, other tools might do it!

  const ruleOptions = initialRule ? parseRRule(initialRule) : undefined;
  const startDate = initialStartDate;
  const recurrencePreset = toRecurrencePreset(ruleOptions);

  const customFrequency = ruleOptions?.freq ?? Frequency.DAILY;
  const customInterval = ruleOptions?.interval?.toString() ?? '1';
  const {
    defaultCustomMonth,
    defaultCustomNth,
    defaultCustomNthMonthday,
    defaultCustomWeekday,
  } = getDefaultCustomRuleProperties(startDate);
  const customByWeekday = normalizeByWeekday(ruleOptions?.byweekday) ?? [
    defaultCustomWeekday,
  ];
  const customRuleMode =
    ruleOptions?.bymonthday === undefined
      ? CustomRuleMode.ByWeekday
      : CustomRuleMode.ByMonthday;
  const customMonth =
    normalizeNumeric(ruleOptions?.bymonth) ?? defaultCustomMonth;
  const customNthMonthday =
    normalizeNumeric(ruleOptions?.bymonthday)?.toString() ??
    defaultCustomNthMonthday?.toString();
  const customWeekday =
    normalizeNumeric(normalizeByWeekday(ruleOptions?.byweekday)) ??
    defaultCustomWeekday;
  const customNth = normalizeNumeric(ruleOptions?.bysetpos) ?? defaultCustomNth;

  const { defaultUntilDate, defaultAfterMeetingCount } =
    getDefaultRecurringMeetingEnd(ruleOptions?.freq, startDate);
  const recurrenceEnd = ruleOptions
    ? toRecurrenceEnd(ruleOptions)
    : RecurrenceEnd.Never;
  const afterMeetingCount =
    ruleOptions?.count?.toString() ?? defaultAfterMeetingCount.toString();
  const untilDate = moment(ruleOptions?.until ?? defaultUntilDate);

  return {
    isDirty: false,
    startDate,
    recurrencePreset,
    customFrequency,
    customInterval,
    customByWeekday,
    customRuleMode,
    customMonth,
    customNthMonthday,
    customWeekday,
    customNth,
    afterMeetingCount,
    recurrenceEnd,
    untilDate,
  };
}

function toRecurrencePreset(
  ruleOptions: Partial<Options> | undefined
): RecurrencePreset {
  const simpleRuleOptions = omit(ruleOptions, 'until', 'count', 'dtstart');

  if (!ruleOptions) {
    return RecurrencePreset.Once;
  } else if (isEqual(simpleRuleOptions, { freq: Frequency.DAILY })) {
    return RecurrencePreset.Daily;
  } else if (isEqual(simpleRuleOptions, { freq: Frequency.WEEKLY })) {
    return RecurrencePreset.Weekly;
  } else if (
    isEqual(simpleRuleOptions, {
      freq: Frequency.WEEKLY,
      byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
    })
  ) {
    return RecurrencePreset.MondayToFriday;
  } else if (isEqual(simpleRuleOptions, { freq: Frequency.MONTHLY })) {
    return RecurrencePreset.Monthly;
  } else if (isEqual(simpleRuleOptions, { freq: Frequency.YEARLY })) {
    return RecurrencePreset.Yearly;
  } else {
    return RecurrencePreset.Custom;
  }
}

function toRecurrenceEnd(ruleOptions: Partial<Options>): RecurrenceEnd {
  if (ruleOptions.count !== null && ruleOptions.count !== undefined) {
    return RecurrenceEnd.AfterMeetingCount;
  } else if (ruleOptions.until !== null && ruleOptions.until !== undefined) {
    return RecurrenceEnd.UntilDate;
  } else {
    return RecurrenceEnd.Never;
  }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'updateStartDate': {
      if (moment(action.startDate).isSame(state.startDate)) {
        return state;
      }

      if (!action.isMeetingCreation) {
        // After meeting creation, we stop reseting everything once the start
        // date is changed
        return {
          ...state,
          startDate: action.startDate,
          // TODO: As an alternative, we could just stop resetting the until
          // date and meeting count, but still adjust the rest.
        };
      }

      const { ruleOptions } = toRuleOptions(state);
      const { defaultAfterMeetingCount, defaultUntilDate } =
        getDefaultRecurringMeetingEnd(ruleOptions?.freq, action.startDate);
      const {
        defaultCustomMonth,
        defaultCustomNth,
        defaultCustomNthMonthday,
        defaultCustomWeekday,
      } = getDefaultCustomRuleProperties(action.startDate);

      return {
        ...state,
        isDirty: true,
        startDate: action.startDate,
        // Reset all fields that are based on the start date
        afterMeetingCount: defaultAfterMeetingCount.toString(),
        untilDate: moment(defaultUntilDate),
        customByWeekday: [defaultCustomWeekday],
        customMonth: defaultCustomMonth,
        customNth: defaultCustomNth,
        customNthMonthday: defaultCustomNthMonthday.toString(),
        customWeekday: defaultCustomWeekday,
      };
    }

    case 'updateCustomFrequency': {
      const {
        defaultCustomMonth,
        defaultCustomNth,
        defaultCustomNthMonthday,
        defaultCustomWeekday,
      } = getDefaultCustomRuleProperties(state.startDate);

      return {
        ...state,
        isDirty: true,
        customFrequency: action.customFrequency,
        // Reset related fields
        customByWeekday: [defaultCustomWeekday],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: defaultCustomMonth,
        customNth: defaultCustomNth,
        customNthMonthday: defaultCustomNthMonthday.toString(),
        customWeekday: defaultCustomWeekday,
      };
    }

    case 'updateCustomInterval': {
      return {
        ...state,
        isDirty: true,
        customInterval: action.customInterval,
      };
    }

    case 'updateCustomByWeekday': {
      return {
        ...state,
        isDirty: true,
        customByWeekday: action.customByWeekday,
      };
    }

    case 'updateCustomRuleMode': {
      return {
        ...state,
        isDirty: true,
        customRuleMode: action.customRuleMode,
      };
    }

    case 'updateCustomMonth': {
      return {
        ...state,
        isDirty: true,
        customMonth: action.customMonth,
      };
    }

    case 'updateCustomNthMonthday': {
      return {
        ...state,
        isDirty: true,
        customNthMonthday: action.customNthMonthday,
      };
    }

    case 'updateCustomWeekday': {
      return {
        ...state,
        isDirty: true,
        customWeekday: action.customWeekday,
      };
    }

    case 'updateCustomNth': {
      return {
        ...state,
        isDirty: true,
        customNth: action.customNth,
      };
    }

    case 'updateRecurrenceEnd': {
      return {
        ...state,
        isDirty: true,
        recurrenceEnd: action.recurrenceEnd,
      };
    }

    case 'updateAfterMeetingCount': {
      return {
        ...state,
        isDirty: true,
        afterMeetingCount: action.afterMeetingCount,
      };
    }

    case 'updateUntilDate': {
      return {
        ...state,
        isDirty: true,
        untilDate: action.untilDate,
      };
    }

    case 'updateRecurrencePreset': {
      const { ruleOptions } = toRuleOptions({
        ...state,
        recurrencePreset: action.recurrencePreset,
      });
      const { defaultAfterMeetingCount, defaultUntilDate } =
        getDefaultRecurringMeetingEnd(ruleOptions?.freq, state.startDate);
      const {
        defaultCustomMonth,
        defaultCustomNth,
        defaultCustomNthMonthday,
        defaultCustomWeekday,
      } = getDefaultCustomRuleProperties(state.startDate);

      return {
        ...state,
        isDirty: true,
        recurrencePreset: action.recurrencePreset,
        // Reset all fields
        afterMeetingCount: defaultAfterMeetingCount.toString(),
        untilDate: moment(defaultUntilDate),
        customFrequency: ruleOptions?.freq ?? Frequency.DAILY,
        customInterval: '1',
        customByWeekday: normalizeByWeekday(ruleOptions?.byweekday) ?? [
          defaultCustomWeekday,
        ],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: defaultCustomMonth,
        customNth: defaultCustomNth,
        customNthMonthday: defaultCustomNthMonthday.toString(),
        customWeekday: defaultCustomWeekday,
      };
    }

    default:
      return state;
  }
}

function toRuleOptions(state: State): {
  ruleOptions: Partial<Options> | undefined;
  isValid: boolean;
} {
  const ruleOptions: Partial<Options> = {};
  let isValid = true;

  if (state.recurrencePreset === RecurrencePreset.Daily) {
    ruleOptions.freq = Frequency.DAILY;
  } else if (state.recurrencePreset === RecurrencePreset.Weekly) {
    ruleOptions.freq = Frequency.WEEKLY;
  } else if (state.recurrencePreset === RecurrencePreset.MondayToFriday) {
    ruleOptions.freq = Frequency.WEEKLY;
    ruleOptions.byweekday = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
  } else if (state.recurrencePreset === RecurrencePreset.Monthly) {
    ruleOptions.freq = Frequency.MONTHLY;
  } else if (state.recurrencePreset === RecurrencePreset.Yearly) {
    ruleOptions.freq = Frequency.YEARLY;
  } else if (state.recurrencePreset === RecurrencePreset.Custom) {
    ruleOptions.freq = state.customFrequency;
    const customInterval = parseInt(state.customInterval);

    if (!isNaN(customInterval) && customInterval > 0) {
      ruleOptions.interval = customInterval;
    } else {
      isValid = false;
    }

    if (state.customFrequency === Frequency.WEEKLY) {
      if (state.customByWeekday.length > 0) {
        // Only include if not the default
        ruleOptions.byweekday = state.customByWeekday;
      }
    }

    if (
      state.customFrequency === Frequency.MONTHLY ||
      state.customFrequency === Frequency.YEARLY
    ) {
      if (state.customRuleMode === CustomRuleMode.ByMonthday) {
        const bymonthday = parseInt(state.customNthMonthday);

        if (!isNaN(bymonthday) && bymonthday > 0 && bymonthday <= 31) {
          ruleOptions.bymonthday = bymonthday;
        } else {
          isValid = false;
        }

        if (state.customFrequency === Frequency.YEARLY) {
          ruleOptions.bymonth = state.customMonth;
        }
      } else if (state.customRuleMode === CustomRuleMode.ByWeekday) {
        ruleOptions.bysetpos = state.customNth;
        ruleOptions.byweekday = state.customWeekday;

        if (state.customFrequency === Frequency.YEARLY) {
          ruleOptions.bymonth = state.customMonth;
        }
      }
    }
  } else {
    // Early exit, no need to create rule options if isn't recurring
    return { ruleOptions: undefined, isValid: true };
  }

  if (state.recurrenceEnd === RecurrenceEnd.AfterMeetingCount) {
    const afterMeetingCount = parseInt(state.afterMeetingCount);

    if (!isNaN(afterMeetingCount) && afterMeetingCount > 0) {
      ruleOptions.count = afterMeetingCount;
    } else {
      isValid = false;
    }
  } else if (state.recurrenceEnd === RecurrenceEnd.UntilDate) {
    if (state.untilDate.isValid()) {
      ruleOptions.until = state.untilDate.toDate();
    } else {
      isValid = false;
    }
  } else {
    // Nothing to set, until and count are undefined
  }

  return { ruleOptions, isValid };
}

export function toRule(state: State): {
  rrule: string | undefined;
  isValid: boolean;
} {
  const { ruleOptions, isValid } = toRuleOptions(state);
  const rrule = ruleOptions ? stringifyRRule(ruleOptions) : undefined;

  return {
    rrule,
    isValid,
  };
}

export function useRecurrenceEditorState(
  initialRule: string | undefined,
  initialStartDate: Date
): {
  state: State;
  rrule: string | undefined;
  isValid: boolean;
  dispatch: Dispatch<Action>;
} {
  const [state, dispatch] = useReducer(
    reducer,
    { initialRule, initialStartDate },
    storeInitializer
  );
  const { rrule, isValid } = toRule(state);
  return { state, rrule, isValid, dispatch };
}
