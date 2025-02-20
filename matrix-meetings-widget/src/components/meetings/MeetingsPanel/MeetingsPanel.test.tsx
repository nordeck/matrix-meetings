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
import { useMediaQuery } from '@mui/material';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MockedWidgetApi, mockWidgetApi } from '../../../lib/mockWidgetApi';
import {
  acknowledgeAllEvents,
  mockCalendar,
  mockCreateBreakoutMeetingRoom,
  mockCreateMeetingInvitation,
  mockCreateMeetingRoom,
  mockMeeting,
  mockPowerLevelsEvent,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { SetupBreakoutSessionsModalResult } from '../SetupBreakoutSessionsModal';
import { MeetingsPanel } from './MeetingsPanel';

// The DOM is quite complex and big, therefore we have to increase the timeout
vi.setConfig({ testTimeout: 15000 });

vi.mock('@mui/material', async (importOriginal) => ({
  ...(await importOriginal()),
  useMediaQuery: vi.fn(),
}));

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual('@matrix-widget-toolkit/api')),
  extractWidgetApiParameters: vi.fn(),
}));

function enableBreakoutSessionView() {
  mockCreateMeetingRoom(widgetApi, {
    room_id: '!room-id',
    metadata: {
      calendar: mockCalendar({
        dtstart: '20220301T100000',
        dtend: '20220301T140000',
      }),
    },
  });
  mockCreateBreakoutMeetingRoom(widgetApi, {
    meeting_room_id: '!room-id',
    name: { name: 'My Breakout Session' },
    metadata: {
      calendar: mockCalendar({
        dtstart: '20220301T113000',
        dtend: '20220301T123000',
      }),
    },
  });
}

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

afterEach(() => vi.useRealTimers());

describe('<MeetingsPanel/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useMediaQuery).mockReturnValue(true);

    vi.mocked(extractWidgetApiParametersMocked).mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    vi.spyOn(Date, 'now').mockImplementation(
      () => +new Date('2022-03-01T10:10:12.345Z'),
    );

    mockCreateMeetingRoom(widgetApi, {
      parentRoomId: '!room-id',
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220301T100000',
          dtend: '20220301T140000',
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
        <LocalizationProvider>
          <WidgetApiMockProvider value={widgetApi}>
            <Provider store={store}>{children}</Provider>
          </WidgetApiMockProvider>
        </LocalizationProvider>
      );
    };

    // We mock the offsetHeight as js-dom is not providing layout causing
    // fullcalendar not being able to calculate the size of the events and
    // hiding them instead.
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
      () => 10,
    );

    // We also mock getBoundingClientRect to support the more link
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 1,
      height: 1,
      left: 1,
      right: 1,
      top: 1,
      width: 1,
      x: 1,
      y: 1,
      toJSON: vi.fn(),
    });
  });

  it('should render the breakout session view without exploding', async () => {
    enableBreakoutSessionView();

    render(<MeetingsPanel />, { wrapper: Wrapper });

    const filters = screen.getByRole('navigation', { name: 'Filters' });
    expect(
      within(filters).getByRole('heading', { level: 3, name: 'Filters' }),
    ).toBeInTheDocument();
    expect(
      within(filters).getByRole('textbox', { name: 'Search' }),
    ).toBeInTheDocument();

    expect(
      within(filters).getByRole('button', {
        name: 'Choose date range, selected range is March 1 – 7, 2022',
      }),
    ).toHaveTextContent('Mar 1 – 7, 2022');
    expect(
      within(filters).getByRole('textbox', { name: 'Search' }),
    ).toBeInTheDocument();

    const list = screen.getByRole('list', { name: 'Meetings' });
    expect(
      screen.getByRole('heading', { level: 3, name: 'Meetings' }),
    ).toBeInTheDocument();
    await expect(
      within(list).findByRole('listitem', { name: 'My Breakout Session' }),
    ).resolves.toBeInTheDocument();

    const actions = screen.getByRole('navigation', { name: 'Actions' });
    expect(
      within(actions).getByRole('heading', { level: 3, name: 'Actions' }),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole('button', {
        name: 'Schedule Breakout Session',
      }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations, if breakout session mode', async () => {
    enableBreakoutSessionView();

    const { container } = render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /my breakout session/i }),
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if list view', async () => {
    const { container } = render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /an important meeting/i }),
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if list view with invitations', async () => {
    mockCreateMeetingInvitation(widgetApi, {
      room_id: '!invitation-meeting-room-id',
    });

    const { container } = render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('button', { name: /invitations/i }),
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if day view', async () => {
    const { container } = render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Day' }));

    expect(await screen.findByText('An important meeting')).toBeInTheDocument();

    // disabled aria-required-children because structure of roles is not correct
    // in fullcalendar
    expect(
      await axe(container, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });

  it('should have no accessibility violations, if work week view', async () => {
    const { container } = render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Work Week' }));

    expect(await screen.findByText('An important meeting')).toBeInTheDocument();

    // disabled aria-required-children because structure of roles is not correct
    // in fullcalendar
    expect(
      await axe(container, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });

  it('should have no accessibility violations, if week view', async () => {
    const { container } = render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Week' }));

    expect(await screen.findByText('An important meeting')).toBeInTheDocument();

    // disabled aria-required-children because structure of roles is not correct
    // in fullcalendar
    expect(
      await axe(container, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });

  it('should have no accessibility violations, if month view', async () => {
    const { container } = render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Month' }));

    expect(await screen.findByText('An important meeting')).toBeInTheDocument();

    // disabled aria-required-children because structure of roles is not correct
    // in fullcalendar
    expect(
      await axe(container, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });

  it('should render the meetings list view with all toolbar elements', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    expect(
      screen.getByRole('button', { name: 'Schedule Meeting' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Previous period' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Next period' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Choose date range, selected range is March 1 – 7, 2022',
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Search')).toBeInTheDocument();

    expect(screen.getByRole('combobox', { name: 'View' })).toHaveTextContent(
      'List',
    );

    expect(
      await screen.findByRole('listitem', { name: /an important meeting/i }),
    ).toBeInTheDocument();
  });

  it('should render the day view', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Day' }));

    expect(screen.getAllByRole('gridcell')).toHaveLength(1);
    expect(await screen.findByText('An important meeting')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Choose date, selected date is March 1, 2022',
      }),
    ).toHaveTextContent('Mar 1, 2022');
  });

  it('should save month view in localStorage', async () => {
    const localStorageKey = 'meeting_view_!room-id_@user-id';

    render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Month' }));

    expect(screen.getByRole('combobox', { name: 'View' })).toHaveTextContent(
      'Month',
    );

    expect(localStorage.getItem(localStorageKey)).toMatch('month');
  });

  it('should read month view from localStorage', async () => {
    const localStorageKey = 'meeting_view_!room-id_@user-id';
    localStorage.setItem(localStorageKey, 'month');

    render(<MeetingsPanel />, { wrapper: Wrapper });

    expect(screen.getByRole('combobox', { name: 'View' })).toHaveTextContent(
      'Month',
    );
  });

  it('should fallback to list view when reading invalid value from localStorage', async () => {
    const localStorageKey = 'meeting_view_!room-id_@user-id';
    localStorage.setItem(localStorageKey, 'year');

    render(<MeetingsPanel />, { wrapper: Wrapper });

    expect(screen.getByRole('combobox', { name: 'View' })).toHaveTextContent(
      'List',
    );
  });

  it('should render the work week view', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Work Week' }));

    expect(screen.getAllByRole('gridcell')).toHaveLength(5);
    expect(await screen.findByText('An important meeting')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Choose work week, selected work week is February 28 – March 4, 2022',
      }),
    ).toHaveTextContent('Feb 28 – Mar 4, 2022');
  });

  it('should render the week view', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Week' }));

    expect(screen.getAllByRole('gridcell')).toHaveLength(7);
    expect(await screen.findByText('An important meeting')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Choose week, selected week is February 27 – March 5, 2022',
      }),
    ).toHaveTextContent('Feb 27 – Mar 5, 2022');
  });

  it('should render the month view', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Month' }));

    expect(screen.getAllByRole('gridcell')).toHaveLength(5 * 7);
    expect(await screen.findByText('An important meeting')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Choose month, selected month is March 2022',
      }),
    ).toHaveTextContent('March 2022');
  });

  it('should switch to day view if clicking on the more button in month view', async () => {
    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-1',
      name: { name: 'Meeting 1' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220301T110000',
          dtend: '20220301T120000',
        }),
      },
    });
    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-2',
      name: { name: 'Meeting 2' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220301T130000',
          dtend: '20220301T140000',
        }),
      },
    });
    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-3',
      name: { name: 'Meeting 3' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20220301T140000',
          dtend: '20220301T150000',
        }),
      },
    });

    render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Month' }));

    expect(screen.getAllByRole('gridcell')).toHaveLength(5 * 7);
    expect(await screen.findByText('An important meeting')).toBeInTheDocument();
    expect(screen.getByText('Meeting 1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '+2 more' }));

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell')).toHaveLength(1);
    });

    expect(screen.getByText('An important meeting')).toBeInTheDocument();
    expect(screen.getByText('Meeting 1')).toBeInTheDocument();
    expect(screen.getByText('Meeting 2')).toBeInTheDocument();
    expect(screen.getByText('Meeting 3')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Choose date, selected date is March 1, 2022',
      }),
    ).toBeInTheDocument();
  });

  it('should keep the month when switching from month to week to month, if the first week of the month starts in the previous month', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Month' }));

    expect(
      screen.getByRole('button', {
        name: 'Choose month, selected month is March 2022',
      }),
    ).toHaveTextContent('March 2022');

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Week' }));

    expect(
      screen.getByRole('button', {
        name: 'Choose week, selected week is March 6 – 12, 2022',
      }),
    ).toHaveTextContent('Mar 6 – 12, 2022');

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Month' }));

    expect(
      screen.getByRole('button', {
        name: 'Choose month, selected month is March 2022',
      }),
    ).toHaveTextContent('March 2022');
  });

  it('should render invitations list', async () => {
    mockCreateMeetingInvitation(widgetApi, {
      room_id: '!invitation-meeting-room-id',
    });

    render(<MeetingsPanel />, { wrapper: Wrapper });

    const navGroup = await screen.findByRole('group', { name: /views/i });
    expect(
      within(navGroup).getByRole('button', {
        name: /meetings/i,
        expanded: true,
      }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(navGroup).getByRole('button', {
        name: /invitations/i,
        expanded: false,
      }),
    );

    expect(
      screen.getByRole('heading', { level: 3, name: /invitations/i }),
    ).toBeInTheDocument();

    const list = screen.getByRole('list', { name: /invitations/i });
    expect(
      within(list).getByRole('listitem', { name: /an important meeting/i }),
    ).toBeInTheDocument();
  });

  it('should show empty states in meeting and in breakout mode', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    const list = screen.getByRole('list', { name: /meetings/i });
    expect(
      within(list).getByRole('listitem', { name: /no meetings scheduled/i }),
    ).toBeInTheDocument();

    // change to be a meeting room
    mockCreateMeetingRoom(widgetApi, { room_id: '!room-id' });

    await expect(
      within(list).findByRole('listitem', {
        name: /no breakout sessions scheduled/i,
      }),
    ).resolves.toBeInTheDocument();
  });

  it('should filter the meetings via date change', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /an important meeting/i }),
    ).resolves.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: /Choose date range, selected range is March 1 – 7, 2022/i,
      }),
    );

    await userEvent.click(screen.getByRole('gridcell', { name: '7' }));
    await userEvent.click(screen.getByRole('gridcell', { name: '13' }));

    expect(
      screen.getByRole('button', {
        name: /Choose date range, selected range is March 7 – 13, 2022/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('listitem', { name: /no meetings scheduled/i }),
    ).toBeInTheDocument();
  });

  it('should filter the meetings for day view via date change', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /an important meeting/i }),
    ).resolves.toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Day' }));

    expect(screen.getAllByRole('gridcell')).toHaveLength(1);
    const meeting = await screen.findByText('An important meeting');
    expect(meeting).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: /Choose date, selected date is March 1, 2022/i,
      }),
    );

    await userEvent.click(screen.getByRole('gridcell', { name: '7' }));

    expect(meeting).not.toBeInTheDocument();
  });

  it('should filter the meetings in breakout session mode via date change', async () => {
    enableBreakoutSessionView();

    render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /my breakout session/i }),
    ).resolves.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: /Choose date range, selected range is March 1 – 7, 2022/i,
      }),
    );

    await userEvent.click(screen.getByRole('gridcell', { name: '7' }));
    await userEvent.click(screen.getByRole('gridcell', { name: '13' }));

    expect(
      screen.getByRole('button', {
        name: /Choose date range, selected range is March 7 – 13, 2022/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('listitem', {
        name: /No breakout sessions scheduled that match the selected filters./i,
      }),
    ).toBeInTheDocument();
  });

  it('should filter the meetings list via search', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /an important meeting/i }),
    ).resolves.toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search' }),
      'something',
    );

    expect(
      screen.getByRole('listitem', { name: /no meetings scheduled/i }),
    ).toBeInTheDocument();
  });

  it('should filter the meetings for day view via search', async () => {
    render(<MeetingsPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Day' }));

    expect(screen.getAllByRole('gridcell')).toHaveLength(1);
    const meeting = await screen.findByText('An important meeting');

    await userEvent.type(
      screen.getByRole('textbox', { name: /search/i }),
      'something',
    );

    expect(meeting).not.toBeInTheDocument();
  });

  it('should filter the meetings in breakout session mode via search', async () => {
    enableBreakoutSessionView();

    render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /my breakout session/i }),
    ).resolves.toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search' }),
      'something',
    );

    expect(
      screen.getByRole('listitem', {
        name: /No breakout sessions scheduled that match the selected filters./i,
      }),
    ).toBeInTheDocument();
  });

  it('should create new breakout session', async () => {
    mockCreateMeetingRoom(widgetApi, { room_id: '!room-id' });

    render(<MeetingsPanel />, { wrapper: Wrapper });

    const nav = await screen.findByRole('navigation', { name: /actions/i });

    await userEvent.click(
      await within(nav).findByRole('button', {
        name: /schedule breakout session/i,
      }),
    );

    expect(widgetApi.openModal).toBeCalledWith(
      '/setup-breakout-sessions',
      'Schedule Breakout Session',
      {
        buttons: [
          {
            disabled: true,
            id: 'nic.schedule.breakoutsessions.submit',
            kind: 'm.primary',
            label: 'Create Breakout Session',
          },
          {
            id: 'nic.schedule.breakoutsessions.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
        data: {
          parentMeeting: mockMeeting({
            room_id: '!room-id',
            parentRoomId: '!room-id',
          }),
        },
      },
    );

    expect(widgetApi.sendRoomEvent).not.toBeCalled();
  });

  it('should skip the breakout session creation if the user aborts the action', async () => {
    widgetApi.openModal.mockResolvedValue({
      type: 'nic.schedule.breakoutsessions.submit',
      breakoutSessions: {
        groups: [{ title: 'First', participants: ['@user-id'] }],
        description: 'A short description',
        startTime: '2999-01-01T11:00:00Z',
        endTime: '2999-01-01T11:30:00Z',
        widgetIds: [],
      },
    } as SetupBreakoutSessionsModalResult);

    mockCreateMeetingRoom(widgetApi, { room_id: '!room-id' });

    render(<MeetingsPanel />, { wrapper: Wrapper });

    const nav = await screen.findByRole('navigation', { name: /actions/i });

    await userEvent.click(
      within(nav).getByRole('button', {
        name: /schedule breakout session/i,
      }),
    );

    expect(widgetApi.openModal).toBeCalledWith(
      '/setup-breakout-sessions',
      'Schedule Breakout Session',
      {
        buttons: [
          {
            disabled: true,
            id: 'nic.schedule.breakoutsessions.submit',
            kind: 'm.primary',
            label: 'Create Breakout Session',
          },
          {
            id: 'nic.schedule.breakoutsessions.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
        data: {
          parentMeeting: mockMeeting({
            room_id: '!room-id',
            parentRoomId: '!room-id',
          }),
        },
      },
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.breakoutsessions.create',
        {
          context: expect.anything(),
          data: {
            groups: [
              { title: 'First', participants: [{ user_id: '@user-id' }] },
            ],
            description: 'A short description',
            start_time: '2999-01-01T11:00:00Z',
            end_time: '2999-01-01T11:30:00Z',
            widget_ids: [],
          },
        },
      );
    });
  });

  it('should send message to all breakout rooms', async () => {
    enableBreakoutSessionView();

    widgetApi
      .observeRoomEvents('net.nordeck.meetings.sub_meetings.send_message')
      .subscribe(acknowledgeAllEvents(widgetApi));

    render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /my breakout session/i }),
    ).resolves.toBeInTheDocument();

    const actions = screen.getByRole('navigation', { name: /actions/i });
    const textbox = within(actions).getByRole('textbox', {
      name: /send message to all breakout session rooms/i,
    });
    await userEvent.type(textbox, 'Hello{enter}');

    await waitFor(() => {
      expect(textbox).toHaveValue('');
    });
    expect(widgetApi.sendRoomEvent).toBeCalled();
  });

  it('should show breakout session message form even if the user has no permission to create breakout sessions', async () => {
    enableBreakoutSessionView();

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!room-id',
        content: {
          events: { 'net.nordeck.meetings.breakoutsessions.create': 101 },
        },
      }),
    );

    render(<MeetingsPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /my breakout session/i }),
    ).resolves.toBeInTheDocument();

    const actions = screen.getByRole('navigation', { name: /actions/i });
    expect(
      within(actions).getByRole('textbox', {
        name: /send message to all breakout session rooms/i,
      }),
    ).toBeInTheDocument();
  });

  it('should not show breakout session message form if the user has no permission to send message to all rooms', async () => {
    enableBreakoutSessionView();

    render(<MeetingsPanel />, { wrapper: Wrapper });

    const actions = await screen.findByRole('navigation', { name: /actions/i });
    expect(
      within(actions).getByRole('button', {
        name: /schedule breakout session/i,
      }),
    ).toBeInTheDocument();
    const messageForm = within(actions).queryByRole('textbox', {
      name: /send message to all breakout session rooms/i,
    });

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!room-id',
        content: {
          events: { 'net.nordeck.meetings.sub_meetings.send_message': 101 },
        },
      }),
    );

    await waitFor(() => {
      expect(messageForm).not.toBeInTheDocument();
    });
  });

  it('should hide the actions navigation section if the user has no permission to create breakout sessions', async () => {
    mockCreateMeetingRoom(widgetApi, { room_id: '!room-id' });

    render(<MeetingsPanel />, { wrapper: Wrapper });

    const actions = await screen.findByRole('navigation', { name: /actions/i });
    expect(
      within(actions).getByRole('button', {
        name: /schedule breakout session/i,
      }),
    ).toBeInTheDocument();

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!room-id',
        content: {
          events: { 'net.nordeck.meetings.breakoutsessions.create': 101 },
        },
      }),
    );

    await waitFor(() => {
      expect(actions).not.toBeInTheDocument();
    });
  });
});
