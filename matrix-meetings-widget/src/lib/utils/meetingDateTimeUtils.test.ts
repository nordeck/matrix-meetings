/*
 * Copyright 2024 Nordeck IT + Consulting GmbH
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

import { mockMeeting } from '../testUtils';
import {
  isMeetingSpanningMultipleDays,
  isMeetingSpanningMultipleYears,
} from './meetingDateTimeUtils';

describe('isMeetingSpanningMultipleDays', () => {
  it('should be false if start and end time are at the same day', () => {
    expect(isMeetingSpanningMultipleDays(mockMeeting())).toEqual(false);
  });

  it('should be true if start and end time are at the different days', () => {
    expect(
      isMeetingSpanningMultipleDays(
        mockMeeting({
          content: {
            startTime: '2999-01-01T10:00:00Z',
            endTime: '2999-01-05T14:00:00Z',
          },
        }),
      ),
    ).toEqual(true);
  });
});

describe('isMeetingSpanningMultipleYears', () => {
  it('should be false if start and end time are at the same year', () => {
    expect(isMeetingSpanningMultipleYears(mockMeeting())).toEqual(false);
  });

  it('should be true if start and end time are at the different years', () => {
    expect(
      isMeetingSpanningMultipleYears(
        mockMeeting({
          content: {
            startTime: '2999-01-01T10:00:00Z',
            endTime: '3000-01-01T14:00:00Z',
          },
        }),
      ),
    ).toEqual(true);
  });
});
