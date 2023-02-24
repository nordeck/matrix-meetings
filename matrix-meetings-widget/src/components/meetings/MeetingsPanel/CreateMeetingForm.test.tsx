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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { ScheduleMeetingModalResult } from '../ScheduleMeetingModal';
import { CreateMeetingForm } from './CreateMeetingForm';

let widgetApi: MockedWidgetApi;

beforeEach(() => (widgetApi = mockWidgetApi()));

afterEach(() => widgetApi.stop());

describe('<CreateMeetingForm/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
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

  it('should render without exploding', () => {
    render(<CreateMeetingForm />, { wrapper: Wrapper });

    expect(
      screen.getByRole('button', { name: 'Schedule Meeting' })
    ).toBeInTheDocument();
  });

  it('should have not accessibility violations', async () => {
    const { container } = render(<CreateMeetingForm />, { wrapper: Wrapper });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should create new meeting', async () => {
    widgetApi.openModal.mockResolvedValue({
      type: 'nic.schedule.meeting.submit',
      meeting: {
        title: 'An important meeting',
        description: 'A brief description',
        startTime: '2999-01-01T10:00:00Z',
        endTime: '2999-01-01T14:00:00Z',
        participants: [],
        widgetIds: [],
        rrule: 'FREQ=DAILY',
      },
    } as ScheduleMeetingModalResult);

    render(<CreateMeetingForm />, { wrapper: Wrapper });

    const scheduleButton = screen.getByRole('button', {
      name: /schedule meeting/i,
    });

    userEvent.click(scheduleButton);

    expect(widgetApi.openModal).toBeCalledWith(
      '/schedule-meeting',
      'Schedule Meeting',
      {
        buttons: [
          {
            disabled: true,
            id: 'nic.schedule.meeting.submit',
            kind: 'm.primary',
            label: 'Create Meeting',
          },
          {
            id: 'nic.schedule.meeting.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
      }
    );

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.create',
        {
          context: expect.anything(),
          data: {
            title: 'An important meeting',
            description: 'A brief description',
            calendar: [
              {
                uid: expect.any(String),
                dtstart: { tzid: 'UTC', value: '29990101T100000' },
                dtend: { tzid: 'UTC', value: '29990101T140000' },
                rrule: 'FREQ=DAILY',
              },
            ],
            participants: [],
            widget_ids: [],
          },
        }
      );
    });
  });

  it('should skip the meeting creation if the user aborts the action', () => {
    render(<CreateMeetingForm />, { wrapper: Wrapper });

    const scheduleButton = screen.getByRole('button', {
      name: /schedule meeting/i,
    });

    userEvent.click(scheduleButton);

    expect(widgetApi.openModal).toBeCalledWith(
      '/schedule-meeting',
      'Schedule Meeting',
      {
        buttons: [
          {
            disabled: true,
            id: 'nic.schedule.meeting.submit',
            kind: 'm.primary',
            label: 'Create Meeting',
          },
          {
            id: 'nic.schedule.meeting.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
      }
    );

    expect(widgetApi.sendRoomEvent).not.toBeCalled();
  });
});
