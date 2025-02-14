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

import { getEnvironment as getEnvironmentMocked } from '@matrix-widget-toolkit/mui';
import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { MockedWidgetApi, mockWidgetApi } from '../../../lib/mockWidgetApi';
import {
  mockMeeting,
  mockPowerLevelsEvent,
  mockRoomMember,
} from '../../../lib/testUtils';
import { Meeting, MeetingParticipant } from '../../../reducer/meetingsApi';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import {
  MeetingCardEditParticipantsContent,
  sortByNameAndStatus,
} from './MeetingCardEditParticipantsContent';

jest.mock('@matrix-widget-toolkit/mui', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/mui'),
  getEnvironment: jest.fn(),
}));

const getEnvironment = jest.mocked(getEnvironmentMocked);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingCardEditParticipantsContent/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let meeting: Meeting;

  beforeEach(() => {
    getEnvironment.mockImplementation(
      jest.requireActual('@matrix-widget-toolkit/mui').getEnvironment,
    );

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: { '@user-id': 100 },
          users_default: 0,
        },
        room_id: '!meeting-room-id',
      }),
    );

    const user1 = widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id',
        content: { displayname: 'User 1', membership: 'join' },
      }),
    );
    const user2 = widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id-2',
        content: { displayname: 'User 2', membership: 'invite' },
      }),
    );

    meeting = mockMeeting({
      content: {
        participants: [
          {
            userId: '@user-id',
            displayName: 'User 1',
            membership: 'join',
            rawEvent: user1,
          },
          {
            userId: '@user-id-2',
            displayName: 'User 2',
            membership: 'invite',
            rawEvent: user2,
          },
        ],
      },
    });

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });
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
    render(<MeetingCardEditParticipantsContent meeting={meeting} />, {
      wrapper: Wrapper,
    });

    const list = screen.getByRole('list', { name: /participants/i });

    const item1 = within(list).getByRole('listitem', { name: /user 1/i });
    expect(item1).toHaveAccessibleDescription(/accepted/i);
    expect(within(item1).getByText(/user 1/i)).toBeInTheDocument();
    expect(within(item1).getByText(/accepted/i)).toBeInTheDocument();
    expect(within(item1).getByTestId('CheckIcon')).toBeInTheDocument();

    const item2 = within(list).getByRole('listitem', { name: /user 2/i });
    expect(item2).toHaveAccessibleDescription(/invited/i);
    expect(within(item2).getByText(/user 2/i)).toBeInTheDocument();
    expect(within(item2).getByText(/invited/i)).toBeInTheDocument();
    expect(within(item2).getByTestId('QuestionMarkIcon')).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingCardEditParticipantsContent meeting={meeting} />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('sortByNameAndStatus', () => {
  it('should sort the member list', () => {
    const members: MeetingParticipant[] = [
      {
        userId: '@user-3',
        displayName: 'Dave',
        membership: 'invite',
        rawEvent: mockRoomMember(),
      },
      {
        userId: '@user-0',
        displayName: 'Alice',
        membership: 'invite',
        rawEvent: mockRoomMember(),
      },
      {
        userId: '@user-2',
        displayName: 'Charlie',
        membership: 'join',
        rawEvent: mockRoomMember(),
      },
      {
        userId: '@user-5',
        displayName: 'Faythe',
        membership: 'invite',
        rawEvent: mockRoomMember(),
      },
      {
        userId: '@user-1',
        displayName: 'Bob',
        membership: 'join',
        rawEvent: mockRoomMember(),
      },
    ];

    expect(members.sort(sortByNameAndStatus)).toEqual([
      {
        userId: '@user-1',
        displayName: 'Bob',
        membership: 'join',
        rawEvent: mockRoomMember(),
      },
      {
        userId: '@user-2',
        displayName: 'Charlie',
        membership: 'join',
        rawEvent: mockRoomMember(),
      },
      {
        userId: '@user-0',
        displayName: 'Alice',
        membership: 'invite',
        rawEvent: mockRoomMember(),
      },
      {
        userId: '@user-3',
        displayName: 'Dave',
        membership: 'invite',
        rawEvent: mockRoomMember(),
      },
      {
        userId: '@user-5',
        displayName: 'Faythe',
        membership: 'invite',
        rawEvent: mockRoomMember(),
      },
    ]);
  });
});
