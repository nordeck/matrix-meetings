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

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'node:util';
import { expect, vi } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import './i18n';
import { setLocale } from './lib/locale';
import { mockDateTimeFormatTimeZone } from './testing';

// Use a different configuration for i18next during tests
vi.mock('./i18n', async () => {
  const i18n = await vi.importActual<typeof import('i18next')>('i18next');
  const en = {
    translation: await vi.importActual('../public/locales/en/translation.json'),
  };
  const de = {
    translation: await vi.importActual('../public/locales/de/translation.json'),
  };
  const { initReactI18next } =
    await vi.importActual<typeof import('react-i18next')>('react-i18next');
  const { registerDateRangeFormatter } = await vi.importActual<
    typeof import('./dateRangeFormatter')
  >('./dateRangeFormatter');

  i18n.use(initReactI18next).init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en,
      de,
    },
  });

  // @ts-ignore for tests
  registerDateRangeFormatter(i18n);

  return i18n;
});

// Prevent act warnings https://github.com/testing-library/react-testing-library/issues/1061
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  // We want our tests to be in a reproducible time zone, always resulting in
  // the same results, independent from where they are run.
  mockDateTimeFormatTimeZone('UTC');

  setLocale('en');
});

// Provide mocks for the object URL related
// functions that are not provided by jsdom.
window.URL.createObjectURL = vi.fn();
window.URL.revokeObjectURL = vi.fn();

// Add support for vitest-axe
expect.extend(axeMatchers);

// Tell MUI that we have a mouse available and that the UI should not fallback
// to mobile/touch mode
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === '(pointer: fine)',
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
});

// Polyfills required for jsdom
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Provide a mock for the Clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn() },
});

// Polyfill structuredClone
// @todo may become unnecessary after Vite migration
global.structuredClone = (val) => {
  return JSON.parse(JSON.stringify(val));
};

afterEach(() => {
  cleanup();
});
