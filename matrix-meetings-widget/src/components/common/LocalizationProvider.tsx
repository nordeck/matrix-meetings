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

import {
  deDE,
  enUS,
  LocalizationProvider as MuiLocalizationProvider,
} from '@mui/x-date-pickers';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { AdapterLuxonWeekday } from './AdapterLuxonWeekday';

export function LocalizationProvider({ children }: PropsWithChildren<{}>) {
  const { i18n } = useTranslation();
  const language: string | undefined = i18n.languages?.[0];
  const locale =
    language && new Intl.Locale(language).language === 'de' ? deDE : enUS;

  return (
    <MuiLocalizationProvider
      dateAdapter={AdapterLuxonWeekday}
      localeText={
        locale.components.MuiLocalizationProvider.defaultProps.localeText
      }
      adapterLocale={language}
    >
      {children}
    </MuiLocalizationProvider>
  );
}
