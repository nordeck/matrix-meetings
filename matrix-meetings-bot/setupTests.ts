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
import translationDe from './src/static/locales/de/translation.json';
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

// We want our tests to be in a reproducible time zone, always resulting in
// the same results, independent from where they are run.
Settings.defaultZone = 'UTC';
Settings.defaultLocale = 'en';
