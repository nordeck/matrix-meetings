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

import { isFiniteSeries } from './helpers';

describe('isFiniteSeries', () => {
  it('should detect infinite series', () => {
    expect(isFiniteSeries({})).toBe(false);
  });

  it('should detect finite series with until date', () => {
    expect(isFiniteSeries({ until: new Date('2021-01-01T10:00:00Z') })).toBe(
      true,
    );
  });

  it('should detect finite series with after meeting count', () => {
    expect(isFiniteSeries({ count: 5 })).toBe(true);
  });
});
