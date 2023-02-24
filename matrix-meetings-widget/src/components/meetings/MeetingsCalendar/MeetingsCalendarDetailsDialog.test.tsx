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
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  mockCalendar,
  mockCreateMeetingRoom,
  mockRoomTombstone,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { MeetingsCalendarDetailsDialog } from './MeetingsCalendarDetailsDialog';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  extractWidgetApiParameters: jest.fn(),
}));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingsCalendarDetailsDialog/>', () => {
  const onClose = jest.fn();

  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
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

  it('should render nothing if no meeting is passed', async () => {
    const { baseElement } = render(
      <MeetingsCalendarDetailsDialog meetingId={undefined} onClose={onClose} />,
      { wrapper: Wrapper }
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
      { wrapper: Wrapper }
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'An important meeting',
      description: /^Jan 1, 2999(,| at) 10:00 AM – 2:00 PM$/,
    });
    expect(
      within(dialog).getByRole('heading', {
        name: 'An important meeting',
        level: 3,
      })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/^Jan 1, 2999(,| at) 10:00 AM – 2:00 PM$/)
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
      { wrapper: Wrapper }
    );

    await expect(
      screen.findByRole('dialog', {
        name: 'An important meeting',
        description: /^Jan 1, 2999(,| at) 10:00 AM – 2:00 PM$/,
      })
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
      { wrapper: Wrapper }
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'An important meeting',
      description:
        /^Jan 10, 2999(,| at) 10:00 AM – 2:00 PM . Recurrence: Every day$/,
    });
    expect(
      within(dialog).getByRole('heading', {
        name: 'An important meeting',
        level: 3,
      })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/^Jan 10, 2999(,| at) 10:00 AM – 2:00 PM$/)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('. Recurrence: Every day')
    ).toBeInTheDocument();
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
      { wrapper: Wrapper }
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'An important meeting',
      description: /^Jan 1, 2999(,| at) 10:00 AM – 2:00 PM$/,
    });

    userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

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
      { wrapper: Wrapper }
    );

    await screen.findByRole('dialog', {
      name: 'An important meeting',
      description: /^Jan 1, 2999(,| at) 10:00 AM – 2:00 PM$/,
    });

    widgetApi.mockSendStateEvent(
      mockRoomTombstone({ room_id: '!meeting-room-id' })
    );

    await waitFor(() => {
      expect(onClose).toBeCalled();
    });
  });
});
