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
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import {
  mockBreakoutSession,
  mockCalendar,
  mockCalendarEntry,
  mockCreateBreakoutMeetingRoom,
  mockCreateMeetingRoom,
  mockMeeting,
  mockRoomMember,
  mockWidgetEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { ScheduleMeeting } from './ScheduleMeeting';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<ScheduleMeeting>', () => {
  const onMeetingChange = jest.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockWidgetEndpoint(server);
    widgetApi.mockSendStateEvent(mockRoomMember());
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-1',
        content: { displayname: undefined },
      })
    );
    widgetApi.searchUserDirectory.mockImplementation((searchTerm: string) => {
      const results =
        searchTerm === 'user-1'
          ? [
              {
                userId: '@user-1',
                displayName: undefined,
                avatarUrl: undefined,
              },
            ]
          : [];
      return Promise.resolve({
        results,
      });
    });

    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => +new Date('2022-01-02T13:10:00.000Z'));

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      }, []);
      return (
        <LocalizationProvider>
          <WidgetApiMockProvider value={widgetApi}>
            <Provider store={store}>{children}</Provider>
          </WidgetApiMockProvider>
        </LocalizationProvider>
      );
    };
  });

  it('should render without exploding', async () => {
    render(<ScheduleMeeting onMeetingChange={onMeetingChange} />, {
      wrapper: Wrapper,
    });

    await waitFor(
      () => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(),
      { timeout: 10000 }
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Meeting'
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'My Description'
    );
    await userEvent.type(
      screen.getByRole('button', { name: 'Widget 2' }),
      '{Backspace}'
    );

    const startAtGroup = screen.getByRole('group', { name: 'Start at' });

    expect(
      within(startAtGroup).getByRole('textbox', { name: 'Start date' })
    ).toHaveValue('01/02/2022');
    expect(
      within(startAtGroup).getByRole('textbox', { name: 'Start time' })
    ).toHaveValue('01:15 PM');

    const endAtGroup = screen.getByRole('group', { name: 'End at' });

    expect(
      within(endAtGroup).getByRole('textbox', { name: 'End date' })
    ).toHaveValue('01/02/2022');
    expect(
      within(endAtGroup).getByRole('textbox', { name: 'End time' })
    ).toHaveValue('02:15 PM');

    expect(
      screen.getByRole('button', { name: 'Repeat meeting No repetition' })
    ).toBeInTheDocument();

    // Async as we wait for the widgets to load
    await waitFor(() => {
      expect(onMeetingChange).toHaveBeenLastCalledWith({
        description: 'My Description',
        endTime: '2022-01-02T14:15:00.000Z',
        participants: ['@user-id'],
        startTime: '2022-01-02T13:15:00.000Z',
        title: 'My Meeting',
        widgetIds: ['widget-1'],
      });
    });
  }, 10000);

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ScheduleMeeting onMeetingChange={jest.fn()} showParticipants />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if input is invalid', async () => {
    const { container } = render(
      <ScheduleMeeting onMeetingChange={jest.fn()} />,
      { wrapper: Wrapper }
    );

    // Trigger the dirty state by adding any input
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'I want to…'
    );
    expect(
      screen.getByRole('textbox', { name: 'Title (required)' })
    ).toBeInvalid();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should handle required fields', async () => {
    render(<ScheduleMeeting onMeetingChange={onMeetingChange} />, {
      wrapper: Wrapper,
    });

    expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Meeting'
    );

    expect(onMeetingChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'My Meeting' })
    );
  });

  it('should adjust the meeting end time if the start time is changed', async () => {
    render(<ScheduleMeeting onMeetingChange={onMeetingChange} />, {
      wrapper: Wrapper,
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Meeting'
    );

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(screen.getByRole('textbox', { name: 'Start time' }), {
      target: { value: '06:00 PM' },
    });

    expect(screen.getByRole('textbox', { name: 'Start date' })).toHaveValue(
      '01/02/2022'
    );
    expect(screen.getByRole('textbox', { name: 'Start time' })).toHaveValue(
      '06:00 PM'
    );
    expect(screen.getByRole('textbox', { name: 'End date' })).toHaveValue(
      '01/02/2022'
    );
    expect(screen.getByRole('textbox', { name: 'End time' })).toHaveValue(
      '07:00 PM'
    );

    await waitFor(() => {
      expect(onMeetingChange).toHaveBeenLastCalledWith({
        description: '',
        endTime: '2022-01-02T19:00:00.000Z',
        participants: ['@user-id'],
        startTime: '2022-01-02T18:00:00.000Z',
        title: 'My Meeting',
        widgetIds: ['widget-1', 'widget-2'],
      });
    });
  });

  it('should adjust meeting repetition', async () => {
    render(<ScheduleMeeting onMeetingChange={onMeetingChange} />, {
      wrapper: Wrapper,
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Meeting'
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Repeat meeting No repetition' })
    );
    const recurrenceOptionsList = screen.getByRole('listbox', {
      name: 'Repeat meeting',
    });
    await userEvent.click(
      within(recurrenceOptionsList).getByRole('option', { name: 'Daily' })
    );

    expect(onMeetingChange).toHaveBeenLastCalledWith({
      description: '',
      endTime: '2022-01-02T14:15:00.000Z',
      participants: ['@user-id'],
      startTime: '2022-01-02T13:15:00.000Z',
      title: 'My Meeting',
      widgetIds: ['widget-1', 'widget-2'],
      rrule: 'FREQ=DAILY',
    });
  });

  it('should allow member selection', async () => {
    render(
      <ScheduleMeeting onMeetingChange={onMeetingChange} showParticipants />,
      { wrapper: Wrapper }
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Meeting'
    );

    await userEvent.type(
      screen.getByRole('combobox', { name: 'Participants' }),
      'user-1'
    );
    await userEvent.click(
      await screen.findByRole('option', { name: '@user-1' })
    );

    await waitFor(() => {
      expect(onMeetingChange).toHaveBeenLastCalledWith({
        description: '',
        endTime: '2022-01-02T14:15:00.000Z',
        participants: ['@user-id', '@user-1'],
        startTime: '2022-01-02T13:15:00.000Z',
        title: 'My Meeting',
        widgetIds: ['widget-1', 'widget-2'],
      });
    });
  });

  it('should warn the user if title is missing', async () => {
    render(<ScheduleMeeting onMeetingChange={onMeetingChange} />, {
      wrapper: Wrapper,
    });

    const titleTextbox = screen.getByRole('textbox', {
      name: 'Title (required)',
      description: '',
    });

    expect(titleTextbox).toBeInvalid();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'My Description'
    );

    expect(titleTextbox).toBeInvalid();
    expect(titleTextbox).toHaveAccessibleDescription('A title is required');

    expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn the user if end date is before start date', async () => {
    render(<ScheduleMeeting onMeetingChange={onMeetingChange} />, {
      wrapper: Wrapper,
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Meeting'
    );

    const endTimeTextbox = screen.getByRole('textbox', { name: 'End time' });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(endTimeTextbox, { target: { value: '10:00 AM' } });

    const endDateTextbox = screen.getByRole('textbox', {
      name: 'End date',
      description: 'Meeting should start before it ends.',
    });

    expect(endDateTextbox).toBeInvalid();
    expect(endTimeTextbox).toBeInvalid();
    expect(endTimeTextbox).toHaveAccessibleDescription(
      'Meeting should start before it ends.'
    );

    expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn the user if the meeting starts in the past', async () => {
    render(<ScheduleMeeting onMeetingChange={onMeetingChange} />, {
      wrapper: Wrapper,
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Meeting'
    );

    const startTimeTextbox = screen.getByRole('textbox', {
      name: 'Start time',
      description: '',
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(startTimeTextbox, { target: { value: '10:00 AM' } });

    const startDateTextbox = screen.getByRole('textbox', {
      name: 'Start date',
      description: 'Meeting cannot start in the past.',
    });

    expect(startDateTextbox).toBeInvalid();
    expect(startTimeTextbox).toBeInvalid();
    expect(startTimeTextbox).toHaveAccessibleDescription(
      'Meeting cannot start in the past.'
    );

    expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should show warning if meeting already ended', async () => {
    const meeting = mockMeeting({
      content: { endTime: '0001-01-01T00:00:00Z' },
    });

    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      /the meeting is already over and cannot be changed/i
    );
  });

  it('should warn the user if the recurrence rule is invalid', async () => {
    render(<ScheduleMeeting onMeetingChange={onMeetingChange} />, {
      wrapper: Wrapper,
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Repeat meeting No repetition' })
    );
    const recurrenceOptionsList = screen.getByRole('listbox', {
      name: 'Repeat meeting',
    });
    await userEvent.click(
      within(recurrenceOptionsList).getByRole('option', { name: 'Daily' })
    );

    await userEvent.click(screen.getByRole('radio', { name: /Ends after/ }));
    await userEvent.clear(
      screen.getByRole('spinbutton', { name: 'Count of meetings' })
    );

    expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should update the meeting', async () => {
    render(
      <ScheduleMeeting
        initialMeeting={mockMeeting({
          content: {
            startTime: '2023-01-01T10:00:00Z',
            endTime: '2023-01-01T14:00:00Z',
          },
        })}
        onMeetingChange={onMeetingChange}
      />,
      { wrapper: Wrapper }
    );

    const titleField = screen.getByRole('textbox', {
      name: 'Title (required)',
    });
    const descriptionField = screen.getByRole('textbox', {
      name: 'Description',
    });
    const startDateField = screen.getByRole('textbox', {
      name: 'Start date',
    });
    const startTimeField = screen.getByRole('textbox', {
      name: 'Start time',
    });
    const endDateField = screen.getByRole('textbox', {
      name: 'End date',
    });
    const endTimeField = screen.getByRole('textbox', {
      name: 'End time',
    });

    expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);

    expect(titleField).toHaveValue('An important meeting');
    expect(descriptionField).toHaveValue('A brief description');

    await userEvent.type(titleField, 'A new name', {
      initialSelectionStart: 0,
      initialSelectionEnd: 20,
    });
    await userEvent.type(descriptionField, 'A new description', {
      initialSelectionStart: 0,
      initialSelectionEnd: 19,
    });

    fireEvent.change(startDateField, { target: { value: '01/02/2023' } });
    fireEvent.change(startTimeField, { target: { value: '12:34 AM' } });
    fireEvent.change(endDateField, { target: { value: '01/03/2023' } });
    fireEvent.change(endTimeField, { target: { value: '12:34 PM' } });

    await userEvent.click(
      screen.getByRole('button', { name: 'Repeat meeting No repetition' })
    );
    const recurrenceOptionsList = screen.getByRole('listbox', {
      name: 'Repeat meeting',
    });
    await userEvent.click(
      within(recurrenceOptionsList).getByRole('option', { name: 'Daily' })
    );

    expect(onMeetingChange).toHaveBeenLastCalledWith({
      title: 'A new name',
      description: 'A new description',
      startTime: '2023-01-02T00:34:00.000Z',
      endTime: '2023-01-03T12:34:00.000Z',
      widgetIds: [],
      participants: ['@user-id'],
      rrule: 'FREQ=DAILY',
    });
  }, 10000);

  it('should fill the form for editing a recurring meeting', async () => {
    render(
      <ScheduleMeeting
        initialMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T10:00:00Z',
            endTime: '2022-01-02T14:00:00Z',
            calendarEntries: mockCalendar({
              dtstart: '20220101T100000',
              dtend: '20220101T140000',
              rrule: 'FREQ=DAILY',
            }),
          },
        })}
        onMeetingChange={onMeetingChange}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      /You are editing a recurring meeting/
    );

    expect(
      screen.getByRole('textbox', { name: 'Title (required)' })
    ).toHaveValue('An important meeting');
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      'A brief description'
    );

    const startDateTextbox = screen.getByRole('textbox', {
      name: 'Start date',
    });
    expect(startDateTextbox).toHaveValue('01/01/2022');
    expect(startDateTextbox).not.toHaveAttribute('readonly');
    expect(startDateTextbox).toBeValid();

    const startTimeTextbox = screen.getByRole('textbox', {
      name: 'Start time',
    });
    expect(startTimeTextbox).toHaveValue('10:00 AM');
    expect(startTimeTextbox).not.toHaveAttribute('readonly');
    expect(startTimeTextbox).toBeValid();

    const endDateTextbox = screen.getByRole('textbox', { name: 'Start date' });
    expect(endDateTextbox).toHaveValue('01/01/2022');
    expect(endDateTextbox).not.toHaveAttribute('readonly');
    expect(endDateTextbox).toBeValid();

    const endTimeTextbox = screen.getByRole('textbox', { name: 'End time' });
    expect(endTimeTextbox).toHaveValue('02:00 PM');
    expect(endTimeTextbox).not.toHaveAttribute('readonly');
    expect(endTimeTextbox).toBeValid();
  });

  it('should edit the meeting even if it already started', async () => {
    const meeting = mockMeeting({
      content: {
        startTime: '0001-01-01T00:00:00Z',
        endTime: '3999-12-31T23:59:59Z',
      },
    });

    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
      />,
      { wrapper: Wrapper }
    );

    const startDateTextbox = screen.getByRole('textbox', {
      name: 'Start date',
      description: 'The meeting already started.',
    });

    const startTimeTextbox = screen.getByRole('textbox', {
      name: 'Start time',
      description: 'The meeting already started.',
    });

    expect(startDateTextbox).toHaveAttribute('readonly');
    expect(startTimeTextbox).toHaveAttribute('readonly');

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(screen.getByRole('textbox', { name: 'End date' }), {
      target: { value: '01/03/2022' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'End time' }), {
      target: { value: '10:00 PM' },
    });

    await waitFor(() => {
      expect(onMeetingChange).toHaveBeenLastCalledWith({
        description: 'A brief description',
        endTime: '2022-01-03T22:00:00.000Z',
        participants: ['@user-id'],
        startTime: '0001-01-01T00:00:00.000Z',
        title: 'An important meeting',
        widgetIds: [],
      });
    });
  }, 10000);

  it('should disabled submission if meeting is changed to start in the past', async () => {
    const meeting = mockMeeting({
      content: {
        startTime: '2022-01-02T13:15:00Z',
        endTime: '2022-01-02T14:15:00Z',
      },
    });
    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
      />,
      { wrapper: Wrapper }
    );

    const startDateTextbox = screen.getByRole('textbox', {
      name: 'Start date',
      description: '',
    });

    const startTimeTextbox = screen.getByRole('textbox', {
      name: 'Start time',
      description: '',
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(startDateTextbox, { target: { value: '01/03/2021' } });

    expect(startDateTextbox).toBeInvalid();
    expect(startTimeTextbox).toBeInvalid();
    expect(startTimeTextbox).toHaveAccessibleDescription(
      'Meeting cannot start in the past.'
    );

    await waitFor(() => {
      expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);
    });
  });

  it('should disabled submission if meeting series is changed to start in the past', async () => {
    const meeting = mockMeeting({
      content: {
        startTime: '2022-01-01T13:15:00Z',
        endTime: '2022-01-01T14:15:00Z',
        calendarEntries: mockCalendar({
          dtstart: '20230101T100000',
          dtend: '20230101T140000',
          rrule: 'FREQ=DAILY',
        }),
      },
    });
    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
      />,
      { wrapper: Wrapper }
    );

    const startDateTextbox = screen.getByRole('textbox', {
      name: 'Start date',
      description: '',
    });
    const startTimeTextbox = screen.getByRole('textbox', {
      name: 'Start time',
      description: '',
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(startDateTextbox, { target: { value: '01/03/2021' } });

    expect(startDateTextbox).toBeInvalid();
    expect(startTimeTextbox).toHaveAccessibleDescription(
      'Meeting cannot start in the past.'
    );

    await waitFor(() => {
      expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);
    });
  });

  it('should disabled submit button if we have edit meeting and user did not change anything', async () => {
    const meeting = mockMeeting();
    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
      />,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);
    });
  });

  it('should show warning if the meeting has breakout sessions', async () => {
    const meeting = mockMeeting({
      parentRoomId: '!room-id',
    });
    mockCreateMeetingRoom(widgetApi);
    mockCreateBreakoutMeetingRoom(widgetApi);
    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
      />,
      { wrapper: Wrapper }
    );

    const alert = await screen.findByRole('status');
    expect(
      within(alert).getByText(/the meeting already has breakout sessions/i)
    ).toBeInTheDocument();
  });

  it('should show the old meeting data in edit dialog', async () => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id-2',
        room_id: '!meeting-room-id',
        content: { displayname: 'Bob', membership: 'invite' },
      })
    );
    const meeting = mockMeeting({
      content: {
        participants: [
          {
            userId: '@user-id',
            displayName: 'Alice',
            membership: 'join',
            rawEvent: mockRoomMember({ room_id: '!meeting-room-id' }),
          },
          {
            userId: '@user-id-2',
            displayName: 'Bob',
            membership: 'join',
            rawEvent: mockRoomMember({ room_id: '!meeting-room-id' }),
          },
        ],
        widgets: ['widget-2'],
        startTime: '2023-01-01T10:00:00Z',
        endTime: '2023-01-01T14:00:00Z',
        calendarEntries: [
          mockCalendarEntry({
            dtstart: '20230101T100000',
            dtend: '20230101T140000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      },
    });

    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
        showParticipants
      />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByRole('textbox', { name: 'Title (required)' })
    ).toHaveValue('An important meeting');

    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      'A brief description'
    );

    const startAtGroup = screen.getByRole('group', { name: 'Start at' });

    expect(
      within(startAtGroup).getByRole('textbox', { name: 'Start date' })
    ).toHaveValue('01/01/2023');
    expect(
      within(startAtGroup).getByRole('textbox', { name: 'Start time' })
    ).toHaveValue('10:00 AM');

    const endAtGroup = screen.getByRole('group', { name: 'End at' });

    expect(
      within(endAtGroup).getByRole('textbox', { name: 'End date' })
    ).toHaveValue('01/01/2023');
    expect(
      within(endAtGroup).getByRole('textbox', { name: 'End time' })
    ).toHaveValue('02:00 PM');

    expect(
      await screen.findByRole('button', { name: 'Bob' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Widget 2' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Repeat meeting Every day' })
    ).toBeInTheDocument();
  }, 10000);

  it('should have a date picker if meeting start and end date are different', () => {
    mockCreateMeetingRoom(widgetApi);
    mockCreateBreakoutMeetingRoom(widgetApi);

    const meeting = mockBreakoutSession({
      content: {
        startTime: '2999-01-01T11:00:00Z',
        endTime: '2999-01-01T11:30:00Z',
      },
    });

    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('textbox', { name: 'Start date' })).toHaveValue(
      '01/01/2999'
    );
    expect(screen.getByRole('textbox', { name: 'Start time' })).toHaveValue(
      '11:00 AM'
    );

    expect(screen.getByRole('textbox', { name: 'End date' })).toHaveValue(
      '01/01/2999'
    );
    expect(screen.getByRole('textbox', { name: 'End time' })).toHaveValue(
      '11:30 AM'
    );
  });

  it('should edit breakout session', async () => {
    mockCreateMeetingRoom(widgetApi);
    mockCreateBreakoutMeetingRoom(widgetApi);

    const meeting = mockBreakoutSession({
      content: {
        startTime: '2999-01-01T11:00:00Z',
        endTime: '2999-01-01T11:30:00Z',
      },
    });

    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
        parentRoomId="!meeting-room-id"
      />,
      { wrapper: Wrapper }
    );

    const titleField = screen.getByRole('textbox', {
      name: 'Title (required)',
    });
    await userEvent.clear(titleField);
    await userEvent.type(titleField, 'Group A');

    expect(
      screen.queryByRole('button', { name: /Repeat meeting/ })
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(onMeetingChange).toHaveBeenLastCalledWith({
        description: 'A brief description',
        endTime: '2999-01-01T11:30:00.000Z',
        participants: ['@user-id'],
        startTime: '2999-01-01T11:00:00.000Z',
        title: 'Group A',
        widgetIds: [],
      });
    });
  });

  it('should adjust the breakout session end time if the start time is changed', async () => {
    mockCreateMeetingRoom(widgetApi);
    mockCreateBreakoutMeetingRoom(widgetApi);

    const meeting = mockBreakoutSession({
      content: {
        title: 'Group 1',
        startTime: '2999-01-01T11:00:00Z',
        endTime: '2999-01-01T11:30:00Z',
      },
    });

    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
        parentRoomId="!meeting-room-id"
      />,
      { wrapper: Wrapper }
    );

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(screen.getByRole('textbox', { name: 'Start time' }), {
      target: { value: '12:00 PM' },
    });

    expect(screen.getByRole('textbox', { name: 'Start time' })).toHaveValue(
      '12:00 PM'
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'End time' })).toHaveValue(
        '12:30 PM'
      );
    });

    expect(onMeetingChange).toHaveBeenLastCalledWith({
      description: 'A brief description',
      endTime: '2999-01-01T12:30:00.000Z',
      participants: ['@user-id'],
      startTime: '2999-01-01T12:00:00.000Z',
      title: 'Group 1',
      widgetIds: [],
    });
  });

  it('should warn if the breakout session start time is too early', async () => {
    mockCreateMeetingRoom(widgetApi);
    mockCreateBreakoutMeetingRoom(widgetApi);

    const meeting = mockBreakoutSession({
      content: {
        startTime: '2999-01-01T11:00:00Z',
        endTime: '2999-01-01T11:30:00Z',
      },
    });

    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
        parentRoomId="!meeting-room-id"
      />,
      { wrapper: Wrapper }
    );

    // wait until parent meeting is loaded
    await waitFor(() => {
      expect(
        screen.queryByRole('textbox', { name: 'Start date' })
      ).not.toBeInTheDocument();
    });

    const startTimeTextbox = screen.getByRole('textbox', {
      name: 'Start time',
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(startTimeTextbox, { target: { value: '09:00 AM' } });

    expect(startTimeTextbox).toHaveAccessibleDescription(
      'Breakout session should start between 10:00 AM and 2:00 PM.'
    );
    expect(startTimeTextbox).toBeInvalid();
    expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn if the breakout session ends before it starts', async () => {
    mockCreateMeetingRoom(widgetApi, {
      parentRoomId: '!meeting-room-id',
    });

    mockCreateBreakoutMeetingRoom(widgetApi);

    const meeting = mockBreakoutSession({
      content: {
        startTime: '2999-01-01T11:00:00Z',
        endTime: '2999-01-01T11:30:00Z',
      },
    });

    render(
      <ScheduleMeeting
        initialMeeting={meeting}
        onMeetingChange={onMeetingChange}
        parentRoomId="!meeting-room-id"
      />,
      { wrapper: Wrapper }
    );

    // wait until parent meeting is loaded
    await waitFor(() => {
      expect(
        screen.queryByRole('textbox', { name: 'Start date' })
      ).not.toBeInTheDocument();
    });

    const endTimeTextbox = screen.getByRole('textbox', {
      name: 'End time',
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(endTimeTextbox, { target: { value: '10:30 AM' } });

    expect(endTimeTextbox).toHaveAccessibleDescription(
      'Breakout session should start before it ends.'
    );
    expect(endTimeTextbox).toBeInvalid();
    expect(onMeetingChange).toHaveBeenLastCalledWith(undefined);
  });
});
