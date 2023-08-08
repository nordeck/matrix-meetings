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

import { Settings } from 'luxon';

// store original instance
const DateTimeFormat = Intl.DateTimeFormat;

export function mockDateTimeFormatTimeZone(timeZone: string): void {
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    (locale, options) =>
      new DateTimeFormat(locale, {
        ...options,
        timeZone: options?.timeZone ?? timeZone,
      })
  );

  // make sure getTimezoneOffset is based on the provided timezone and
  // not the system
  jest
    .spyOn(Date.prototype, 'getTimezoneOffset')
    .mockImplementation(function (this: Date) {
      const dateInLocalTZ = new Date(
        this.toLocaleString('en-US', { timeZone })
      );
      const dateInTargetTZ = new Date(
        this.toLocaleString('en-US', { timeZone: 'UTC' })
      );
      const tzOffset = dateInTargetTZ.getTime() - dateInLocalTZ.getTime();
      return tzOffset / 1000 / 60;
    });

  // We want our tests to be in a reproducible time zone, always resulting in
  // the same results, independent from where they are run.
  Settings.defaultZone = timeZone;
}
