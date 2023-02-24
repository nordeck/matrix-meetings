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

import {
  RoomMemberStateEventContent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { MemberSelectionDropdown } from '.';
import { mockPowerLevelsEvent, mockRoomMember } from '../../../lib/testUtils';
import { createStore, initializeStore } from '../../../store/store';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MemberSelectionDropdown/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let allMemberEvents: StateEvent<RoomMemberStateEventContent>[];

  beforeEach(() => {
    allMemberEvents = [
      widgetApi.mockSendStateEvent(mockRoomMember()),
      widgetApi.mockSendStateEvent(
        mockRoomMember({
          state_key: '@user-1',
          content: { displayname: undefined },
        })
      ),
    ];

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      }, []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should render without exploding', () => {
    render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents}
        label="Members"
        onSelectedMembersUpdated={jest.fn()}
        ownUserPopupContent="This is you"
        selectedMembers={['@user-id']}
      />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByRole('combobox', {
        name: 'Members',
        description: /1 of 2 entries selected./,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Alice',
        description: 'This is you',
      })
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents}
        label="Members"
        onSelectedMembersUpdated={jest.fn()}
        ownUserPopupContent="This is you"
        selectedMembers={['@user-id']}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should add own member', () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
        selectedMembers={[]}
      />,
      { wrapper: Wrapper }
    );

    userEvent.click(
      screen.getByRole('combobox', { name: 'Members', expanded: false })
    );
    userEvent.click(screen.getByRole('option', { name: '@user-1' }));

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id', '@user-1']);
  });

  it('should not duplicate own member', () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
        selectedMembers={['@user-id']}
      />,
      { wrapper: Wrapper }
    );

    userEvent.click(
      screen.getByRole('combobox', { name: 'Members', expanded: false })
    );
    userEvent.click(screen.getByRole('option', { name: '@user-1' }));

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id', '@user-1']);
  });

  it('should not add own member if member event is missing', () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents.slice(1)}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
        selectedMembers={[]}
      />,
      { wrapper: Wrapper }
    );

    userEvent.click(
      screen.getByRole('combobox', { name: 'Members', expanded: false })
    );
    userEvent.click(screen.getByRole('option', { name: '@user-1' }));

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-1']);
  });

  it('should remove member', () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
        selectedMembers={['@user-id', '@user-1']}
      />,
      { wrapper: Wrapper }
    );

    userEvent.type(
      screen.getByRole('button', {
        name: '@user-1',
        description: /Use the backspace key/,
      }),
      '{Backspace}'
    );

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id']);
  });

  it('should not remove own member', () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
        selectedMembers={['@user-id', '@user-1']}
      />,
      { wrapper: Wrapper }
    );

    const combobox = screen.getByRole('combobox', { name: 'Members' });
    userEvent.type(combobox, '{Backspace}');
    userEvent.type(combobox, '{Backspace}');

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id']);
  });

  it('should not remove member with higher power level', async () => {
    const onUpdate = jest.fn();

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-1',
        content: { displayname: undefined },
        room_id: '!meeting-room-id',
      })
    );

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: { '@user-1': 101 },
          users_default: 0,
        },
        room_id: '!meeting-room-id',
      })
    );

    render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents}
        hasPowerToKickPopupContent="user has higher power level"
        label="Members"
        meetingId="!meeting-room-id"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
        selectedMembers={['@user-id', '@user-1']}
      />,
      { wrapper: Wrapper }
    );

    const combobox = screen.getByRole('combobox', { name: 'Members' });

    expect(
      await screen.findByRole('button', {
        name: '@user-1',
        description: 'user has higher power level',
      })
    ).toBeInTheDocument();
    userEvent.type(combobox, '{Backspace}');
    userEvent.type(combobox, '{Backspace}');

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id', '@user-1']);
  });

  it('should be able to remove the member with higher power level if he has not joined the room yet', async () => {
    const onUpdate = jest.fn();

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-1',
        content: { displayname: undefined },
        room_id: '!meeting-room-id',
      })
    );

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: { '@user-1': 101 },
          users_default: 0,
        },
        room_id: '!meeting-room-id',
      })
    );

    render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents}
        hasPowerToKickPopupContent="user has higher power level"
        label="Members"
        meetingId="!meeting-room-id"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
        selectedMembers={['@user-id', '@user-1']}
      />,
      { wrapper: Wrapper }
    );

    await expect(
      screen.findByRole('button', {
        name: '@user-1',
        description: 'user has higher power level',
      })
    ).resolves.toBeInTheDocument();

    // remove user from the room
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-1',
        content: { displayname: undefined, membership: 'leave' },
        room_id: '!meeting-room-id',
      })
    );

    await expect(
      screen.findByRole('button', {
        name: '@user-1',
        description: 'Use the backspace key to delete the entry.',
      })
    ).resolves.toBeInTheDocument();

    const combobox = screen.getByRole('combobox', { name: 'Members' });
    userEvent.type(combobox, '{Backspace}');

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id']);
  });

  it('should show selected users even if they are not part of the selectableMemberEvents', () => {
    render(
      <MemberSelectionDropdown
        allMemberEvents={allMemberEvents}
        label="Members"
        onSelectedMembersUpdated={jest.fn()}
        ownUserPopupContent="This is you"
        selectableMemberEvents={allMemberEvents.slice(1)}
        selectedMembers={['@user-id', '@user-1']}
      />,
      { wrapper: Wrapper }
    );

    userEvent.click(
      screen.getByRole('button', { name: 'Alice', description: 'This is you' })
    );
    userEvent.click(screen.getByRole('button', { name: '@user-1' }));
  });
});
