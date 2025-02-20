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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MockedWidgetApi, mockWidgetApi } from '../../../lib/mockWidgetApi';
import {
  mockCalendar,
  mockConfigEndpoint,
  mockCreateMeetingRoom,
  mockMeetingSharingInformationEndpoint,
  mockNordeckMeetingMetadataEvent,
  mockWidgetEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { CockpitPanel } from './CockpitPanel';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual('@matrix-widget-toolkit/api')),
  extractWidgetApiParameters: vi.fn(),
}));

const extractWidgetApiParameters = vi.mocked(extractWidgetApiParametersMocked);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi({ roomId: '!meeting-room-id' })));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('<CockpitPanel>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockCreateMeetingRoom(widgetApi);

    mockWidgetEndpoint(server);
    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);

    extractWidgetApiParameters.mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    vi.spyOn(Date, 'now').mockImplementation(
      () => +new Date('2022-01-02T13:10:00.000Z'),
    );

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

  it('should render without exploding', async () => {
    render(<CockpitPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('heading', { name: 'An important meeting', level: 3 }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText('January 1, 2999, 10:00 AM – 2:00 PM'),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<CockpitPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('heading', { name: 'An important meeting' }),
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should display upcoming recurring meeting', async () => {
    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: mockCalendar({
            dtstart: '20220101T150000',
            dtend: '20220101T160000',
            rrule: 'FREQ=DAILY',
          }),
        },
      }),
    );

    render(<CockpitPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('heading', { name: 'An important meeting', level: 3 }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText('January 2, 2022, 3:00 – 4:00 PM'),
    ).toBeInTheDocument();

    expect(screen.getByText('Every day')).toBeInTheDocument();
  });

  it('should display current recurring meeting if one is in progress', async () => {
    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: mockCalendar({
            dtstart: '20220101T130000',
            dtend: '20220101T140000',
            rrule: 'FREQ=DAILY',
          }),
        },
      }),
    );

    render(<CockpitPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('heading', { name: 'An important meeting', level: 3 }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText('January 2, 2022, 1:00 – 2:00 PM'),
    ).toBeInTheDocument();
  });

  it('should display last recurring meeting after the series has ended', async () => {
    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: {
          calendar: mockCalendar({
            dtstart: '20210101T130000',
            dtend: '20210101T140000',
            rrule: 'FREQ=DAILY;COUNT=5',
          }),
        },
      }),
    );

    render(<CockpitPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('heading', { name: 'An important meeting', level: 3 }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText('January 5, 2021, 1:00 – 2:00 PM'),
    ).toBeInTheDocument();
  });

  it('should navigate the parent room', async () => {
    render(<CockpitPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('heading', { name: 'An important meeting' }),
    ).resolves.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /back to parent room/i }),
    );

    expect(widgetApi.navigateTo).toBeCalledWith('https://matrix.to/#/!room-id');
  });
});
