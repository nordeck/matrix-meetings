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
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { act, render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCalendar, mockCreateMeetingRoom } from '../../../lib/testUtils';
import { Meeting } from '../../../reducer/meetingsApi';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { withCurrentRoomMeeting } from './withCurrentRoomMeeting';

const Component = withCurrentRoomMeeting(
  ({ meeting }: { meeting: Meeting }) => (
    <>
      <h1>{meeting.title}</h1>
      <p>Start: {meeting.startTime}</p>
      <p>My Content</p>
    </>
  ),
);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('withCurrentRoomMeeting', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(async () => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      }, []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}> {children}</Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without exploding', async () => {
    mockCreateMeetingRoom(widgetApi, { room_id: '!room-id' });

    render(<Component />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('heading', { name: /an important meeting/i }),
    ).resolves.toBeInTheDocument();
    expect(screen.getByText('My Content')).toBeInTheDocument();
  });

  it('should hide content', async () => {
    render(<Component />, { wrapper: Wrapper });

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('should rerender after a meeting instance ended', async () => {
    mockCreateMeetingRoom(widgetApi, {
      room_id: '!room-id',
      metadata: {
        calendar: mockCalendar({
          dtstart: '20230101T100000',
          dtend: '20230101T140000',
          rrule: 'FREQ=DAILY',
        }),
      },
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T13:59:59Z'));

    render(<Component />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('heading', { name: /an important meeting/i }),
    ).resolves.toBeInTheDocument();

    expect(screen.getByText('Start: 2023-01-01T10:00:00Z')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30 * 1000);
    });

    expect(screen.getByText('Start: 2023-01-02T10:00:00Z')).toBeInTheDocument();
  });
});
