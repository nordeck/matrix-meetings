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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
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
  mockCalendarEntry,
  mockConfigEndpoint,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
} from '../../../lib/testUtils';
import { Meeting } from '../../../reducer/meetingsApi';
import { createStore } from '../../../store';
import { MeetingCardShareMeetingContent } from './MeetingCardShareMeetingContent';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual<typeof import('@matrix-widget-toolkit/api')>(
    '@matrix-widget-toolkit/api',
  )),
  extractWidgetApiParameters: vi.fn(),
}));

const extractWidgetApiParameters = vi.mocked(extractWidgetApiParametersMocked);

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingCardShareMeetingContent/>', () => {
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
      const [store] = useState(() => createStore({ widgetApi }));
      return (
        <Provider store={store}>
          <WidgetApiMockProvider value={widgetApi}>
            {children}
          </WidgetApiMockProvider>
        </Provider>
      );
    };
  });

  it('should render without exploding', async () => {
    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = screen.getByRole('list', { name: /share meeting/i });

    expect(
      within(list).getByRole('button', { name: /share meeting link/i }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole('button', { name: /share by email/i }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole('button', { name: /download ics file/i }),
    ).toBeInTheDocument();

    const dialInItem = within(list).getByRole('button', {
      name: /share dial-in number/i,
    });
    await expect(
      within(dialInItem).findByText(/No dial-in information available/i),
    ).resolves.toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingCardShareMeetingContent meeting={meeting} />,
      { wrapper: Wrapper },
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should have accessible description', () => {
    render(
      <>
        <p id="title-id">Example Context</p>
        <MeetingCardShareMeetingContent
          aria-describedby="title-id"
          meeting={meeting}
        />
      </>,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', { name: /share meeting link/i }),
    ).toHaveAccessibleDescription(/example context/i);
    expect(
      screen.getByRole('button', { name: /share dial-in number/i }),
    ).toHaveAccessibleDescription(/example context/i);
    expect(
      screen.getByRole('button', { name: /share by email/i }),
    ).toHaveAccessibleDescription(/example context/i);
    expect(
      screen.getByRole('button', { name: /download ics file/i }),
    ).toHaveAccessibleDescription(/example context/i);
  });

  it('should show warning if meeting is an invitation', () => {
    meeting.participants[0].membership = 'invite';

    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      /please accept the meeting invitation to see all the details/i,
    );
  });

  it('should open the meeting link dialog', async () => {
    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = screen.getByRole('list', { name: /share meeting/i });

    await userEvent.click(
      within(list).getByRole('button', { name: /share meeting link/i }),
    );

    const dialog = screen.getByRole('dialog', {
      name: /share the link to the meeting room/i,
    });

    expect(
      within(dialog).getByRole('textbox', { name: /meeting link/i }),
    ).toBeInTheDocument();

    expect(within(dialog).queryByRole('status')).not.toBeInTheDocument();
  });

  it('should warn the user when sharing a link that the meeting is recurring', async () => {
    meeting.calendarEntries = [
      mockCalendarEntry({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
        rrule: 'FREQ=DAILY',
      }),
    ];
    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = screen.getByRole('list', { name: /share meeting/i });

    await userEvent.click(
      within(list).getByRole('button', { name: /share meeting link/i }),
    );

    const dialog = screen.getByRole('dialog', {
      name: /share the link to the meeting room/i,
    });

    expect(within(dialog).getByRole('status')).toHaveTextContent(
      /This is a link to a meeting series. Sharing this link invites users to all meetings in the series./i,
    );
  });

  it('should open the dial in number', async () => {
    mockConfigEndpoint(server, { jitsiDialInEnabled: true });
    mockMeetingSharingInformationEndpoint(server, {
      jitsi_dial_in_number: '0123',
      jitsi_pin: 5555,
    });

    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /share meeting/i });

    const listItem = await within(list).findByRole('button', {
      name: /share dial-in number/i,
    });

    await waitFor(() => {
      expect(listItem).not.toHaveAttribute('aria-disabled', 'true');
    });

    await userEvent.click(
      await within(list).findByRole('button', {
        name: /share dial-in number/i,
      }),
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Invite more people',
    });

    expect(
      within(dialog).getByRole('textbox', { name: /dial-in number/i }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('textbox', { name: /dial-in pin/i }),
    ).toBeInTheDocument();

    expect(within(dialog).queryByRole('status')).not.toBeInTheDocument();
  });

  it('should warn the user when sharing a dial in number that the meeting is recurring', async () => {
    meeting.calendarEntries = [
      mockCalendarEntry({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
        rrule: 'FREQ=DAILY',
      }),
    ];
    mockConfigEndpoint(server, { jitsiDialInEnabled: true });
    mockMeetingSharingInformationEndpoint(server, {
      jitsi_dial_in_number: '0123',
      jitsi_pin: 5555,
    });

    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /share meeting/i });

    const listItem = await within(list).findByRole('button', {
      name: /share dial-in number/i,
    });

    await waitFor(() => {
      expect(listItem).not.toHaveAttribute('aria-disabled', 'true');
    });

    await userEvent.click(
      await within(list).findByRole('button', {
        name: /share dial-in number/i,
      }),
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Invite more people',
    });

    expect(within(dialog).getByRole('status')).toHaveTextContent(
      /This is a dial-in number to a meeting series. Sharing this dail-in number invites users to all meetings in the series./i,
    );
  });

  it('should show error for the dial in number', async () => {
    server.use(
      rest.get('http://localhost/v1/config', (_, res, ctx) =>
        res(ctx.status(500)),
      ),
    );

    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /share meeting/i });

    const listItem = await within(list).findByRole('button', {
      name: /share dial-in number/i,
    });

    await expect(
      within(listItem).findByText(
        /error while requesting the dial-in information/i,
      ),
    ).resolves.toBeInTheDocument();

    expect(listItem).toHaveAttribute('aria-disabled', 'true');
  });

  it('should open the email dialog', async () => {
    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
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
    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
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
    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
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
    render(<MeetingCardShareMeetingContent meeting={meeting} />, {
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
