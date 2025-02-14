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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { MockedWidgetApi, mockWidgetApi } from '../../../../lib/mockWidgetApi';
import {
  acknowledgeAllEvents,
  mockCalendar,
  mockConfigEndpoint,
  mockCreateMeetingRoom,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
  mockNordeckMeetingMetadataEvent,
  mockRoomMember,
  mockWidgetEndpoint,
  mockWidgetEvent,
} from '../../../../lib/testUtils';
import { createStore } from '../../../../store';
import { initializeStore } from '../../../../store/store';
import {
  CreateMeeting,
  ScheduleMeetingModalResult,
} from '../../ScheduleMeetingModal';
import { MeetingDetailsHeader } from './MeetingDetailsHeader';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  extractWidgetApiParameters: jest.fn(),
}));

const extractWidgetApiParameters = jest.mocked(
  extractWidgetApiParametersMocked,
);

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingDetailsHeader/>', () => {
  const onClose = jest.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    jest.mocked(extractWidgetApiParameters).mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    mockWidgetEndpoint(server);
    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);

    mockCreateMeetingRoom(widgetApi);

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

  afterEach(() => {
    // Restore the spy on Date.now()
    jest.restoreAllMocks();
  });

  it('should render without exploding', () => {
    render(<MeetingDetailsHeader meeting={mockMeeting()} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    expect(
      screen.getByRole('heading', { level: 3, name: /An important meeting/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingDetailsHeader meeting={mockMeeting()} onClose={onClose} />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should close the expended meeting dialog', async () => {
    render(<MeetingDetailsHeader meeting={mockMeeting()} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    await userEvent.click(
      await screen.findByRole('button', { name: /Close/i }),
      { skipHover: true },
    );

    expect(onClose).toBeCalled();
  });

  it('should hide join and close button in meeting details sidebar', async () => {
    render(<MeetingDetailsHeader hideJoinButton meeting={mockMeeting()} />, {
      wrapper: Wrapper,
    });

    expect(
      screen.queryByRole('button', { name: 'Join' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
  });

  it('should edit the meeting', async () => {
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
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: '!room-id',
          content: {
            widgets: ['widget-1'],
          },
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(await screen.findByRole('button', { name: /Edit/i }));

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
          isMessagingEnabled: false,
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
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: '!room-id',
          content: {
            calendarEntries: mockCalendar({
              dtstart: '29990101T100000',
              dtend: '29990101T140000',
              rrule: 'FREQ=DAILY',
            }),
            widgets: ['widget-1'],
          },
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(await screen.findByRole('button', { name: /Edit/i }));

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
              endTime: '2999-01-01T14:00:00Z',
              calendarEntries: mockCalendar({
                dtstart: '29990101T100000',
                dtend: '29990101T140000',
                rrule: 'FREQ=DAILY',
              }),
              widgets: ['widget-1'],
              recurrenceId: '2999-01-01T10:00:00Z',
              startTime: '2999-01-01T10:00:00Z',
            },
          }),
          isMessagingEnabled: false,
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
    render(
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: '!room-id',
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(await screen.findByRole('button', { name: /Edit/i }));

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
          isMessagingEnabled: false,
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
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: '!room-id',
          content: {
            widgets: ['widget-1'],
          },
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );
    await userEvent.click(await screen.findByRole('button', { name: /Edit/i }));

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
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: '!room-id',
          content: {
            widgets: ['widget-1'],
          },
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(await screen.findByRole('button', { name: /Edit/i }));

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
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: '!room-id',
          content: {
            widgets: ['widget-1'],
          },
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(await screen.findByRole('button', { name: /Edit/i }));

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
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: '!room-id',
          content: {
            widgets: ['widget-1'],
          },
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(await screen.findByRole('button', { name: /Edit/i }));

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

    render(
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!room-id',
          parentRoomId: '!parent-room-id',
          content: {
            widgets: ['widget-1'],
          },
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /Delete/i }),
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

  it('should delete the meeting', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi));

    render(<MeetingDetailsHeader meeting={mockMeeting()} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    await userEvent.click(
      await screen.findByRole('button', { name: /Delete/i }),
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

  it('should show error if deletion failed', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    render(
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: '!room-id',
          content: {
            widgets: ['widget-1'],
          },
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /Delete/i }),
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
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: undefined,
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    expect(
      await screen.findByRole('button', {
        name: /Edit meeting in Open-Xchange/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /Delete meeting in Open-Xchange/i,
      }),
    ).toBeInTheDocument();
  });

  it('should hide edit actions if meeting is an invitation', async () => {
    const { rerender } = render(
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: undefined,
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    const editButton = await screen.findByRole('button', { name: 'Edit' });
    const deleteButton = screen.getByRole('button', { name: 'Delete' });

    rerender(
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: undefined,
          content: {
            participants: [
              {
                userId: '@user-id',
                displayName: 'Alice',
                membership: 'invite',
                rawEvent: mockRoomMember({
                  room_id: '!meeting-room-id',
                  content: {
                    membership: 'invite',
                  },
                }),
              },
            ],
          },
        })}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(editButton).not.toBeInTheDocument();
    });
    expect(deleteButton).not.toBeInTheDocument();
  });

  it('should hide edit actions if meeting is an OX invitation', async () => {
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

    const { rerender } = render(
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: undefined,
        })}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    const editButton = await screen.findByRole('button', {
      name: 'Edit meeting in Open-Xchange',
    });
    const deleteButton = screen.getByRole('button', {
      name: 'Delete meeting in Open-Xchange',
    });

    rerender(
      <MeetingDetailsHeader
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          parentRoomId: undefined,
          content: {
            participants: [
              {
                userId: '@user-id',
                displayName: 'Alice',
                membership: 'invite',
                rawEvent: mockRoomMember({
                  room_id: '!meeting-room-id',
                  content: {
                    membership: 'invite',
                  },
                }),
              },
            ],
          },
        })}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(editButton).not.toBeInTheDocument();
    });
    expect(deleteButton).not.toBeInTheDocument();
  });
});
