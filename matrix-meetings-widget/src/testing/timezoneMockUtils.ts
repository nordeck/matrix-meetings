/*
 * Copyright 2025 Nordeck IT + Consulting GmbH
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

import { Settings } from 'luxon';
import { vi } from 'vitest';

// store original instance
const DateTimeFormat = Intl.DateTimeFormat;

export function mockDateTimeFormatTimeZone(timeZone: string): void {
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((locale, options) => {
    const format = new DateTimeFormat(locale, {
      ...options,
      timeZone: options?.timeZone ?? timeZone,
    });

    // replace all uncommon whitespace characters with ' '. Relates to https://github.com/nodejs/node/pull/45068
    // where the unicode standard decided to use U+2009 in some cases. This breaks some of our tests
    const originalFormatRange = format.formatRange;
    vi.spyOn(format, 'formatRange').mockImplementation((startDate, endDate) =>
      originalFormatRange.call(format, startDate, endDate).replace(/\s+/g, ' '),
    );

    return format;
  });

  // make sure getTimezoneOffset is based on the provided timezone and
  // not the system
  vi.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function (
    this: Date,
  ) {
    const dateInLocalTZ = new Date(this.toLocaleString('en-US', { timeZone }));
    const dateInTargetTZ = new Date(
      this.toLocaleString('en-US', { timeZone: 'UTC' }),
    );
    const tzOffset = dateInTargetTZ.getTime() - dateInLocalTZ.getTime();
    return tzOffset / 1000 / 60;
  });

  // We want our tests to be in a reproducible time zone, always resulting in
  // the same results, independent from where they are run.
  Settings.defaultZone = timeZone;
}
