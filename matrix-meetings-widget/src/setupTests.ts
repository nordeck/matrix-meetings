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
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { TextDecoder, TextEncoder } from 'util';
// Make sure to initialize i18n (see mock below)
import { mockDateTimeFormatTimeZone } from '@nordeck/matrix-meetings-calendar';
import './i18n';
import { setLocale } from './lib/locale';

// Use a different configuration for i18next during tests
jest.mock('./i18n', () => {
  const i18n = require('i18next');
  const en = { translation: require('../public/locales/en/translation.json') };
  const de = { translation: require('../public/locales/de/translation.json') };
  const { initReactI18next } = require('react-i18next');
  const { registerDateRangeFormatter } = require('./dateRangeFormatter');

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

  registerDateRangeFormatter(i18n);

  return i18n;
});

beforeEach(() => {
  // We want our tests to be in a reproducible time zone, always resulting in
  // the same results, independent from where they are run.
  mockDateTimeFormatTimeZone('UTC');

  setLocale('en');
});

// Provide mocks for the object URL related
// functions that are not provided by jsdom.
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

// Add support for jest-axe
expect.extend(toHaveNoViolations);

// Tell MUI that we have a mouse available and that the UI should not fallback
// to mobile/touch mode
beforeEach(() => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: query === '(pointer: fine)',
    media: '',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
});

// Polyfills required for jsdom
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Provide a mock for the Clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn() },
});

// Polyfill structuredClone
// @todo may become unnecessary after Vite migration
global.structuredClone = (val) => {
  return JSON.parse(JSON.stringify(val));
};
