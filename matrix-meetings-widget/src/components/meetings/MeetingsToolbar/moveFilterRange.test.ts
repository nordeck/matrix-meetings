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

import { moveFilterRange } from './moveFilterRange';

afterEach(() => jest.useRealTimers());

describe('moveFilterRange', () => {
  it('move filter plus for day', () => {
    expect(
      moveFilterRange(
        '2020-06-10T00:00:00.000+00:00',
        '2020-06-10T23:59:59.999+00:00',
        'day',
        'plus',
      ),
    ).toEqual({
      startDate: '2020-06-11T00:00:00.000+00:00',
      endDate: '2020-06-11T23:59:59.999+00:00',
    });
  });

  it('move filter minus for day', () => {
    expect(
      moveFilterRange(
        '2020-06-10T00:00:00.000+00:00',
        '2020-06-10T23:59:59.999+00:00',
        'day',
        'minus',
      ),
    ).toEqual({
      startDate: '2020-06-09T00:00:00.000+00:00',
      endDate: '2020-06-09T23:59:59.999+00:00',
    });
  });

  it('move filter today for day', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-06-15T13:00:00.000Z'));

    expect(
      moveFilterRange(
        '2020-06-10T00:00:00.000+00:00',
        '2020-06-10T23:59:59.999+00:00',
        'day',
        'today',
      ),
    ).toEqual({
      startDate: '2020-06-15T00:00:00.000+00:00',
      endDate: '2020-06-15T23:59:59.999+00:00',
    });
  });

  it('move filter plus for week', () => {
    expect(
      moveFilterRange(
        '2020-06-07T00:00:00.000+00:00',
        '2020-06-13T23:59:59.999+00:00',
        'week',
        'plus',
      ),
    ).toEqual({
      startDate: '2020-06-14T00:00:00.000+00:00',
      endDate: '2020-06-20T23:59:59.999+00:00',
    });
  });

  it('move filter minus for week', () => {
    expect(
      moveFilterRange(
        '2020-06-07T00:00:00.000+00:00',
        '2020-06-13T23:59:59.999+00:00',
        'week',
        'minus',
      ),
    ).toEqual({
      startDate: '2020-05-31T00:00:00.000+00:00',
      endDate: '2020-06-06T23:59:59.999+00:00',
    });
  });

  it('move filter today for week', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-06-15T13:00:00.000Z'));

    expect(
      moveFilterRange(
        '2020-06-07T00:00:00.000+00:00',
        '2020-06-13T23:59:59.999+00:00',
        'week',
        'today',
      ),
    ).toEqual({
      startDate: '2020-06-14T00:00:00.000+00:00',
      endDate: '2020-06-20T23:59:59.999+00:00',
    });
  });

  it('move filter plus for work week', () => {
    expect(
      moveFilterRange(
        '2020-06-08T00:00:00.000+00:00',
        '2020-06-12T23:59:59.999+00:00',
        'workWeek',
        'plus',
      ),
    ).toEqual({
      startDate: '2020-06-15T00:00:00.000+00:00',
      endDate: '2020-06-19T23:59:59.999+00:00',
    });
  });

  it('move filter minus for work week', () => {
    expect(
      moveFilterRange(
        '2020-06-08T00:00:00.000+00:00',
        '2020-06-12T23:59:59.999+00:00',
        'workWeek',
        'minus',
      ),
    ).toEqual({
      startDate: '2020-06-01T00:00:00.000+00:00',
      endDate: '2020-06-05T23:59:59.999+00:00',
    });
  });

  it('move filter today for work week', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-06-15T13:00:00.000Z'));

    expect(
      moveFilterRange(
        '2020-06-08T00:00:00.000+00:00',
        '2020-06-12T23:59:59.999+00:00',
        'workWeek',
        'today',
      ),
    ).toEqual({
      startDate: '2020-06-15T00:00:00.000+00:00',
      endDate: '2020-06-19T23:59:59.999+00:00',
    });
  });

  it('move filter plus for month', () => {
    expect(
      moveFilterRange(
        '2020-08-01T00:00:00.000+00:00',
        '2020-08-31T23:59:59.999+00:00',
        'month',
        'plus',
      ),
    ).toEqual({
      startDate: '2020-09-01T00:00:00.000+00:00',
      endDate: '2020-09-30T23:59:59.999+00:00',
    });
  });

  it('move filter minus for month', () => {
    expect(
      moveFilterRange(
        '2020-07-01T00:00:00.000+00:00',
        '2020-07-31T23:59:59.999+00:00',
        'month',
        'minus',
      ),
    ).toEqual({
      startDate: '2020-06-01T00:00:00.000+00:00',
      endDate: '2020-06-30T23:59:59.999+00:00',
    });
  });

  it('move filter today for month', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-07-15T13:00:00.000Z'));

    expect(
      moveFilterRange(
        '2020-06-01T00:00:00.000+00:00',
        '2020-06-30T23:59:59.999+00:00',
        'month',
        'today',
      ),
    ).toEqual({
      startDate: '2020-07-01T00:00:00.000+00:00',
      endDate: '2020-07-31T23:59:59.999+00:00',
    });
  });

  it('move filter plus for list', () => {
    expect(
      moveFilterRange(
        '2020-06-07T00:00:00.000+00:00',
        '2020-06-08T23:59:59.999+00:00',
        'list',
        'plus',
      ),
    ).toEqual({
      startDate: '2020-06-09T00:00:00.000+00:00',
      endDate: '2020-06-10T23:59:59.999+00:00',
    });
  });

  it('move filter minus for list', () => {
    expect(
      moveFilterRange(
        '2020-06-07T00:00:00.000+00:00',
        '2020-06-08T23:59:59.999+00:00',
        'list',
        'minus',
      ),
    ).toEqual({
      startDate: '2020-06-05T00:00:00.000+00:00',
      endDate: '2020-06-06T23:59:59.999+00:00',
    });
  });

  it('move filter today for list', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-06-15T13:00:00.000Z'));

    expect(
      moveFilterRange(
        '2020-06-07T00:00:00.000+00:00',
        '2020-06-08T23:59:59.999+00:00',
        'list',
        'today',
      ),
    ).toEqual({
      startDate: '2020-06-15T00:00:00.000+00:00',
      endDate: '2020-06-21T23:59:59.999+00:00',
    });
  });
});
