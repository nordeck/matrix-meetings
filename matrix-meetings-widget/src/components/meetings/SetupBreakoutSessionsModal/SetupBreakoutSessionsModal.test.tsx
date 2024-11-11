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
  mockMeeting,
  mockRoomMember,
  mockWidgetEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { SetupBreakoutSessionsModal } from './SetupBreakoutSessionsModal';
import { SetupBreakoutSessionsModalData } from './types';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<SetupBreakoutSessionsModal>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockWidgetEndpoint(server);

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        room_id: '!meeting-room-id',
        state_key: '@another-user-id',
      }),
    );

    vi.spyOn(Date, 'now').mockImplementation(
      () => +new Date('2022-01-02T13:10:00.000Z'),
    );

    widgetApi.getWidgetConfig.mockReturnValue({
      data: {
        parentMeeting: mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-02T14:00:00.000Z',
          },
        }),
      },
    } as WidgetConfig<SetupBreakoutSessionsModalData>);

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

  it('should schedule a breakout session on submit', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<SetupBreakoutSessionsModal />, { wrapper: Wrapper });

    await waitFor(
      () => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(),
      { timeout: 10000 },
    );

    subject.next('nic.schedule.breakoutsessions.submit');

    await waitFor(() => {
      expect(widgetApi.closeModal).toHaveBeenLastCalledWith({
        breakoutSessions: {
          description: '',
          endTime: '2022-01-02T13:30:00.000Z',
          startTime: '2022-01-02T13:15:00.000Z',
          groups: [{ participants: ['@user-id'], title: 'Group 1' }],
          widgetIds: ['widget-1', 'widget-2'],
        },
        type: 'nic.schedule.breakoutsessions.submit',
      });
    });
  }, 10000);

  it('should disable submission if input is invalid', async () => {
    render(<SetupBreakoutSessionsModal />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(),
    );

    const groupTitleTextbox = screen.getByRole('textbox', {
      name: 'Group title (required)',
    });

    await userEvent.clear(groupTitleTextbox);

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'nic.schedule.breakoutsessions.submit',
      false,
    );

    // should enable button when required fields are available again
    await userEvent.type(groupTitleTextbox, 'My Group');

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'nic.schedule.breakoutsessions.submit',
      true,
    );
  });

  it('should abort the dialog when the cancel button is clicked', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<SetupBreakoutSessionsModal />, { wrapper: Wrapper });

    subject.next('nic.schedule.breakoutsessions.cancel');

    await waitFor(() => {
      expect(widgetApi.closeModal).toBeCalledWith();
    });
  });
});
