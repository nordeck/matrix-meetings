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

import { getTimeDistanceState } from './getTimeDistanceState';

describe('getTimeDistanceState', () => {
  it.each([['2020-01-01T00:00:00Z'], ['2020-01-01T01:59:59Z']])(
    'should hide if >8 in the future (at %s)',
    (now) => {
      expect(
        getTimeDistanceState({
          now,
          startDate: '2020-01-01T10:00:00Z',
          endDate: '2020-01-01T12:00:00Z',
        })
      ).toEqual({
        renderLabel: false,
        updateInterval: 1_800_000,
      });
    }
  );

  it.each([
    ['2020-01-01T02:00:00Z', 'in 8 hours'],
    ['2020-01-01T05:30:00Z', 'in 4 hours'],
    ['2020-01-01T08:59:59Z', 'in 1 hour'],
    ['2020-01-01T09:00:00Z', 'in 1 hour'],
  ])('should show 1-8 hours in the future (at %s)', (now, labelText) => {
    expect(
      getTimeDistanceState({
        now,
        startDate: '2020-01-01T10:00:00Z',
        endDate: '2020-01-01T12:00:00Z',
      })
    ).toEqual({
      renderLabel: true,
      updateInterval: 300_000,
      animated: false,
      labelColor: 'info',
      labelText,
      rotateIcon: false,
    });
  });

  it.each([
    ['2020-01-01T09:00:01Z', 'in 59 minutes'],
    ['2020-01-01T09:30:00Z', 'in 30 minutes'],
    ['2020-01-01T09:54:59Z', 'in 5 minutes'],
  ])('should show 5-60 minutes in the future (at %s)', (now, labelText) => {
    expect(
      getTimeDistanceState({
        now,
        startDate: '2020-01-01T10:00:00Z',
        endDate: '2020-01-01T12:00:00Z',
      })
    ).toEqual({
      renderLabel: true,
      updateInterval: 60_000,
      animated: false,
      labelColor: 'info',
      labelText,
      rotateIcon: false,
    });
  });

  it.each([
    ['2020-01-01T09:55:00Z', 'in 5 minutes', 'warning'],
    ['2020-01-01T09:57:30Z', 'in 2 minutes', 'warning'],
    ['2020-01-01T09:59:00Z', 'in 01:00', 'error'],
    ['2020-01-01T09:59:30Z', 'in 30', 'error'],
    ['2020-01-01T09:59:59Z', 'in 01', 'error'],
  ])(
    'should show <5 minutes in the future (at %s)',
    (now, labelText, labelColor) => {
      expect(
        getTimeDistanceState({
          now,
          startDate: '2020-01-01T10:00:00Z',
          endDate: '2020-01-01T12:00:00Z',
        })
      ).toEqual({
        renderLabel: true,
        updateInterval: 1_000,
        animated: true,
        labelColor,
        labelText,
        rotateIcon: false,
      });
    }
  );

  it.each([
    ['2020-01-01T10:00:00Z', 'Ends in 2 hours', 'primary'],
    ['2020-01-01T10:30:00Z', 'Ends in 1 hour', 'primary'],
    ['2020-01-01T10:59:59Z', 'Ends in 1 hour', 'primary'],
    ['2020-01-01T11:00:00Z', 'Ends in 1 hour', 'primary'],
    ['2020-01-01T11:00:01Z', 'Ends in 59 minutes', 'primary'],
    ['2020-01-01T11:58:59Z', 'Ends in 1 minute', 'primary'],
    ['2020-01-01T11:59:00Z', 'Ends in 01:00', 'primary'],
    ['2020-01-01T11:59:59Z', 'Ends in 01', 'primary'],
  ])('should show running minutes (at %s)', (now, labelText, labelColor) => {
    expect(
      getTimeDistanceState({
        now,
        startDate: '2020-01-01T10:00:00Z',
        endDate: '2020-01-01T12:00:00Z',
      })
    ).toEqual({
      renderLabel: true,
      updateInterval: 1_000,
      animated: false,
      labelColor,
      labelText,
      rotateIcon: true,
    });
  });
});
