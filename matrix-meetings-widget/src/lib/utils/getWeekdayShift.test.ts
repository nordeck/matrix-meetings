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

import { describe, expect, it } from 'vitest';
import { setLocale } from '../locale';
import { getWeekdayShift } from './getWeekdayShift';

describe('getWeekdayShift', () => {
  it('shift 1 day for en locale', () => {
    expect(getWeekdayShift()).toEqual(1);
  });

  it('no change for de locale', () => {
    setLocale('de');
    expect(getWeekdayShift()).toEqual(0);
  });
});
