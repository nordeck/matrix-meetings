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

import { extractWidgetApiParameters } from '@matrix-widget-toolkit/api';
import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { MockedWidgetApi, mockWidgetApi } from '../../../../lib/mockWidgetApi';
import {
  mockCalendar,
  mockConfigEndpoint,
  mockCreateMeetingRoom,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
} from '../../../../lib/testUtils';
import { createStore } from '../../../../store';
import { initializeStore } from '../../../../store/store';
import { MeetingDetailsContent } from './MeetingDetailsContent';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  extractWidgetApiParameters: jest.fn(),
}));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingDetailsContent/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);
    jest.mocked(extractWidgetApiParameters).mockReturnValue({
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
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should render without exploding', () => {
    render(
      <MeetingDetailsContent
        meeting={mockMeeting()}
        meetingTimeId="meeting-id"
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('heading', { level: 4, name: /Details/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 4, name: /Description/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 4, name: /Share meeting/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 4, name: /Participants/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: 'http://element.local/#/room/!meeting-room-id',
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('A brief description')).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingDetailsContent
        meeting={mockMeeting()}
        meetingTimeId="meeting-id"
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should show meeting with recurring rule', () => {
    render(
      <MeetingDetailsContent
        meeting={mockMeeting({
          room_id: '!meeting-room-id',
          content: {
            recurrenceId: '2999-01-02T10:00:00Z',
            calendarEntries: mockCalendar({
              dtstart: '29990101T100000',
              dtend: '29990101T140000',
              rrule: 'FREQ=DAILY',
            }),
          },
        })}
        meetingTimeId="meeting-id"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('Every day')).toBeInTheDocument();
  });

  it('should show hide description section if there is no description', () => {
    render(
      <MeetingDetailsContent
        meeting={mockMeeting({ content: { description: '' } })}
        meetingTimeId="meeting-id"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('should join meeting room by clicking the link', async () => {
    render(
      <MeetingDetailsContent
        meeting={mockMeeting({ content: { description: '' } })}
        meetingTimeId="meeting-id"
      />,
      { wrapper: Wrapper },
    );
    const link = screen.getByRole('link', {
      name: 'http://element.local/#/room/!meeting-room-id',
    });

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute(
      'href',
      'http://element.local/#/room/!meeting-room-id',
    );
  });
});
