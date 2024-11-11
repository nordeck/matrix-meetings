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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  acknowledgeAllEvents,
  mockCalendar,
  mockConfigEndpoint,
  mockCreateMeetingRoom,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
  mockNordeckMeetingMetadataEvent,
  mockPowerLevelsEvent,
  mockRoomMember,
  mockWidgetEndpoint,
  mockWidgetEvent,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import {
  CreateMeeting,
  ScheduleMeetingModalResult,
} from '../ScheduleMeetingModal/types';
import { MeetingCard } from './MeetingCard';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual<typeof import('@matrix-widget-toolkit/api')>(
    '@matrix-widget-toolkit/api',
  )),
  extractWidgetApiParameters: vi.fn(),
}));

const extractWidgetApiParameters = vi.mocked(extractWidgetApiParametersMocked);

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingCard/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();

    mockWidgetEndpoint(server);
    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);

    extractWidgetApiParameters.mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    mockCreateMeetingRoom(widgetApi);

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });

      return (
        <LocalizationProvider>
          <Provider store={store}>
            <WidgetApiMockProvider value={widgetApi}>
              {children}
            </WidgetApiMockProvider>
          </Provider>
        </LocalizationProvider>
      );
    };
  });

  afterEach(() => {
    // Restore the spy on Date.now()
    vi.restoreAllMocks();
  });

  it('should render without exploding', async () => {
    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('heading', { level: 5, name: /An important meeting/i }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText(/^Jan 1, 2999(,| at) 10:00 AM – 2:00 PM$/),
    ).toBeInTheDocument();
    expect(screen.getByText('A brief description')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /more settings/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /show participants/i,
        expanded: false,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /share meeting/i, expanded: false }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        showOpenMeetingRoomButton
        titleId="title-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(screen.findByRole('heading')).resolves.toBeInTheDocument();

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, when the recurrence icon is displayed', async () => {
    mockCreateMeetingRoom(widgetApi, {
      metadata: {
        calendar: mockCalendar({
          dtstart: '29990101T100000',
          dtend: '29990101T140000',
          rrule: 'FREQ=DAILY',
        }),
      },
    });

    const { container } = render(
      <MeetingCard
        recurrenceId="2999-01-01T10:00:00Z"
        roomId="!meeting-room-id"
        showOpenMeetingRoomButton
        titleId="title-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(screen.findByText(/Recurrence:/)).resolves.toBeInTheDocument();

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should have accessible description', async () => {
    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        showOpenMeetingRoomButton
        titleId="title-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('button', { name: /open the meeting room/i }),
    ).resolves.toHaveAccessibleDescription(/an important meeting/i);
    expect(
      screen.getByRole('button', { name: /more settings/i }),
    ).toHaveAccessibleDescription(/an important meeting/i);

    expect(
      screen.getByRole('button', { name: /show participants/i }),
    ).toHaveAccessibleDescription(/an important meeting/i);
    expect(
      screen.getByRole('button', { name: /share meeting/i }),
    ).toHaveAccessibleDescription(/an important meeting/i);
  });

  it('should show short day format', async () => {
    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        shortDateFormat
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByText('10:00 AM – 2:00 PM'),
    ).resolves.toBeInTheDocument();
  });

  it('should show that a meeting spans multiple days', async () => {
    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: mockCalendar({
            dtstart: '20200101T100000',
            dtend: '20200102T140000',
          }),
        },
      }),
    );

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByText(/^Jan 1, 2020(,| at) 10:00 AM – Jan 2, 2:00 PM$/),
    ).resolves.toBeInTheDocument();
  });

  it('should show that a meeting spans multiple days with short date format', async () => {
    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: mockCalendar({
            dtstart: '20200101T100000',
            dtend: '20200102T140000',
          }),
        },
      }),
    );

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        shortDateFormat
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByText('10:00 AM – Jan 2, 2:00 PM'),
    ).resolves.toBeInTheDocument();
  });

  it('should show that a meeting spans multiple years', async () => {
    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: mockCalendar({
            dtstart: '20200101T100000',
            dtend: '20210101T140000',
          }),
        },
      }),
    );

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByText(
        /^Jan 1, 2020(,| at) 10:00 AM – Jan 1, 2021(,| at) 2:00 PM$/,
      ),
    ).resolves.toBeInTheDocument();
  });

  it('should show that a meeting spans multiple years with short day format', async () => {
    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: mockCalendar({
            dtstart: '20200101T100000',
            dtend: '20210101T140000',
          }),
        },
      }),
    );

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        shortDateFormat
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByText(/^10:00 AM – Jan 1, 2021(,| at) 2:00 PM$/),
    ).resolves.toBeInTheDocument();
  });

  it('should show the open meeting room button', async () => {
    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        showOpenMeetingRoomButton
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('button', { name: /open the meeting room/i }),
    ).resolves.toBeInTheDocument();
  });

  it('should delete the meeting', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi));

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /delete meeting/i }),
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /delete meeting/i,
    });

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.close',
        {
          context: { locale: 'en', timezone: 'UTC' },
          data: { target_room_id: '!meeting-room-id' },
        },
      );
    });

    await waitFor(() => {
      expect(deleteModal).not.toBeInTheDocument();
    });
  });

  it('should edit meeting', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi));
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.participants.handle')
      .subscribe(acknowledgeAllEvents(widgetApi));
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.widgets.handle')
      .subscribe(acknowledgeAllEvents(widgetApi));

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id-2',
        content: { displayname: 'Bob', membership: 'invite' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockWidgetEvent({
        room_id: '!meeting-room-id',
        state_key: 'widget-1',
      }),
    );
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!meeting-room-id',
        content: { events_default: 0 },
      }),
    );

    const newMeeting: CreateMeeting = {
      title: 'My new Meeting',
      description: 'My New Description',
      startTime: '2099-01-01T10:00:00Z',
      endTime: '2099-01-01T14:00:00Z',
      participants: ['@user-id', '@user-id-2'],
      widgetIds: ['widget-2'],
    };
    widgetApi.openModal.mockResolvedValue({
      type: 'nic.schedule.meeting.submit',
      meeting: newMeeting,
    } as ScheduleMeetingModalResult);

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /edit meeting/i }),
    );

    expect(widgetApi.openModal).toBeCalledWith(
      '/schedule-meeting',
      'Edit Meeting',
      {
        buttons: [
          {
            disabled: true,
            id: 'nic.schedule.meeting.submit',
            kind: 'm.primary',
            label: 'Save',
          },
          {
            id: 'nic.schedule.meeting.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
        data: {
          meeting: mockMeeting({
            parentRoomId: '!room-id',
            content: { widgets: ['widget-1'] },
          }),
          isMessagingEnabled: true,
        },
      },
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.update',
        {
          context: expect.anything(),
          data: {
            target_room_id: '!meeting-room-id',
            title: 'My new Meeting',
            description: 'My New Description',
            calendar: [
              {
                uid: 'entry-0',
                dtstart: { tzid: 'UTC', value: '20990101T100000' },
                dtend: { tzid: 'UTC', value: '20990101T140000' },
              },
            ],
          },
        },
      );
    });

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.participants.handle',
        {
          context: expect.anything(),
          data: {
            target_room_id: '!meeting-room-id',
            invite: true,
            userIds: ['@user-id-2'],
          },
        },
      );
    });

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.widgets.handle',
        {
          context: expect.anything(),
          data: {
            add: true,
            target_room_id: '!meeting-room-id',
            widget_ids: ['widget-2'],
          },
        },
      );
    });

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.widgets.handle',
        {
          context: expect.anything(),
          data: {
            add: false,
            target_room_id: '!meeting-room-id',
            widget_ids: ['widget-1'],
          },
        },
      );
    });
  });

  it('should edit recurring meeting from the card of a later recurrence', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi));
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.participants.handle')
      .subscribe(acknowledgeAllEvents(widgetApi));
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.widgets.handle')
      .subscribe(acknowledgeAllEvents(widgetApi));

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id-2',
        content: { displayname: 'Bob', membership: 'invite' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockWidgetEvent({
        room_id: '!meeting-room-id',
        state_key: 'widget-1',
      }),
    );
    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: mockCalendar({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!meeting-room-id',
        content: { events_default: 0 },
      }),
    );

    const newMeeting: CreateMeeting = {
      title: 'My new Meeting',
      description: 'My New Description',
      startTime: '2999-01-01T10:00:00Z',
      endTime: '2999-01-01T15:00:00Z',
      participants: ['@user-id'],
      widgetIds: ['widget-1'],
      rrule: 'FREQ=DAILY',
    };
    widgetApi.openModal.mockResolvedValue({
      type: 'nic.schedule.meeting.submit',
      meeting: newMeeting,
    } as ScheduleMeetingModalResult);

    render(
      <MeetingCard
        // We edit it from the card of the second recurring meeting instance
        recurrenceId="2999-01-02T10:00:00Z"
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /edit meeting/i }),
    );

    expect(widgetApi.openModal).toBeCalledWith(
      '/schedule-meeting',
      'Edit Meeting',
      {
        buttons: [
          {
            disabled: true,
            id: 'nic.schedule.meeting.submit',
            kind: 'm.primary',
            label: 'Save',
          },
          {
            id: 'nic.schedule.meeting.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
        data: {
          meeting: mockMeeting({
            parentRoomId: '!room-id',
            content: {
              startTime: '2999-01-02T10:00:00Z',
              endTime: '2999-01-02T14:00:00Z',
              calendarEntries: mockCalendar({
                dtstart: '29990101T100000',
                dtend: '29990101T140000',
                rrule: 'FREQ=DAILY',
              }),
              widgets: ['widget-1'],
              recurrenceId: '2999-01-02T10:00:00Z',
            },
          }),
          isMessagingEnabled: true,
        },
      },
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.update',
        {
          context: expect.anything(),
          data: {
            target_room_id: '!meeting-room-id',
            title: 'My new Meeting',
            description: 'My New Description',
            calendar: [
              {
                uid: 'entry-0',
                dtstart: { tzid: 'UTC', value: '29990101T100000' },
                dtend: { tzid: 'UTC', value: '29990101T150000' },
                rrule: 'FREQ=DAILY',
              },
            ],
          },
        },
      );
    });
  });

  it('should skip editing the meeting if the user aborts the action', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!meeting-room-id',
        content: { events_default: 0 },
      }),
    );

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /edit meeting/i }),
    );

    expect(widgetApi.openModal).toBeCalledWith(
      '/schedule-meeting',
      'Edit Meeting',
      {
        buttons: [
          {
            disabled: true,
            id: 'nic.schedule.meeting.submit',
            kind: 'm.primary',
            label: 'Save',
          },
          {
            id: 'nic.schedule.meeting.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
        data: {
          meeting: mockMeeting({ parentRoomId: '!room-id' }),
          isMessagingEnabled: true,
        },
      },
    );

    expect(widgetApi.sendRoomEvent).not.toBeCalled();
  });

  it('should show error dialog when loading the widgets failed because the user rejected the oidc token', async () => {
    widgetApi.requestOpenIDConnectToken.mockRejectedValue(
      new Error('some error'),
    );

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id-2',
        content: { displayname: 'Bob', membership: 'invite' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockWidgetEvent({
        room_id: '!meeting-room-id',
        state_key: 'widget-1',
      }),
    );

    const newMeeting: CreateMeeting = {
      title: 'My new Meeting',
      description: 'My New Description',
      startTime: '2099-01-01T10:00:00Z',
      endTime: '2099-01-01T14:00:00Z',
      participants: ['@user-id', '@user-id-2'],
      widgetIds: ['widget-2'],
    };
    widgetApi.openModal.mockResolvedValue({
      type: 'nic.schedule.meeting.submit',
      meeting: newMeeting,
    } as ScheduleMeetingModalResult);

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /edit meeting/i }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Failed to update the meeting',
    });

    expect(dialog).toHaveTextContent('Please try again');

    await userEvent.click(
      await within(dialog).findByRole('button', { name: 'Close' }),
    );

    expect(screen.queryByRole(dialog)).not.toBeInTheDocument();

    expect(widgetApi.sendRoomEvent).not.toBeCalled();
  });

  it('should show error dialog when updating the meeting details failed', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.participants.handle')
      .subscribe(acknowledgeAllEvents(widgetApi));

    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.widgets.handle')
      .subscribe(acknowledgeAllEvents(widgetApi));

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id-2',
        content: { displayname: 'Bob', membership: 'invite' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockWidgetEvent({
        room_id: '!meeting-room-id',
        state_key: 'widget-1',
      }),
    );

    const newMeeting: CreateMeeting = {
      title: 'My new Meeting',
      description: 'My New Description',
      startTime: '2099-01-01T10:00:00Z',
      endTime: '2099-01-01T14:00:00Z',
      participants: ['@user-id', '@user-id-2'],
      widgetIds: ['widget-2'],
    };
    widgetApi.openModal.mockResolvedValue({
      type: 'nic.schedule.meeting.submit',
      meeting: newMeeting,
    } as ScheduleMeetingModalResult);

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /edit meeting/i }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Failed to update the meeting',
    });

    expect(dialog).toHaveTextContent('Please try again');

    await userEvent.click(
      await within(dialog).findByRole('button', { name: 'Close' }),
    );

    expect(screen.queryByRole(dialog)).not.toBeInTheDocument();

    expect(widgetApi.sendRoomEvent).toBeCalledTimes(4);
  });

  it('should show error dialog when updating the meeting participants failed', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi));

    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.participants.handle')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.widgets.handle')
      .subscribe(acknowledgeAllEvents(widgetApi));

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id-2',
        content: { displayname: 'Bob', membership: 'invite' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockWidgetEvent({
        room_id: '!meeting-room-id',
        state_key: 'widget-1',
      }),
    );

    const newMeeting: CreateMeeting = {
      title: 'My new Meeting',
      description: 'My New Description',
      startTime: '2099-01-01T10:00:00Z',
      endTime: '2099-01-01T14:00:00Z',
      participants: ['@user-id', '@user-id-2'],
      widgetIds: ['widget-2'],
    };
    widgetApi.openModal.mockResolvedValue({
      type: 'nic.schedule.meeting.submit',
      meeting: newMeeting,
    } as ScheduleMeetingModalResult);

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /edit meeting/i }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Failed to update the meeting',
    });

    expect(dialog).toHaveTextContent('Please try again');

    await userEvent.click(
      await within(dialog).findByRole('button', { name: 'Close' }),
    );

    expect(screen.queryByRole(dialog)).not.toBeInTheDocument();

    expect(widgetApi.sendRoomEvent).toBeCalledTimes(4);
  });

  it('should show error dialog when updating the meeting widgets failed', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi));

    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.participants.handle')
      .subscribe(acknowledgeAllEvents(widgetApi));
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.widgets.handle')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id-2',
        content: { displayname: 'Bob', membership: 'invite' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockWidgetEvent({
        room_id: '!meeting-room-id',
        state_key: 'widget-1',
      }),
    );

    const newMeeting: CreateMeeting = {
      title: 'My new Meeting',
      description: 'My New Description',
      startTime: '2099-01-01T10:00:00Z',
      endTime: '2099-01-01T14:00:00Z',
      participants: ['@user-id', '@user-id-2'],
      widgetIds: ['widget-2'],
    };
    widgetApi.openModal.mockResolvedValue({
      type: 'nic.schedule.meeting.submit',
      meeting: newMeeting,
    } as ScheduleMeetingModalResult);

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /edit meeting/i }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Failed to update the meeting',
    });

    expect(dialog).toHaveTextContent('Please try again');

    await userEvent.click(
      await within(dialog).findByRole('button', { name: 'Close' }),
    );

    expect(screen.queryByRole(dialog)).not.toBeInTheDocument();

    expect(widgetApi.sendRoomEvent).toBeCalledTimes(4);
  });

  it('should go to parent room if the current meeting room is deleted', async () => {
    mockCreateMeetingRoom(widgetApi, {
      room_id: '!room-id',
      parentRoomId: '!parent-room-id',
    });

    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi));

    render(
      <MeetingCard recurrenceId={undefined} roomId="!room-id" uid="entry-0" />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /delete meeting/i }),
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /delete meeting/i,
    });

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.close',
        {
          context: { locale: 'en', timezone: 'UTC' },
          data: { target_room_id: '!room-id' },
        },
      );
    });

    await waitFor(() => {
      expect(widgetApi.navigateTo).toBeCalledWith(
        'https://matrix.to/#/!parent-room-id',
      );
    });

    await waitFor(() => {
      expect(deleteModal).not.toBeInTheDocument();
    });
  });

  it('should show a warning if deletion is scheduled', async () => {
    vi.spyOn(Date, 'now').mockImplementation(
      () => +new Date('2022-02-01T12:00:00Z'),
    );

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!room-id',
      parentRoomId: '!parent-room-id',
      metadata: {
        force_deletion_at: +new Date('2023-02-01T12:00:00Z'),
      },
    });

    render(
      <MeetingCard recurrenceId={undefined} roomId="!room-id" uid="entry-0" />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /delete meeting/i }),
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /delete meeting/i,
    });

    expect(within(deleteModal).getByRole('status')).toHaveTextContent(
      /meeting room will be automatically deleted in 365 days/i,
    );
  });

  it('should show error if deletion failed', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });
    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /delete meeting/i }),
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /delete meeting/i,
    });

    const deleteButton = within(deleteModal).getByRole('button', {
      name: 'Delete',
    });

    await userEvent.click(deleteButton);

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText(/failed to delete the meeting/i),
    ).toBeInTheDocument();
    expect(within(alert).getByText(/please try again/i)).toBeInTheDocument();

    expect(deleteButton).toBeEnabled();
  });

  it.each([
    'net.nordeck.meetings.meeting.update',
    'net.nordeck.meetings.meeting.widgets.handle',
    'net.nordeck.meetings.meeting.participants.handle',
    'net.nordeck.meetings.meeting.close',
  ])(
    'should hide edit actions if the "%s" permission is missing',
    async (eventType) => {
      widgetApi.mockSendStateEvent(
        mockPowerLevelsEvent({
          room_id: '!meeting-room-id',
          content: { events: { [eventType]: 101 } },
        }),
      );

      render(
        <MeetingCard
          recurrenceId={undefined}
          roomId="!meeting-room-id"
          uid="entry-0"
        />,
        { wrapper: Wrapper },
      );

      await expect(
        screen.findByRole('button', { name: /show participants/i }),
      ).resolves.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /share meeting/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /more settings/i }),
      ).not.toBeInTheDocument();
    },
  );

  it('should hide edit actions if meeting is an invitation', async () => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        room_id: '!meeting-room-id',
        content: {
          membership: 'invite',
        },
      }),
    );

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('button', { name: /show participants/i }),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /share meeting/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /more settings/i }),
    ).not.toBeInTheDocument();
  });

  it('should link from edit and delete button to Open-Xchange if enabled', async () => {
    mockConfigEndpoint(server, {
      jitsiDialInEnabled: true,
      openXchangeMeetingUrlTemplate:
        'https://ox.io/appsuite/#app=io.ox/calendar&id={{id}}&folder={{folder}}',
    });

    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: {
          external_data: {
            'io.ox': {
              folder: 'cal://0/31',
              id: 'cal://0/31.1.0',
            },
          },
        },
      }),
    );

    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        titleId="title-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /more settings/i }),
    );

    const menu = screen.getByRole('menu');

    expect(
      within(menu).getByRole('menuitem', {
        name: /edit meeting in open-xchange/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole('menuitem', {
        name: /delete meeting in open-xchange/i,
      }),
    ).toBeInTheDocument();
  });

  it('should share', async () => {
    render(
      <MeetingCard
        recurrenceId={undefined}
        roomId="!meeting-room-id"
        titleId="title-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /share meeting/i }),
    );

    const list = screen.getByRole('list', { name: /share meeting/i });

    within(list)
      .getAllByRole('button')
      .forEach((item) => {
        expect(item).toHaveAccessibleDescription(/an important meeting/i);
      });
  });

  it('should show an icon when the meeting is part of a recurring meeting', async () => {
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
      <MeetingCard
        recurrenceId="2999-01-01T10:00:00Z"
        roomId="!meeting-room-id"
        titleId="title-id"
        uid="entry-0"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByTestId('EventRepeatIcon'),
    ).resolves.toBeInTheDocument();

    expect(screen.getByText('. Recurrence: Every day')).toBeInTheDocument();
  });
});
