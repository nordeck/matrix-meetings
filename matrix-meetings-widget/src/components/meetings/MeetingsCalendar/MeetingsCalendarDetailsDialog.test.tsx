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
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import {
  mockCalendar,
  mockConfigEndpoint,
  mockCreateMeetingRoom,
  mockMeetingSharingInformationEndpoint,
  mockRoomTombstone,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { MeetingsCalendarDetailsDialog } from './MeetingsCalendarDetailsDialog';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual('@matrix-widget-toolkit/api')),
  extractWidgetApiParameters: vi.fn(),
}));

vi.mock('@mui/material/useMediaQuery');

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingsCalendarDetailsDialog/>', () => {
  const onClose = vi.fn();

  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    vi.mocked(extractWidgetApiParameters).mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);

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

  // Disabled during Vite migration. For some reason snapshot tests are broken.
  // @todo fix snapshot tests and enable test again
  it.skip('should render nothing if no meeting is passed', () => {
    const { baseElement } = render(
      <MeetingsCalendarDetailsDialog meetingId={undefined} onClose={onClose} />,
      { wrapper: Wrapper },
    );

    expect(baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `);
  });

  it('should render without exploding', async () => {
    render(
      <MeetingsCalendarDetailsDialog
        meetingId={{
          meetingId: '!meeting-room-id',
          uid: 'entry-0',
          recurrenceId: undefined,
        }}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'An important meeting',
      description: 'January 1, 2999, 10:00 AM – 2:00 PM',
    });

    expect(
      within(dialog).getByRole('heading', {
        name: 'An important meeting',
        level: 3,
      }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByText(/^January 1, 2999, 10:00 AM – 2:00 PM$/),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Join' }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Edit' }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Delete' }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Share by email' }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Download ICS File' }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('listitem', { name: 'Alice' }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('link', {
        name: 'http://element.local/#/room/!meeting-room-id',
      }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingsCalendarDetailsDialog
        meetingId={{
          meetingId: '!meeting-room-id',
          uid: 'entry-0',
          recurrenceId: undefined,
        }}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('dialog', {
        name: 'An important meeting',
        description: 'January 1, 2999, 10:00 AM – 2:00 PM',
      }),
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should show a specific recurrence-id', async () => {
    mockCreateMeetingRoom(widgetApi, {
      metadata: {
        calendar: mockCalendar({
          dtstart: '29990101T100000',
          dtend: '29990101T140000',
          rrule: 'FREQ=DAILY',
        }),
      },
    });

    render(
      <MeetingsCalendarDetailsDialog
        meetingId={{
          meetingId: '!meeting-room-id',
          uid: 'entry-0',
          recurrenceId: '2999-01-10T10:00:00Z',
        }}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'An important meeting',
      description: 'January 10, 2999, 10:00 AM – 2:00 PM',
    });

    expect(
      within(dialog).getByRole('heading', {
        name: 'An important meeting',
        level: 3,
      }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByText(/^January 10, 2999, 10:00 AM – 2:00 PM$/),
    ).toBeInTheDocument();

    expect(within(dialog).getByText('Every day')).toBeInTheDocument();
  });

  it('should handle closing', async () => {
    render(
      <MeetingsCalendarDetailsDialog
        meetingId={{
          meetingId: '!meeting-room-id',
          uid: 'entry-0',
          recurrenceId: undefined,
        }}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'An important meeting',
      description: 'January 1, 2999, 10:00 AM – 2:00 PM',
    });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Close' }),
    );

    expect(onClose).toBeCalled();
  });

  it('should close if the meeting is deleted', async () => {
    render(
      <MeetingsCalendarDetailsDialog
        meetingId={{
          meetingId: '!meeting-room-id',
          uid: 'entry-0',
          recurrenceId: undefined,
        }}
        onClose={onClose}
      />,
      { wrapper: Wrapper },
    );

    await screen.findByRole('dialog', {
      name: 'An important meeting',
      description: 'January 1, 2999, 10:00 AM – 2:00 PM',
    });

    widgetApi.mockSendStateEvent(
      mockRoomTombstone({ room_id: '!meeting-room-id' }),
    );

    await waitFor(() => {
      expect(onClose).toBeCalled();
    });
  });
});
