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

import { renderHook } from '@testing-library/react-hooks';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockMeeting } from '../../../lib/testUtils';
import { useDatePickersState } from './useDatePickersState';

describe('useDatePickersState', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockImplementation(
      () => +new Date('2022-01-02T13:10:00.000Z'),
    );
  });

  describe('meeting mode', () => {
    it('should return no error if values are correct', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T13:10:00Z'),
          endTime: DateTime.fromISO('2022-01-02T15:30:00Z'),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: true,
        startDateError: false,
        endDateError: false,
        minStartDate: DateTime.fromISO('2022-01-02T13:10:00.000Z'),
      });
    });

    it('should return error if start date is in the past', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T12:15:00Z'),
          endTime: DateTime.fromISO('2022-01-02T13:30:00Z'),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: true,
        startDateError: 'Meeting cannot start in the past.',
        endDateError: false,
        minStartDate: DateTime.fromISO('2022-01-02T13:10:00.000Z'),
      });
    });

    it('should return error if start date is before the start of the meeting series', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-01T12:10:00Z'),
          endTime: DateTime.fromISO('2022-01-02T13:30:00Z'),
          minStartTimeOverride: DateTime.fromISO('2022-01-01T12:15:00Z'),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: true,
        startDateError: 'Meeting cannot start in the past.',
        endDateError: false,
        minStartDate: DateTime.fromISO('2022-01-01T12:15:00.000Z'),
      });
    });

    it('should return error if end date is before start date', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T14:15:00Z'),
          endTime: DateTime.fromISO('2022-01-02T14:00:00Z'),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: true,
        startDateError: false,
        endDateError: 'Meeting should start before it ends.',
        minStartDate: DateTime.fromISO('2022-01-02T13:10:00.000Z'),
      });
    });
  });

  describe('breakout mode', () => {
    it('should hide date pickers if parent is a single day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T14:15:00Z'),
          endTime: DateTime.fromISO('2022-01-02T14:30:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-02T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: false,
        startDateError: false,
        endDateError: false,
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });

    it('should show date pickers if parent is a multi day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T14:15:00Z'),
          endTime: DateTime.fromISO('2022-01-02T14:30:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-03T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: true,
        startDateError: false,
        endDateError: false,
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });

    it('should return error if start time is too early on single day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T13:55:00Z'),
          endTime: DateTime.fromISO('2022-01-02T14:10:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-02T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: false,
        startDateError:
          'Breakout session should start between 2:00 PM and 3:00 PM.',
        endDateError: false,
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });

    it('should return error if start time is too early on multi day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T13:55:00Z'),
          endTime: DateTime.fromISO('2022-01-02T14:10:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-03T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: true,
        startDateError: expect.stringMatching(
          /Breakout session should start between January 2, 2022(,| at) 2:00 PM and January 3, 2022(,| at) 3:00 PM/,
        ),
        endDateError: false,
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });

    it('should return error if end time is too early on single day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T13:40:00Z'),
          endTime: DateTime.fromISO('2022-01-02T13:55:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-02T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: false,
        startDateError:
          'Breakout session should start between 2:00 PM and 3:00 PM.',
        endDateError:
          'Breakout session should end between 2:00 PM and 3:00 PM.',
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });

    it('should return error if end time is too early on multi day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T13:40:00Z'),
          endTime: DateTime.fromISO('2022-01-02T13:55:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-03T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: true,
        startDateError: expect.stringMatching(
          /Breakout session should start between January 2, 2022(,| at) 2:00 PM and January 3, 2022(,| at) 3:00 PM/,
        ),
        endDateError: expect.stringMatching(
          /Breakout session should end between January 2, 2022(,| at) 2:00 PM and January 3, 2022(,| at) 3:00 PM/,
        ),
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });

    it('should return error if end time is too late on single day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T14:15:00Z'),
          endTime: DateTime.fromISO('2022-01-02T15:30:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-02T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: false,
        startDateError: false,
        endDateError:
          'Breakout session should end between 2:00 PM and 3:00 PM.',
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });

    it('should return error if end time is too late on multi day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T14:15:00Z'),
          endTime: DateTime.fromISO('2022-01-03T15:30:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-03T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: true,
        startDateError: false,
        endDateError: expect.stringMatching(
          /Breakout session should end between January 2, 2022(,| at) 2:00 PM and January 3, 2022(,| at) 3:00 PM./,
        ),
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });

    it('should return error if end time is before start date on single day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T14:15:00Z'),
          endTime: DateTime.fromISO('2022-01-02T14:10:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-02T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: false,
        startDateError: false,
        endDateError: 'Breakout session should start before it ends.',
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });

    it('should return error if end time is before start date on multi day meeting', () => {
      const { result } = renderHook(() =>
        useDatePickersState({
          startTime: DateTime.fromISO('2022-01-02T14:15:00Z'),
          endTime: DateTime.fromISO('2022-01-02T14:10:00Z'),
          parentMeeting: mockMeeting({
            content: {
              startTime: '2022-01-02T14:00:00Z',
              endTime: '2022-01-03T15:00:00Z',
            },
          }),
        }),
      );

      expect(result.current).toEqual({
        showDatePickers: true,
        startDateError: false,
        endDateError: 'Breakout session should start before it ends.',
        minStartDate: DateTime.fromISO('2022-01-02T14:00:00Z'),
      });
    });
  });
});
