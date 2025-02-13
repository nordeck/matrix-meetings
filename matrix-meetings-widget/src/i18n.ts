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

import { extractWidgetParameters } from '@matrix-widget-toolkit/api';
import { WidgetToolkitI18nBackend } from '@matrix-widget-toolkit/mui';
import i18n from 'i18next';
import LanguageDetector, {
  CustomDetector,
} from 'i18next-browser-languagedetector';
import ChainedBackend from 'i18next-chained-backend';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { registerDateRangeFormatter } from './dateRangeFormatter';
import { setLocale } from './lib/locale';

const widgetApiLanguageDetector: CustomDetector = {
  name: 'widgetApi',
  lookup: () => {
    const { clientLanguage } = extractWidgetParameters();
    return clientLanguage;
  },
};

const neoboardLanguageDetector = new LanguageDetector(undefined, {
  order: ['widgetApi', 'navigator'],
});
neoboardLanguageDetector.addDetector(widgetApiLanguageDetector);

i18n
  .use(ChainedBackend)
  .use(neoboardLanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    backend: {
      backends: [HttpBackend, WidgetToolkitI18nBackend],
    },

    supportedLngs: ['en', 'de'],
    nonExplicitSupportedLngs: true,
  });

registerDateRangeFormatter(i18n);

setLocale(i18n.language);

i18n.on('languageChanged', () => {
  setLocale(i18n.language);
});

export default i18n;
