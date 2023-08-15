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

import { DateTime, Settings } from 'luxon';

/**
 * Gets a value that would shift Date Picker week first day in the following order: Monday -> Sunday -> Saturday... .
 * Negative value would shift in another direction. Zero would keep the default.
 */
export function getWeekdayShift(): number {
  const firstDayOfWeek =
    new Intl.Locale(Settings.defaultLocale).language === 'de' ? 1 : 0;
  return DateTime.now().startOf('week').weekday - firstDayOfWeek;
}
