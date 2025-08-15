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

import { WidgetConfig } from '@matrix-widget-toolkit/api';
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
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { Subject } from 'rxjs';
import { expect, vi } from 'vitest';
import {
  mockCalendar,
  mockMeeting,
  mockWidgetEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import {
  ScheduleMeetingModal,
  getEditableInitialMeeting,
} from './ScheduleMeetingModal';
import { ScheduleMeetingModalRequest } from './types';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;
beforeEach(() => (widgetApi = mockWidgetApi()));
afterEach(() => {
  widgetApi.stop();
  vi.resetAllMocks();
});

describe('<ScheduleMeetingModal>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockWidgetEndpoint(server);

    vi.spyOn(Date, 'now').mockImplementation(
      () => +new Date('2022-01-02T13:10:00.000Z'),
    );

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

  it('should schedule a meeting on submit', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<ScheduleMeetingModal />, { wrapper: Wrapper });

    await userEvent.type(
      screen.getByRole('textbox', { name: /title/i }),
      'My Meeting',
    );

    subject.next('nic.schedule.meeting.submit');

    await waitFor(() => {
      expect(widgetApi.closeModal).toHaveBeenLastCalledWith({
        meeting: {
          description: '',
          endTime: '2022-01-02T14:15:00.000Z',
          participants: ['@user-id:example.com'],
          startTime: '2022-01-02T13:15:00.000Z',
          title: 'My Meeting',
          widgetIds: ['widget-1', 'widget-2'],
        },
        type: 'nic.schedule.meeting.submit',
      });
    });
  });

  it('should edit existing meeting', async () => {
    const subject = new Subject<string>();
    widgetApi.getWidgetConfig.mockReturnValue({
      data: { meeting: mockMeeting() },
    } as WidgetConfig<ScheduleMeetingModalRequest>);
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<ScheduleMeetingModal />, { wrapper: Wrapper });

    const titleTextbox = screen.getByRole('textbox', { name: /title/i });

    expect(titleTextbox).toHaveValue('An important meeting');

    await userEvent.clear(titleTextbox);
    await userEvent.type(titleTextbox, 'My Meeting');

    subject.next('nic.schedule.meeting.submit');

    await waitFor(() => {
      expect(widgetApi.closeModal).toHaveBeenLastCalledWith({
        meeting: {
          description: 'A brief description',
          endTime: '2999-01-01T14:00:00.000Z',
          participants: ['@user-id:example.com'],
          startTime: '2999-01-01T10:00:00.000Z',
          title: 'My Meeting',
          widgetIds: [],
        },
        type: 'nic.schedule.meeting.submit',
      });
    });
  });

  it('should edit existing recurring meeting instance', async () => {
    const subject = new Subject<string>();
    widgetApi.getWidgetConfig.mockReturnValue({
      data: {
        meeting: mockMeeting({
          content: {
            startTime: '2999-01-02T10:00:00Z',
            endTime: '2999-01-02T14:00:00Z',
            recurrenceId: '2999-01-02T10:00:00Z',
            calendarEntries: mockCalendar({
              dtstart: '29990101T100000',
              dtend: '29990101T140000',
              rrule: 'FREQ=DAILY',
            }),
          },
        }),
      },
    } as WidgetConfig<ScheduleMeetingModalRequest>);
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<ScheduleMeetingModal />, { wrapper: Wrapper });

    const recurrenceAlert = screen.getByRole('status');
    expect(
      within(recurrenceAlert).getByRole('checkbox', {
        name: 'Edit the recurring meeting series',
        checked: false,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole('textbox', { name: /title/i })).toBeDisabled();

    const endTimeTextbox = screen.getByRole('textbox', { name: 'End time' });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(endTimeTextbox, { target: { value: '08:00 PM' } });

    subject.next('nic.schedule.meeting.submit');

    await waitFor(() => {
      expect(widgetApi.closeModal).toHaveBeenLastCalledWith({
        meeting: {
          description: 'A brief description',
          endTime: '2999-01-02T20:00:00.000Z',
          participants: ['@user-id:example.com'],
          startTime: '2999-01-02T10:00:00.000Z',
          title: 'An important meeting',
          widgetIds: [],
          recurrenceId: '2999-01-02T10:00:00Z',
        },
        type: 'nic.schedule.meeting.submit',
      });
    });
  });

  it('should edit existing recurring meeting', async () => {
    const subject = new Subject<string>();
    widgetApi.getWidgetConfig.mockReturnValue({
      data: {
        meeting: mockMeeting({
          content: {
            startTime: '2999-01-02T10:00:00Z',
            endTime: '2999-01-02T14:00:00Z',
            recurrenceId: '2999-01-02T10:00:00Z',
            calendarEntries: mockCalendar({
              dtstart: '29990101T100000',
              dtend: '29990101T140000',
              rrule: 'FREQ=DAILY',
            }),
          },
        }),
      },
    } as WidgetConfig<ScheduleMeetingModalRequest>);
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<ScheduleMeetingModal />, { wrapper: Wrapper });

    const recurrenceAlert = screen.getByRole('status');
    await userEvent.click(
      within(recurrenceAlert).getByRole('checkbox', {
        name: 'Edit the recurring meeting series',
        checked: false,
      }),
    );

    expect(screen.getByRole('textbox', { name: /title/i })).toBeEnabled();

    const endTimeTextbox = screen.getByRole('textbox', { name: 'End time' });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(endTimeTextbox, { target: { value: '08:00 PM' } });

    subject.next('nic.schedule.meeting.submit');

    await waitFor(() => {
      expect(widgetApi.closeModal).toHaveBeenLastCalledWith({
        meeting: {
          description: 'A brief description',
          endTime: '2999-01-01T20:00:00.000Z',
          participants: ['@user-id:example.com'],
          startTime: '2999-01-01T10:00:00.000Z',
          title: 'An important meeting',
          widgetIds: [],
          rrule: 'FREQ=DAILY',
          recurrenceId: undefined,
        },
        type: 'nic.schedule.meeting.submit',
      });
    });
  });

  it('should disable submission if input is invalid', async () => {
    render(<ScheduleMeetingModal />, { wrapper: Wrapper });

    await userEvent.type(
      screen.getByRole('textbox', { name: /title/i }),
      'My Meeting',
    );

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'nic.schedule.meeting.submit',
      true,
    );

    // should disable button when required fields are missing
    await userEvent.clear(screen.getByRole('textbox', { name: /title/i }));

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'nic.schedule.meeting.submit',
      false,
    );
  });

  it('should abort the dialog when the cancel button is clicked', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<ScheduleMeetingModal />, { wrapper: Wrapper });

    subject.next('nic.schedule.meeting.cancel');

    await waitFor(() => {
      expect(widgetApi.closeModal).toBeCalledWith();
    });
  });
});

describe('getEditableInitialMeeting', () => {
  it.each([true, false])(
    'should return a undefined meeting with editRecurringSeries=%s',
    (editRecurringSeries) => {
      expect(getEditableInitialMeeting(undefined, editRecurringSeries)).toEqual(
        {
          key: 'edit-normal',
          editableInitialMeeting: undefined,
        },
      );
    },
  );

  it.each([true, false])(
    'should return a normal meeting with editRecurringSeries=%s',
    (editRecurringSeries) => {
      const meeting = mockMeeting();

      expect(getEditableInitialMeeting(meeting, editRecurringSeries)).toEqual({
        key: 'edit-normal',
        editableInitialMeeting: meeting,
      });
    },
  );

  it('should return the single recurrence entry meeting with editRecurringSeries=false', () => {
    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:00:00Z',
        endTime: '2999-01-02T14:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: mockCalendar({
          dtstart: '29990101T100000',
          dtend: '29990101T140000',
          rrule: 'FREQ=DAILY',
        }),
      },
    });

    expect(getEditableInitialMeeting(meeting, false)).toEqual({
      key: 'edit-normal',
      editableInitialMeeting: meeting,
    });
  });

  it('should return the recurrence entry meeting with editRecurringSeries=true', () => {
    const meeting = mockMeeting({
      content: {
        startTime: '2999-01-02T10:00:00Z',
        endTime: '2999-01-02T14:00:00Z',
        recurrenceId: '2999-01-02T10:00:00Z',
        calendarEntries: mockCalendar({
          dtstart: '29990101T100000',
          dtend: '29990101T140000',
          rrule: 'FREQ=DAILY',
        }),
      },
    });

    expect(getEditableInitialMeeting(meeting, true)).toEqual({
      key: 'edit-series',
      editableInitialMeeting: mockMeeting({
        content: {
          calendarEntries: mockCalendar({
            dtstart: '29990101T100000',
            dtend: '29990101T140000',
            rrule: 'FREQ=DAILY',
          }),
          recurrenceId: undefined,
        },
      }),
    });
  });
});
