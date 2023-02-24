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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { Subject } from 'rxjs';
import { mockMeeting, mockWidgetEndpoint } from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { ScheduleMeetingModalRequest } from './types';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<ScheduleMeetingModal>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockWidgetEndpoint(server);

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

  it('should schedule a meeting on submit', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<ScheduleMeetingModal />, { wrapper: Wrapper });

    userEvent.type(
      screen.getByRole('textbox', { name: /title/i }),
      'My Meeting'
    );

    subject.next('nic.schedule.meeting.submit');

    await waitFor(() => {
      expect(widgetApi.closeModal).toHaveBeenLastCalledWith({
        meeting: {
          description: '',
          endTime: '2022-01-02T14:15:00.000Z',
          participants: ['@user-id'],
          startTime: '2022-01-02T13:15:00.000Z',
          title: 'My Meeting',
          widgetIds: [],
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

    userEvent.type(titleTextbox, '{selectall}My Meeting');

    subject.next('nic.schedule.meeting.submit');

    await waitFor(() => {
      expect(widgetApi.closeModal).toHaveBeenLastCalledWith({
        meeting: {
          description: 'A brief description',
          endTime: '2999-01-01T14:00:00.000Z',
          participants: ['@user-id'],
          startTime: '2999-01-01T10:00:00.000Z',
          title: 'My Meeting',
          widgetIds: [],
        },
        type: 'nic.schedule.meeting.submit',
      });
    });
  });

  it('should disable submission if input is invalid', async () => {
    render(<ScheduleMeetingModal />, { wrapper: Wrapper });

    userEvent.type(
      screen.getByRole('textbox', { name: /title/i }),
      'My Meeting'
    );

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'nic.schedule.meeting.submit',
      true
    );

    // should disable button when required fields are missing
    userEvent.clear(screen.getByRole('textbox', { name: /title/i }));

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'nic.schedule.meeting.submit',
      false
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
