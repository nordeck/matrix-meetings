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
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  mockCalendarEntry,
  mockConfigEndpoint,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
} from '../../../../../lib/testUtils';
import { Meeting } from '../../../../../reducer/meetingsApi';
import { createStore } from '../../../../../store';
import { initializeStore } from '../../../../../store/store';
import { MeetingDetailsShare } from './MeetingDetailsShare';

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

describe('<MeetingDetailsShare/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let meeting: Meeting;

  beforeEach(() => {
    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);

    meeting = mockMeeting();

    extractWidgetApiParameters.mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

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

  it('should render without exploding', async () => {
    render(<MeetingDetailsShare meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = screen.getByRole('list', { name: /share meeting/i });

    expect(
      within(list).getByRole('button', { name: /share by email/i }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole('button', { name: /download ics file/i }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<MeetingDetailsShare meeting={meeting} />, {
      wrapper: Wrapper,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should open the email dialog', async () => {
    render(<MeetingDetailsShare meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = screen.getByRole('list', { name: /share meeting/i });

    await userEvent.click(
      within(list).getByRole('button', { name: /share by email/i }),
    );

    const dialog = screen.getByRole('dialog', {
      name: /share the meeting invitation/i,
    });

    expect(
      within(dialog).getByRole('textbox', { name: /message/i }),
    ).toBeInTheDocument();

    expect(within(dialog).queryByRole('status')).not.toBeInTheDocument();
  });

  it('should warn the user when sharing an email that the meeting is recurring', async () => {
    meeting.calendarEntries = [
      mockCalendarEntry({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
        rrule: 'FREQ=DAILY',
      }),
    ];
    render(<MeetingDetailsShare meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = screen.getByRole('list', { name: /share meeting/i });

    await userEvent.click(
      within(list).getByRole('button', { name: /share by email/i }),
    );

    const dialog = screen.getByRole('dialog', {
      name: /share the meeting invitation/i,
    });

    expect(within(dialog).getByRole('status')).toHaveTextContent(
      /This is an email invitation to a meeting series. Sharing this email invitation invites users to all meetings in the series./i,
    );
  });

  it('should open the ICS dialog', async () => {
    render(<MeetingDetailsShare meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = screen.getByRole('list', { name: /share meeting/i });

    await userEvent.click(
      within(list).getByRole('button', { name: /download ics file/i }),
    );

    const dialog = screen.getByRole('dialog', {
      name: /download a calendar file/i,
    });

    expect(
      within(dialog).getByRole('button', { name: /download/i }),
    ).toBeInTheDocument();
  });

  it('should warn the user when sharing an ics file that the meeting is recurring', async () => {
    meeting.calendarEntries = [
      mockCalendarEntry({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
        rrule: 'FREQ=DAILY',
      }),
    ];
    render(<MeetingDetailsShare meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = screen.getByRole('list', { name: /share meeting/i });

    await userEvent.click(
      within(list).getByRole('button', { name: /download ics file/i }),
    );

    const dialog = screen.getByRole('dialog', {
      name: /download a calendar file/i,
    });

    expect(within(dialog).getByRole('status')).toHaveTextContent(
      /This is an iCal file of a meeting series. Sharing this iCal file invites users to all meetings in the series./i,
    );
  });
});
