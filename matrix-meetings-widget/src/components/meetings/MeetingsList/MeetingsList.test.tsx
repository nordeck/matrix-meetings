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

import { extractWidgetApiParameters as extractWidgetApiParametersMocked } from '@matrix-widget-toolkit/api';
import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, within } from '@testing-library/react';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import {
  mockCalendar,
  mockCreateBreakoutMeetingRoom,
  mockCreateMeetingRoom,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { MeetingsList } from './MeetingsList';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual('@matrix-widget-toolkit/api')),
  extractWidgetApiParameters: vi.fn(),
}));

const extractWidgetApiParameters = vi.mocked(extractWidgetApiParametersMocked);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingsList/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    extractWidgetApiParameters.mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-1:example.com',
      name: { name: 'Meeting 1' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220101T100000',
          dtend: '20220101T140000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-2:example.com',
      name: { name: 'Meeting 2' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220102T100000',
          dtend: '20220102T140000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-3',
      name: { name: 'Meeting 3' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220111T100000',
          dtend: '20220111T140000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-4:example.com',
      name: { name: 'Meeting 4' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220102T140000',
          dtend: '20220102T150000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-5:example.com',
      name: { name: 'Meeting 5' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220101T100000',
          dtend: '20220101T140000',
        }),
      },
      roomOptions: {
        skipParentEvent: true,
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-6:example.com',
      name: { name: 'Meeting 6' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220101T100000',
          dtend: '20220101T140000',
          rrule: 'FREQ=DAILY;COUNT=1',
        }),
      },
    });

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

  it('should render without exploding', async () => {
    render(
      <MeetingsList
        filters={{
          startDate: '2022-01-01T00:00:00Z',
          endDate: '2022-01-06T23:59:59Z',
        }}
      />,
      { wrapper: Wrapper },
    );

    const region = screen.getByRole('region', { name: /meetings/i });

    expect(
      within(region).getByRole('heading', { level: 3, name: /meetings/i }),
    ).toBeInTheDocument();

    const list = within(region).getByRole('list', { name: /meetings/i });

    const saturdayList = await within(list).findByRole('listitem', {
      name: 'Saturday, 01/01/2022',
    });
    expect(
      within(saturdayList).getByRole('heading', {
        level: 4,
        name: 'Saturday, 01/01/2022',
      }),
    ).toBeInTheDocument();
    const meeting1 = within(saturdayList).getByRole('listitem', {
      name: /meeting 1/i,
      description: '10:00 AM – 2:00 PM',
    });
    expect(
      within(meeting1).getByRole('heading', { level: 5, name: /meeting 1/i }),
    ).toBeInTheDocument();

    expect(
      within(saturdayList).getByRole('listitem', {
        name: /meeting 6/i,
        description: '10:00 AM – 2:00 PM . Recurrence: Every day for one time',
      }),
    ).toBeInTheDocument();

    expect(
      within(list).getByRole('listitem', {
        name: 'Sunday, 01/02/2022',
      }),
    ).toBeInTheDocument();
  });

  it('should render without exploding when displayAllMeetings', async () => {
    render(
      <MeetingsList
        displayAllMeetings
        filters={{
          startDate: '2022-01-01T00:00:00Z',
          endDate: '2022-01-01T23:59:59Z',
        }}
      />,
      { wrapper: Wrapper },
    );

    const region = screen.getByRole('region', { name: /meetings/i });

    expect(
      within(region).getByRole('heading', { level: 3, name: /meetings/i }),
    ).toBeInTheDocument();

    const list = within(region).getByRole('list', { name: /meetings/i });

    const saturdayList = await within(list).findByRole('listitem', {
      name: 'Saturday, 01/01/2022',
    });
    expect(
      within(saturdayList).getByRole('heading', {
        level: 4,
        name: 'Saturday, 01/01/2022',
      }),
    ).toBeInTheDocument();
    const meeting1 = within(saturdayList).getByRole('listitem', {
      name: /meeting 1/i,
      description: '10:00 AM – 2:00 PM',
    });
    expect(
      within(meeting1).getByRole('heading', { level: 5, name: /meeting 1/i }),
    ).toBeInTheDocument();

    const meeting5 = within(saturdayList).getByRole('listitem', {
      name: /meeting 5/i,
      description: '10:00 AM – 2:00 PM',
    });
    expect(
      within(meeting5).getByRole('heading', { level: 5, name: /meeting 5/i }),
    ).toBeInTheDocument();

    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it.each([false, true])(
    'should render without exploding when breakoutSessionMode and displayAllMeetings = %s',
    async (displayAllMeetings) => {
      mockCreateMeetingRoom(widgetApi, { room_id: '!room-id:example.com' });
      mockCreateMeetingRoom(widgetApi, { room_id: '!room-id-2:example.com' });

      mockCreateBreakoutMeetingRoom(widgetApi, {
        meeting_room_id: '!room-id:example.com',
        metadata: {
          calendar: mockCalendar({
            dtstart: '20220101T100000',
            dtend: '20220101T140000',
          }),
        },
      });

      // create breakout for another room
      mockCreateBreakoutMeetingRoom(widgetApi, {
        room_id: '!breakout-room-id-2:example.com',
        meeting_room_id: '!room-id-2:example.com',
        metadata: {
          calendar: mockCalendar({
            dtstart: '20220101T100000',
            dtend: '20220101T140000',
          }),
        },
        name: { name: 'Room 2 breakout meeting' },
      });

      render(
        <MeetingsList
          breakoutSessionMode
          displayAllMeetings={displayAllMeetings}
          filters={{
            startDate: '2022-01-01T00:00:00Z',
            endDate: '2022-01-02T23:59:59Z',
          }}
        />,
        { wrapper: Wrapper },
      );

      const list = screen.getByRole('list', { name: /meetings/i });
      await expect(
        within(list).findByRole('listitem', { name: /an important meeting/i }),
      ).resolves.toBeInTheDocument();

      expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    },
  );

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingsList
        filters={{
          startDate: '2022-01-01T00:00:00Z',
          endDate: '2022-01-06T23:59:59Z',
        }}
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('listitem', { name: 'Saturday, 01/01/2022' }),
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if empty state', async () => {
    widgetApi.clearStateEvents();

    const { container } = render(
      <MeetingsList
        filters={{
          startDate: '2022-01-01T00:00:00Z',
          endDate: '2022-01-06T23:59:59Z',
        }}
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('listitem', { name: /no meetings scheduled/i }),
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should filter list by date range', async () => {
    render(
      <MeetingsList
        filters={{
          startDate: '2022-01-11T00:00:00Z',
          endDate: '2022-01-12T23:59:59Z',
        }}
      />,
      { wrapper: Wrapper },
    );

    const list = screen.getByRole('list', { name: /meetings/i });

    await expect(
      within(list).findByRole('listitem', {
        name: 'Tuesday, 01/11/2022',
      }),
    ).resolves.toBeInTheDocument();

    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('should show empty list for the meetings list', async () => {
    widgetApi.clearStateEvents();

    render(
      <MeetingsList
        filters={{
          startDate: '2022-01-11T00:00:00Z',
          endDate: '2022-01-12T23:59:59Z',
        }}
      />,
      { wrapper: Wrapper },
    );

    const list = screen.getByRole('list', { name: /meetings/i });

    expect(
      within(list).getByRole('listitem', {
        name: /no meetings scheduled that match the selected filters/i,
      }),
    ).toBeInTheDocument();
  });

  it('should show empty list for the breakout sessions list', async () => {
    widgetApi.clearStateEvents();

    render(
      <MeetingsList
        breakoutSessionMode
        filters={{
          startDate: '2022-01-11T00:00:00Z',
          endDate: '2022-01-12T23:59:59Z',
        }}
      />,
      { wrapper: Wrapper },
    );

    const list = screen.getByRole('list', { name: /meetings/i });

    expect(
      within(list).getByRole('listitem', {
        name: /no breakout sessions scheduled that match the selected filters/i,
      }),
    ).toBeInTheDocument();
  });

  it('shows a warning if there are open invitations', () => {
    render(
      <MeetingsList
        filters={{
          startDate: '2022-01-01T00:00:00Z',
          endDate: '2022-01-06T23:59:59Z',
        }}
        hasInvitations
      />,
      { wrapper: Wrapper },
    );

    const alert = screen.getByRole('status');
    expect(
      within(alert).getByText(/you have open invitations/i),
    ).toBeInTheDocument();
    expect(alert).toHaveTextContent(/please join all meeting rooms/i);
  });
});
