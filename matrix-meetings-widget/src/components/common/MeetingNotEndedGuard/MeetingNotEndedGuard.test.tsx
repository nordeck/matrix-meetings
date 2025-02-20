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

import { act, render, screen, within } from '@testing-library/react';
import { expect, vi } from 'vitest';
import { mockCalendarEntry, mockMeeting } from '../../../lib/testUtils';
import { MeetingNotEndedGuard } from './MeetingNotEndedGuard';

afterEach(() => vi.useRealTimers());

describe('<MeetingNotEndedGuard/>', () => {
  it('should render without exploding', () => {
    render(
      <MeetingNotEndedGuard meeting={mockMeeting()} withMessage>
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    expect(screen.getByText(/My Content/)).toBeInTheDocument();
  });

  it('should show content if meeting has future recurrences', () => {
    render(
      <MeetingNotEndedGuard
        meeting={mockMeeting({
          content: {
            startTime: '2000-01-01T01:00:00Z',
            endTime: '2000-01-01T02:00:00Z',
            recurrenceId: undefined,
            calendarEntries: [
              mockCalendarEntry({
                dtstart: '20000101T010000',
                dtend: '20000101T030000',
                rrule: 'FREQ=DAILY;UNTIL=20401001T125500Z',
              }),
            ],
          },
        })}
        withMessage
      >
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    expect(screen.getByText(/My Content/)).toBeInTheDocument();
  });

  it('should show content if meeting is endlessly recurring', () => {
    render(
      <MeetingNotEndedGuard
        meeting={mockMeeting({
          content: {
            startTime: '2000-01-02T01:00:00Z',
            endTime: '2000-01-02T02:00:00Z',
            recurrenceId: undefined,
            calendarEntries: [
              mockCalendarEntry({
                dtstart: '20000101T010000',
                dtend: '20000101T030000',
                rrule: 'FREQ=DAILY',
              }),
            ],
          },
        })}
        withMessage
      >
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    expect(screen.getByText(/My Content/)).toBeInTheDocument();
  });

  it('should show content if no meeting is provided', () => {
    render(
      <MeetingNotEndedGuard meeting={undefined} withMessage>
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    expect(screen.getByText(/My Content/)).toBeInTheDocument();
  });

  it('should show message if meeting has ended', () => {
    render(
      <MeetingNotEndedGuard
        meeting={mockMeeting({ content: { endTime: '2000-01-01T00:00:00Z' } })}
        withMessage
      >
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      /The meeting is already over/,
    );
  });

  it('should show message if recurring meeting has ended', () => {
    render(
      <MeetingNotEndedGuard
        meeting={mockMeeting({
          content: {
            startTime: '2000-01-02T01:00:00Z',
            endTime: '2000-01-02T02:00:00Z',
            recurrenceId: undefined,
            calendarEntries: [
              mockCalendarEntry({
                dtstart: '20000101T010000',
                dtend: '20000101T030000',
                rrule: 'FREQ=DAILY;COUNT=2',
              }),
            ],
          },
        })}
        withMessage
      >
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      /The meeting is already over/,
    );
  });

  it('should show message if breakout session has ended', () => {
    render(
      <MeetingNotEndedGuard
        meeting={mockMeeting({
          content: {
            type: 'net.nordeck.meetings.breakoutsession',
            endTime: '2000-01-01T00:00:00Z',
          },
        })}
        withMessage
      >
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    const alert = screen.getByRole('status');
    expect(
      within(alert).getByText(/The breakout session is already over/),
    ).toBeInTheDocument();
  });

  it('should show custom string message if meeting has ended', () => {
    render(
      <MeetingNotEndedGuard
        meeting={mockMeeting({ content: { endTime: '2000-01-01T00:00:00Z' } })}
        withMessage="My Custom Message"
      >
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    const alert = screen.getByRole('status');
    expect(within(alert).getByText(/My Custom Message/)).toBeInTheDocument();
  });

  it('should show custom node message if meeting has ended', () => {
    render(
      <MeetingNotEndedGuard
        meeting={mockMeeting({ content: { endTime: '2000-01-01T00:00:00Z' } })}
        withMessage={<button>My Button</button>}
      >
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    const alert = screen.getByRole('status');
    expect(
      within(alert).getByRole('button', { name: /My Button/ }),
    ).toBeInTheDocument();
  });

  it('should show nothing if meeting has ended', () => {
    const { container } = render(
      <MeetingNotEndedGuard
        meeting={mockMeeting({ content: { endTime: '2000-01-01T00:00:00Z' } })}
      >
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should update rendering if timer elapses', () => {
    vi.useFakeTimers();

    // set clock to before the meeting ended
    vi.setSystemTime(new Date('2000-01-01T10:00:00Z'));

    const futureTime = new Date();
    futureTime.setSeconds(futureTime.getSeconds() + 1);

    render(
      <MeetingNotEndedGuard
        meeting={mockMeeting({ content: { endTime: '2000-01-01T10:00:10Z' } })}
        withMessage
      >
        <p>My Content</p>
      </MeetingNotEndedGuard>,
    );

    expect(screen.getByText(/My Content/)).toBeInTheDocument();

    // set clock to after the meeting ended
    vi.setSystemTime(new Date('2000-01-01T10:00:11Z'));

    // should not yet trigger the update
    act(() => {
      vi.advanceTimersByTime(9_000);
    });

    expect(screen.getByText(/My Content/)).toBeInTheDocument();

    // should trigger the update
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
