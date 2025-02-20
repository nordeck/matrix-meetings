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

import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { expect } from 'vitest';
import { axe } from 'vitest-axe';
import { MockedWidgetApi, mockWidgetApi } from '../../../lib/mockWidgetApi';
import {
  mockCalendarEntry,
  mockMeeting,
  mockRoomMember,
} from '../../../lib/testUtils';
import { Meeting } from '../../../reducer/meetingsApi';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { MeetingsCalendarEvent } from './MeetingsCalendarEvent';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingsCalendarEvent/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  const meetingFromBob: Meeting = mockMeeting({
    content: {
      creator: '@user-id-2',
      participants: [
        {
          userId: '@user-id-2',
          displayName: 'Bob',
          membership: 'join',
          rawEvent: mockRoomMember({
            state_key: '@user-id-2',
          }),
        },
      ],
    },
  });

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should render for day or week when user is creator', () => {
    render(
      <MeetingsCalendarEvent
        buttonLabelId="button-label-id"
        meeting={mockMeeting()}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('An important meeting')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('should render for month when user is creator', () => {
    render(
      <MeetingsCalendarEvent
        buttonLabelId="button-label-id"
        meeting={mockMeeting()}
        view="month"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('An important meeting')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('should render for day or week when user is not creator', () => {
    render(
      <MeetingsCalendarEvent
        buttonLabelId="button-label-id"
        meeting={meetingFromBob}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('An important meeting')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should render for month when user is not creator', () => {
    render(
      <MeetingsCalendarEvent
        buttonLabelId="button-label-id"
        meeting={meetingFromBob}
        view="month"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('An important meeting')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('should have no accessibility violations for day or week view', async () => {
    const { container } = render(
      <MeetingsCalendarEvent
        buttonLabelId="button-label-id"
        meeting={mockMeeting()}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('An important meeting')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations for month view', async () => {
    const { container } = render(
      <MeetingsCalendarEvent
        buttonLabelId="button-label-id"
        meeting={mockMeeting()}
        view="month"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('An important meeting')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('should provide a label text for the event button', () => {
    render(
      <button aria-labelledby="button-label-id">
        <MeetingsCalendarEvent
          buttonLabelId="button-label-id"
          meeting={mockMeeting()}
          view="month"
        />
      </button>,
      { wrapper: Wrapper },
    );

    expect(screen.getByRole('button')).toHaveAccessibleName(
      /January 1, 2999(,| at) 10:00 AM–2:00 PM: “An important meeting” by Alice/,
    );
  });

  it('should provide a label text for the event button (for a multi-day meeting)', async () => {
    render(
      <button aria-labelledby="button-label-id">
        <MeetingsCalendarEvent
          buttonLabelId="button-label-id"
          meeting={mockMeeting({
            content: {
              endTime: '2999-01-02T14:00:00Z',
            },
          })}
          view="month"
        />
      </button>,
      { wrapper: Wrapper },
    );

    expect(screen.getByRole('button')).toHaveAccessibleName(
      /January 1, 2999(,| at) 10:00 AM–January 2, 2999(,| at) 2:00 PM: “An important meeting” by Alice/,
    );
  });

  it('should display recurring meeting', () => {
    render(
      <button aria-labelledby="button-label-id">
        <MeetingsCalendarEvent
          buttonLabelId="button-label-id"
          meeting={mockMeeting({
            content: {
              calendarEntries: [
                mockCalendarEntry({
                  dtstart: '29990101T100000',
                  dtend: '29990101T140000',
                  rrule: 'FREQ=DAILY',
                }),
              ],
            },
          })}
          view="month"
        />
      </button>,
      { wrapper: Wrapper },
    );

    expect(screen.getByTestId('EventRepeatIcon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAccessibleName(
      /January 1, 2999(,| at) 10:00 AM–2:00 PM: “An important meeting” by Alice, recurring meeting/,
    );
  });
});
