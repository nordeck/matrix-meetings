/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import {
  acknowledgeAllEvents,
  mockCalendarEntry,
  mockCreateMeetingRoom,
  mockMeeting,
} from '../../../../lib/testUtils';
import { createStore } from '../../../../store';
import { initializeStore } from '../../../../store/store';
import {
  DeleteMeetingDialog,
  deleteSingleMeetingOccurrenceThunk,
  selectIsLastMeetingOccurrence,
} from './DeleteMeetingDialog';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<DeleteMeetingDialog/>', () => {
  const onClose = vi.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

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

  it('should render without exploding', () => {
    render(
      <DeleteMeetingDialog open meeting={mockMeeting()} onClose={onClose} />,
      { wrapper: Wrapper },
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Delete meeting',
      description:
        'Are you sure you want to delete the meeting “An important meeting” on Jan 1, 10:00 AM and every content related to it?',
    });

    expect(
      within(dialog).getByRole('heading', { level: 2, name: 'Delete meeting' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Are you sure you want to delete the meeting “An important meeting” on Jan 1, 10:00 AM and every content related to it?',
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Delete' }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <DeleteMeetingDialog open meeting={mockMeeting()} onClose={onClose} />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should delete the meeting', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi));

    const meeting = mockMeeting();

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    render(<DeleteMeetingDialog open meeting={meeting} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', {
      name: 'Delete meeting',
      description:
        'Are you sure you want to delete the meeting “An important meeting” on Jan 1, 10:00 AM and every content related to it?',
    });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.close',
        {
          context: { locale: 'en', timezone: 'UTC' },
          data: { target_room_id: '!meeting-room-id:example.com' },
        },
      );
    });

    await waitFor(() => {
      expect(onClose).toBeCalled();
    });
  });

  it('should delete recurring meeting', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi));

    const meeting = mockMeeting({
      content: {
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    render(<DeleteMeetingDialog open meeting={meeting} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', {
      name: 'Delete meeting',
      description:
        'Are you sure you want to delete the meeting or the meeting series “An important meeting” on Jan 1, 10:00 AM and every content related to it?',
    });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete series' }),
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.close',
        {
          context: { locale: 'en', timezone: 'UTC' },
          data: { target_room_id: '!meeting-room-id:example.com' },
        },
      );
    });

    await waitFor(() => {
      expect(onClose).toBeCalled();
    });
  });

  it('should delete one occurrence of a recurring meeting', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi));

    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:00:00Z',
        endTime: '2999-01-02T14:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    render(<DeleteMeetingDialog open meeting={meeting} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', {
      name: 'Delete meeting',
      description:
        'Are you sure you want to delete the meeting or the meeting series “An important meeting” on Jan 2, 10:00 AM and every content related to it?',
    });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete meeting' }),
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.update',
        {
          context: expect.anything(),
          data: {
            target_room_id: '!meeting-room-id:example.com',
            calendar: [
              mockCalendarEntry({
                dtstart: '29990101T100000',
                dtend: '29990101T140000',
                rrule: 'FREQ=DAILY',
                exdate: ['29990102T100000'],
              }),
            ],
          },
        },
      );
    });

    await waitFor(() => {
      expect(onClose).toBeCalled();
    });
  });

  it('should delete the last occurrence of a recurring meeting', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi));

    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:00:00Z',
        endTime: '2999-01-02T14:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY;COUNT=2',
            exdate: ['29990101T100000'],
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    render(<DeleteMeetingDialog open meeting={meeting} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    const dialog = await screen.findByRole('dialog', {
      name: 'Delete meeting',
      description:
        'Are you sure you want to delete the meeting “An important meeting” on Jan 2, 10:00 AM and every content related to it?',
    });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.close',
        {
          context: { locale: 'en', timezone: 'UTC' },
          data: { target_room_id: '!meeting-room-id:example.com' },
        },
      );
    });

    await waitFor(() => {
      expect(onClose).toBeCalled();
    });
  });

  it('should show error if deletion failed', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    const meeting = mockMeeting();

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    render(<DeleteMeetingDialog open meeting={meeting} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', {
      name: 'Delete meeting',
      description:
        'Are you sure you want to delete the meeting “An important meeting” on Jan 1, 10:00 AM and every content related to it?',
    });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText('Failed to delete the meeting'),
    ).toBeInTheDocument();
    expect(within(alert).getByText('Please try again.')).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Delete' }),
    ).toBeEnabled();
  });

  it('should show error if deletion of meeting series failed', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    const meeting = mockMeeting({
      content: {
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    render(<DeleteMeetingDialog open meeting={meeting} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', { name: 'Delete meeting' });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete series' }),
    );

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText('Failed to delete the meeting'),
    ).toBeInTheDocument();
    expect(within(alert).getByText('Please try again.')).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Delete series' }),
    ).toBeEnabled();
    expect(
      within(dialog).getByRole('button', { name: 'Delete meeting' }),
    ).toBeEnabled();
  });

  it('should show error if deletion of meeting series occurrence failed', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:00:00Z',
        endTime: '2999-01-02T14:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    render(<DeleteMeetingDialog open meeting={meeting} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', { name: 'Delete meeting' });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete meeting' }),
    );

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText('Failed to delete the meeting'),
    ).toBeInTheDocument();
    expect(within(alert).getByText('Please try again.')).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Delete series' }),
    ).toBeEnabled();
    expect(
      within(dialog).getByRole('button', { name: 'Delete meeting' }),
    ).toBeEnabled();
  });

  it('should reset the error after reopening the dialog', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    const meeting = mockMeeting();

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    const { rerender } = render(
      <DeleteMeetingDialog open meeting={meeting} onClose={onClose} />,
      { wrapper: Wrapper },
    );

    const dialog0 = screen.getByRole('dialog', { name: 'Delete meeting' });

    await userEvent.click(
      within(dialog0).getByRole('button', { name: 'Delete' }),
    );

    expect(await within(dialog0).findByRole('alert')).toBeInTheDocument();

    rerender(
      <DeleteMeetingDialog open={false} meeting={meeting} onClose={onClose} />,
    );

    await waitFor(() => {
      expect(dialog0).not.toBeInTheDocument();
    });

    rerender(<DeleteMeetingDialog open meeting={meeting} onClose={onClose} />);

    const dialog1 = screen.getByRole('dialog', { name: 'Delete meeting' });

    expect(within(dialog1).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should go to parent room if the current meeting room is deleted', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.close')
      .subscribe(acknowledgeAllEvents(widgetApi));

    const meeting = mockMeeting({
      room_id: '!room-id:example.com',
      parentRoomId: '!parent-room-id:example.com',
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
      room_id: '!room-id:example.com',
      parentRoomId: '!parent-room-id:example.com',
    });

    render(<DeleteMeetingDialog open meeting={meeting} onClose={onClose} />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', { name: 'Delete meeting' });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.close',
        {
          context: { locale: 'en', timezone: 'UTC' },
          data: { target_room_id: '!room-id:example.com' },
        },
      );
    });

    await waitFor(() => {
      expect(widgetApi.navigateTo).toBeCalledWith(
        'https://matrix.to/#/!parent-room-id%3Aexample.com',
      );
    });

    await waitFor(() => {
      expect(onClose).toBeCalled();
    });
  });
});

describe('deleteSingleMeetingOccurrenceThunk', () => {
  it('should ignore meeting without a metadata event', async () => {
    const store = createStore({ widgetApi });

    const meeting = mockMeeting();

    await initializeStore(store);

    expect(
      await store
        .dispatch(deleteSingleMeetingOccurrenceThunk(meeting))
        .unwrap(),
    ).toBeUndefined();

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should ignore meeting without a recurrence id', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi));

    const store = createStore({ widgetApi });

    const meeting = mockMeeting({
      content: {
        recurrenceId: undefined,
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    await initializeStore(store);

    expect(
      await store
        .dispatch(deleteSingleMeetingOccurrenceThunk(meeting))
        .unwrap(),
    ).toBeUndefined();

    expect(widgetApi.sendRoomEvent).not.toBeCalled();
  });

  it('should skip unchanged events', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi));

    const store = createStore({ widgetApi });

    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:00:00Z',
        endTime: '2999-01-02T14:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
            // This meeting is already excluded
            exdate: ['29990102T100000'],
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    await initializeStore(store);

    expect(
      await store
        .dispatch(deleteSingleMeetingOccurrenceThunk(meeting))
        .unwrap(),
    ).toBeUndefined();

    expect(widgetApi.sendRoomEvent).not.toBeCalled();
  });

  it('should apply deletion', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.meeting.update')
      .subscribe(acknowledgeAllEvents(widgetApi));

    const store = createStore({ widgetApi });

    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:00:00Z',
        endTime: '2999-01-02T14:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    await initializeStore(store);

    expect(
      await store
        .dispatch(deleteSingleMeetingOccurrenceThunk(meeting))
        .unwrap(),
    ).toEqual({
      acknowledgement: { success: true },
      event: {
        content: {
          context: expect.anything(),
          data: {
            title: undefined,
            description: undefined,
            target_room_id: '!meeting-room-id:example.com',
            calendar: [
              mockCalendarEntry({
                dtstart: '29990101T100000',
                dtend: '29990101T140000',
                rrule: 'FREQ=DAILY',
                exdate: ['29990102T100000'],
              }),
            ],
          },
        },
        event_id: expect.any(String),
        origin_server_ts: expect.any(Number),
        room_id: '!room-id:example.com',
        sender: '@user-id:example.com',
        type: 'net.nordeck.meetings.meeting.update',
      },
    });

    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.meetings.meeting.update',
      {
        context: expect.anything(),
        data: {
          target_room_id: '!meeting-room-id:example.com',
          calendar: [
            mockCalendarEntry({
              dtstart: '29990101T100000',
              dtend: '29990101T140000',
              rrule: 'FREQ=DAILY',
              exdate: ['29990102T100000'],
            }),
          ],
        },
      },
    );
  });
});

describe('selectIsLastMeetingOccurrence', () => {
  it('should return false if more entries are available', async () => {
    const store = createStore({ widgetApi });

    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:00:00Z',
        endTime: '2999-01-02T14:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY;COUNT=2',
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    await initializeStore(store);

    expect(
      selectIsLastMeetingOccurrence(
        store.getState(),
        meeting.meetingId,
        meeting,
      ),
    ).toBe(false);
  });

  it('should return true if this is the last entry', async () => {
    const store = createStore({ widgetApi });

    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:00:00Z',
        endTime: '2999-01-02T14:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY;COUNT=2',
            exdate: ['29990101T100000'],
          }),
        ],
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      metadata: { calendar: meeting.calendarEntries },
    });

    await initializeStore(store);

    expect(
      selectIsLastMeetingOccurrence(
        store.getState(),
        meeting.meetingId,
        meeting,
      ),
    ).toBe(true);
  });
});
