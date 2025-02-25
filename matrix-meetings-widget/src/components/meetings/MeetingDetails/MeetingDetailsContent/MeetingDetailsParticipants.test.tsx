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
import { render, screen, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MockedWidgetApi, mockWidgetApi } from '../../../../lib/mockWidgetApi';
import {
  mockConfigEndpoint,
  mockCreateMeetingRoom,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
  mockWidgetEndpoint,
} from '../../../../lib/testUtils';
import { MeetingParticipant } from '../../../../reducer/meetingsApi';
import { createStore } from '../../../../store';
import { initializeStore } from '../../../../store/store';
import { MeetingDetailsParticipants } from './MeetingDetailsParticipants';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual('@matrix-widget-toolkit/api')),
  extractWidgetApiParameters: vi.fn(),
}));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingDetailsParticipants/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  const participants: MeetingParticipant[] = [
    {
      userId: '@user-id',
      displayName: 'Alice',
      membership: 'join',
      rawEvent: {
        type: 'm.room.member',
        sender: '@inviter-id',
        content: { membership: 'join', displayname: 'Alice' },
        state_key: '@user-id',
        origin_server_ts: 0,
        event_id: '$event-id-0',
        room_id: '!meeting-room-id',
      },
    },
    {
      userId: '@user-id-1',
      displayName: 'John',
      membership: 'invite',
      rawEvent: {
        type: 'm.room.member',
        sender: '@inviter-id',
        content: { membership: 'invite', displayname: 'John' },
        state_key: '@user-id-1',
        origin_server_ts: 0,
        event_id: '$event-id-0',
        room_id: '!meeting-room-id',
      },
    },
    {
      userId: '@user-id-2',
      displayName: 'Marly',
      membership: 'join',
      rawEvent: {
        type: 'm.room.member',
        sender: '@inviter-id',
        content: { membership: 'join', displayname: 'Marly' },
        state_key: '@user-id-2',
        origin_server_ts: 0,
        event_id: '$event-id-0',
        room_id: '!meeting-room-id',
      },
    },
  ];

  beforeEach(() => {
    vi.mocked(extractWidgetApiParameters).mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    mockWidgetEndpoint(server);
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

  it('should render without exploding', () => {
    render(
      <MeetingDetailsParticipants
        participants={participants}
        creator="@user-id"
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('heading', { level: 4, name: /Participants/i }),
    ).toBeInTheDocument();

    const list = screen.getByRole('list', { name: 'Participants' });

    const listItemAlice = within(list).getByRole('listitem', {
      name: /Alice/i,
    });

    expect(within(listItemAlice).getByText('Organizer')).toBeInTheDocument();

    const listItemMarly = within(list).getByRole('listitem', {
      name: /Marly/i,
    });

    expect(within(listItemMarly).getByText('Accepted')).toBeInTheDocument();

    const listItemJohn = within(list).getByRole('listitem', { name: /John/i });

    expect(within(listItemJohn).getByText('Invited')).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingDetailsParticipants
        participants={mockMeeting().participants}
        creator="@user-id"
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should just the participants list if the creator not in the room', () => {
    render(
      <MeetingDetailsParticipants
        participants={participants}
        creator="@user-id-3"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.queryByText('Organizer')).not.toBeInTheDocument();
  });
});
