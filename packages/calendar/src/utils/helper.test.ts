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

import { isWeekdays } from './helpers';

describe('isWeekdays', () => {
  it('should not detect undefined as weekdays', () => {
    expect(isWeekdays(undefined)).toEqual(false);
  });

  it('should detect ordered MO-FR as weekdays', () => {
    expect(isWeekdays([0, 1, 2, 3, 4])).toEqual(true);
  });

  it('should detect unordered MO-FR as weekdays', () => {
    expect(isWeekdays([4, 3, 1, 2, 0])).toEqual(true);
  });

  it('should not detect MO-SA as weekdays', () => {
    expect(isWeekdays([0, 1, 2, 3, 4, 5])).toEqual(false);
  });
});
