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

import { setLocale } from '../../../../lib/locale';
import { convertWeekdayFromLocaleToRRule } from './helpers';

describe('convertWeekdayFromLocaleToRRule', () => {
  it('should convert the locale weekday number to the weekday rrule number', () => {
    expect(convertWeekdayFromLocaleToRRule(0)).toBe(6);
    expect(convertWeekdayFromLocaleToRRule(1)).toBe(0);
    expect(convertWeekdayFromLocaleToRRule(2)).toBe(1);
    expect(convertWeekdayFromLocaleToRRule(3)).toBe(2);
    expect(convertWeekdayFromLocaleToRRule(4)).toBe(3);
    expect(convertWeekdayFromLocaleToRRule(5)).toBe(4);
    expect(convertWeekdayFromLocaleToRRule(6)).toBe(5);
  });
});

it('should convert the locale weekday number to the weekday rrule number with german locale', () => {
  setLocale('de');

  expect(convertWeekdayFromLocaleToRRule(0)).toBe(0);
  expect(convertWeekdayFromLocaleToRRule(1)).toBe(1);
  expect(convertWeekdayFromLocaleToRRule(2)).toBe(2);
  expect(convertWeekdayFromLocaleToRRule(3)).toBe(3);
  expect(convertWeekdayFromLocaleToRRule(4)).toBe(4);
  expect(convertWeekdayFromLocaleToRRule(5)).toBe(5);
  expect(convertWeekdayFromLocaleToRRule(6)).toBe(6);
});
