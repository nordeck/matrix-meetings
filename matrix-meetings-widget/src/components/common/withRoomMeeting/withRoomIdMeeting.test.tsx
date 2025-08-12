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

import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import {
  mockCalendar,
  mockCreateMeetingRoom,
  mockMeeting,
} from '../../../lib/testUtils';
import { Meeting } from '../../../reducer/meetingsApi';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { withRoomIdMeeting } from './withRoomIdMeeting';

const Component = withRoomIdMeeting(({ meeting }: { meeting: Meeting }) => (
  <>
    <h1>{meeting.title}</h1>
    <p>Start: {meeting.startTime}</p>
    <p>End: {meeting.endTime}</p>
    <p>My Content</p>
  </>
));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('withRoomIdMeeting', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(async () => {
    mockCreateMeetingRoom(widgetApi);

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      }, []);
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should render without exploding', async () => {
    render(
      <Component
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('heading', { name: /an important meeting/i }),
    ).resolves.toBeInTheDocument();

    expect(screen.getByText('Start: 2999-01-01T10:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('End: 2999-01-01T14:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('My Content')).toBeInTheDocument();
  });

  it('should return the meeting of the recurrence-id', async () => {
    mockCreateMeetingRoom(widgetApi, {
      metadata: {
        calendar: mockCalendar({
          dtstart: '29990101T100000',
          dtend: '29990101T140000',
          rrule: 'FREQ=DAILY',
        }),
      },
    });

    render(
      <Component
        recurrenceId="2999-01-10T10:00:00Z"
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('heading', { name: /an important meeting/i }),
    ).resolves.toBeInTheDocument();

    expect(screen.getByText('Start: 2999-01-10T10:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('End: 2999-01-10T14:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('My Content')).toBeInTheDocument();
  });

  it('should return provided meeting in tests', () => {
    render(<Component meeting={mockMeeting()} />, { wrapper: Wrapper });

    expect(
      screen.getByRole('heading', { name: /an important meeting/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('My Content')).toBeInTheDocument();
  });

  it('should hide content', () => {
    render(
      <Component
        recurrenceId={undefined}
        roomId="!another-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('should handle undefined roomId', () => {
    render(
      <Component recurrenceId={undefined} roomId={undefined} uid={undefined} />,
      { wrapper: Wrapper },
    );

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
});
