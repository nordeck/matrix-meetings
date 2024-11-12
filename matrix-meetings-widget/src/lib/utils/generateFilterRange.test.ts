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

import { mockDateTimeFormatTimeZone } from '@nordeck/matrix-meetings-calendar/src/testing';
import { describe, expect, it } from 'vitest';
import { setLocale } from '../locale';
import { generateFilterRange } from './generateFilterRange';

describe('generateFilterRange', () => {
  it.each([
    '2020-01-10T00:00:00Z',
    '2020-01-10T12:00:00Z',
    '2020-01-10T23:59:59Z',
  ])('should select day for %p', (date) => {
    expect(generateFilterRange('day', date)).toEqual({
      startDate: '2020-01-10T00:00:00.000+00:00',
      endDate: '2020-01-10T23:59:59.999+00:00',
    });
  });

  it.each([
    '2020-01-09T23:00:00Z',
    '2020-01-10T12:00:00+01:00',
    '2020-01-10T22:59:59Z',
  ])('should select day for %p in Berlin time and german locale', (date) => {
    setLocale('de');
    mockDateTimeFormatTimeZone('Europe/Berlin');

    expect(generateFilterRange('day', date)).toEqual({
      startDate: '2020-01-10T00:00:00.000+01:00',
      endDate: '2020-01-10T23:59:59.999+01:00',
    });
  });

  it.each([
    '2020-08-09T22:00:00Z',
    '2020-08-10T12:00:00+02:00',
    '2020-08-10T21:59:59Z',
  ])(
    'should select day for %p in DST Berlin time and german locale',
    (date) => {
      setLocale('de');
      mockDateTimeFormatTimeZone('Europe/Berlin');

      expect(generateFilterRange('day', date)).toEqual({
        startDate: '2020-08-10T00:00:00.000+02:00',
        endDate: '2020-08-10T23:59:59.999+02:00',
      });
    },
  );

  it.each([
    '2020-01-05T00:00:00Z',
    '2020-01-10T12:00:00Z',
    '2020-01-11T23:59:59Z',
  ])('should select week for %p', (date) => {
    expect(generateFilterRange('week', date)).toEqual({
      startDate: '2020-01-05T00:00:00.000+00:00',
      endDate: '2020-01-11T23:59:59.999+00:00',
    });
  });

  it.each([
    '2020-01-05T23:00:00Z',
    '2020-01-10T12:00:00+01:00',
    '2020-01-12T22:59:59Z',
  ])('should select week for %p in Berlin time and german locale', (date) => {
    setLocale('de');
    mockDateTimeFormatTimeZone('Europe/Berlin');

    expect(generateFilterRange('week', date)).toEqual({
      startDate: '2020-01-06T00:00:00.000+01:00',
      endDate: '2020-01-12T23:59:59.999+01:00',
    });
  });

  it.each([
    '2020-08-02T22:00:00Z',
    '2020-08-07T12:00:00+02:00',
    '2020-08-09T21:59:59Z',
  ])(
    'should select week for %p in DST Berlin time and german locale',
    (date) => {
      setLocale('de');
      mockDateTimeFormatTimeZone('Europe/Berlin');

      expect(generateFilterRange('week', date)).toEqual({
        startDate: '2020-08-03T00:00:00.000+02:00',
        endDate: '2020-08-09T23:59:59.999+02:00',
      });
    },
  );

  it('should select first full week when switching from the month view for august 2023', () => {
    expect(
      generateFilterRange('week', '2023-08-01T00:00:00Z', 'month'),
    ).toEqual({
      startDate: '2023-08-06T00:00:00.000+00:00',
      endDate: '2023-08-12T23:59:59.999+00:00',
    });
  });

  it('should select first full week when switching from the month view for august 2023 in DST Berlin time and german locale', () => {
    setLocale('de');
    mockDateTimeFormatTimeZone('Europe/Berlin');

    expect(
      generateFilterRange('week', '2023-08-01T00:00:00Z', 'month'),
    ).toEqual({
      startDate: '2023-08-07T00:00:00.000+02:00',
      endDate: '2023-08-13T23:59:59.999+02:00',
    });
  });

  it.each([
    '2020-01-05T00:00:00Z',
    '2020-01-10T12:00:00Z',
    '2020-01-11T23:59:59Z',
  ])('should select work week for %p', (date) => {
    expect(generateFilterRange('workWeek', date)).toEqual({
      startDate: '2020-01-06T00:00:00.000+00:00',
      endDate: '2020-01-10T23:59:59.999+00:00',
    });
  });

  it.each([
    '2020-01-05T23:00:00Z',
    '2020-01-10T12:00:00+01:00',
    '2020-01-12T22:59:59Z',
  ])(
    'should select work week for %p in Berlin time and german locale',
    (date) => {
      setLocale('de');
      mockDateTimeFormatTimeZone('Europe/Berlin');

      expect(generateFilterRange('workWeek', date)).toEqual({
        startDate: '2020-01-06T00:00:00.000+01:00',
        endDate: '2020-01-10T23:59:59.999+01:00',
      });
    },
  );

  it.each([
    '2020-08-02T22:00:00Z',
    '2020-08-07T12:00:00+02:00',
    '2020-08-09T21:59:59Z',
  ])(
    'should select work week for %p in DST Berlin time and german locale',
    (date) => {
      setLocale('de');
      mockDateTimeFormatTimeZone('Europe/Berlin');

      expect(generateFilterRange('workWeek', date)).toEqual({
        startDate: '2020-08-03T00:00:00.000+02:00',
        endDate: '2020-08-07T23:59:59.999+02:00',
      });
    },
  );

  it('should select first full work week when switching from the month view for august 2023', () => {
    expect(
      generateFilterRange('workWeek', '2023-08-01T00:00:00Z', 'month'),
    ).toEqual({
      startDate: '2023-08-07T00:00:00.000+00:00',
      endDate: '2023-08-11T23:59:59.999+00:00',
    });
  });

  it('should select first full work week when switching from the month view for august 2023 in DST Berlin time and german locale', () => {
    setLocale('de');
    mockDateTimeFormatTimeZone('Europe/Berlin');

    expect(
      generateFilterRange('workWeek', '2023-08-01T00:00:00Z', 'month'),
    ).toEqual({
      startDate: '2023-08-07T00:00:00.000+02:00',
      endDate: '2023-08-11T23:59:59.999+02:00',
    });
  });

  it.each([
    '2020-01-01T00:00:00Z',
    '2020-01-10T12:00:00Z',
    '2020-01-31T23:59:59Z',
  ])('should select month for %p', (date) => {
    expect(generateFilterRange('month', date)).toEqual({
      startDate: '2020-01-01T00:00:00.000+00:00',
      endDate: '2020-01-31T23:59:59.999+00:00',
    });
  });

  it.each([
    '2019-12-31T23:00:00Z',
    '2020-01-10T12:00:00+01:00',
    '2020-01-31T22:59:59Z',
  ])('should select month for %p in Berlin time and german locale', (date) => {
    setLocale('de');
    mockDateTimeFormatTimeZone('Europe/Berlin');

    expect(generateFilterRange('month', date)).toEqual({
      startDate: '2020-01-01T00:00:00.000+01:00',
      endDate: '2020-01-31T23:59:59.999+01:00',
    });
  });

  it.each([
    '2020-07-31T22:00:00Z',
    '2020-08-07T12:00:00+02:00',
    '2020-08-31T21:59:59Z',
  ])('should select month for %p in Berlin time and german locale', (date) => {
    setLocale('de');
    mockDateTimeFormatTimeZone('Europe/Berlin');

    expect(generateFilterRange('month', date)).toEqual({
      startDate: '2020-08-01T00:00:00.000+02:00',
      endDate: '2020-08-31T23:59:59.999+02:00',
    });
  });
});
