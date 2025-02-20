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

import i18next from 'i18next';
import i18nextBackend from 'i18next-fs-backend';
import { Settings } from 'luxon';
import 'reflect-metadata';
import { registerDateRangeFormatter } from './src/dateRangeFormatter';

// @ts-expect-error Ignore error. TypeScript complains, even if 'resolveJsonModule' is enabled.
import translationDe from './src/static/locales/de/translation.json';
// @ts-expect-error Ignore error. TypeScript complains, even if 'resolveJsonModule' is enabled.
import translationEn from './src/static/locales/en/translation.json';

// Use a different configuration for i18next during tests
i18next.use(i18nextBackend).init({
  debug: false,
  saveMissing: true,
  fallbackLng: 'en',
  preload: ['en', 'de'],
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: { translation: translationEn },
    de: { translation: translationDe },
  },
});

const DateTimeFormat = Intl.DateTimeFormat;
beforeEach(() => {
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((locale, options) => {
    const format = new DateTimeFormat(locale, options);

    // replace all uncommon whitespace characters with ' '. Relates to https://github.com/nodejs/node/pull/45068
    // where the unicode standard decided to use U+2009 in some cases. This breaks some of our tests
    // @ts-ignore: DateTimeFormat#formatRange will be available in TypeScript >4.7.2
    const originalFormatRange = format.formatRange;
    jest
      // @ts-ignore: DateTimeFormat#formatRange will be available in TypeScript >4.7.2
      .spyOn(format, 'formatRange')
      // @ts-ignore: DateTimeFormat#formatRange will be available in TypeScript >4.7.2
      .mockImplementation((startDate, endDate) =>
        originalFormatRange
          .call(format, startDate, endDate)
          .replace(/\s+/g, ' '),
      );

    return format;
  });
});

registerDateRangeFormatter(i18next);

// We want our tests to be in a reproducible time zone, always resulting in
// the same results, independent from where they are run.
Settings.defaultZone = 'UTC';
Settings.defaultLocale = 'en';
