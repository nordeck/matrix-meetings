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

import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { MemberSelectionDropdown } from '.';
import { MockedWidgetApi, mockWidgetApi } from '../../../lib/mockWidgetApi';
import { mockPowerLevelsEvent, mockRoomMember } from '../../../lib/testUtils';
import { createStore, initializeStore } from '../../../store/store';
import { MemberSelection } from './MemberSelectionDropdown';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MemberSelectionDropdown/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let allMembers: MemberSelection[];

  beforeEach(() => {
    allMembers = [
      widgetApi.mockSendStateEvent(mockRoomMember()),
      widgetApi.mockSendStateEvent(
        mockRoomMember({
          state_key: '@user-1',
          content: { displayname: undefined },
        }),
      ),
    ].map((m) => ({
      userId: m.state_key,
      displayName: m.content.displayname ?? undefined,
      avatarUrl: m.content.avatar_url ?? undefined,
    }));

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
        availableMembers={allMembers}
        selectedMembers={allMembers.filter((se) => se.userId === '@user-id')}
        label="Members"
        onSelectedMembersUpdated={jest.fn()}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('combobox', {
        name: 'Members',
        description: /1 of 2 entries selected./,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Alice',
        description: 'This is you',
      }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MemberSelectionDropdown
        availableMembers={allMembers}
        selectedMembers={allMembers.filter((se) => se.userId === '@user-id')}
        label="Members"
        onSelectedMembersUpdated={jest.fn()}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should add own member', async () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        availableMembers={allMembers}
        selectedMembers={[]}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Members', expanded: false }),
    );
    await userEvent.click(screen.getByRole('option', { name: '@user-1' }));

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id', '@user-1']);
  });

  it('should not duplicate own member', async () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        availableMembers={allMembers}
        selectedMembers={allMembers.filter((se) => se.userId === '@user-id')}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Members', expanded: false }),
    );
    await userEvent.click(screen.getByRole('option', { name: '@user-1' }));

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id', '@user-1']);
  });

  it('should not add own member if member event is missing', async () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        availableMembers={allMembers.slice(1)}
        selectedMembers={[]}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Members', expanded: false }),
    );
    await userEvent.click(screen.getByRole('option', { name: '@user-1' }));

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-1']);
  });

  it('should remove member', async () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        availableMembers={allMembers}
        selectedMembers={allMembers}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.type(
      screen.getByRole('button', {
        name: '@user-1',
        description: /Use the backspace key/,
      }),
      '{Backspace}',
    );

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id']);
  });

  it('should not remove own member', async () => {
    const onUpdate = jest.fn();

    render(
      <MemberSelectionDropdown
        availableMembers={allMembers}
        selectedMembers={allMembers}
        label="Members"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    const combobox = screen.getByRole('combobox', { name: 'Members' });
    await userEvent.type(combobox, '{Backspace}');
    await userEvent.type(combobox, '{Backspace}');

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id']);
  });

  it('should not remove member with higher power level', async () => {
    const onUpdate = jest.fn();

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-1',
        content: { displayname: undefined },
        room_id: '!meeting-room-id',
      }),
    );

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: { '@user-1': 101 },
          users_default: 0,
        },
        room_id: '!meeting-room-id',
      }),
    );

    render(
      <MemberSelectionDropdown
        availableMembers={allMembers}
        selectedMembers={allMembers}
        hasPowerToKickPopupContent="user has higher power level"
        label="Members"
        meetingId="!meeting-room-id"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    const combobox = screen.getByRole('combobox', { name: 'Members' });

    expect(
      await screen.findByRole('button', {
        name: '@user-1',
        description: 'user has higher power level',
      }),
    ).toBeInTheDocument();
    await userEvent.type(combobox, '{Backspace}');
    await userEvent.type(combobox, '{Backspace}');

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id', '@user-1']);
  });

  it('should be able to remove the member with higher power level if he has not joined the room yet', async () => {
    const onUpdate = jest.fn();

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-1',
        content: { displayname: undefined },
        room_id: '!meeting-room-id',
      }),
    );

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: { '@user-1': 101 },
          users_default: 0,
        },
        room_id: '!meeting-room-id',
      }),
    );

    render(
      <MemberSelectionDropdown
        availableMembers={allMembers}
        selectedMembers={allMembers}
        hasPowerToKickPopupContent="user has higher power level"
        label="Members"
        meetingId="!meeting-room-id"
        onSelectedMembersUpdated={onUpdate}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('button', {
        name: '@user-1',
        description: 'user has higher power level',
      }),
    ).resolves.toBeInTheDocument();

    // remove user from the room
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-1',
        content: { displayname: undefined, membership: 'leave' },
        room_id: '!meeting-room-id',
      }),
    );

    await expect(
      screen.findByRole('button', {
        name: '@user-1',
        description: 'Use the backspace key to delete the entry.',
      }),
    ).resolves.toBeInTheDocument();

    const combobox = screen.getByRole('combobox', { name: 'Members' });
    await userEvent.type(combobox, '{Backspace}');

    expect(onUpdate).toHaveBeenLastCalledWith(['@user-id']);
  });

  it('should show selected users even if they are not part of the selectableMemberEvents', async () => {
    render(
      <MemberSelectionDropdown
        availableMembers={allMembers.slice(1)}
        selectedMembers={allMembers}
        label="Members"
        onSelectedMembersUpdated={jest.fn()}
        ownUserPopupContent="This is you"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Alice', description: 'This is you' }),
    );
    await userEvent.click(screen.getByRole('button', { name: '@user-1' }));
  });

  it('should show a message if members could not be loaded', async () => {
    const { rerender } = render(
      <MemberSelectionDropdown
        availableMembers={[]}
        selectedMembers={[]}
        label="Members"
        onSelectedMembersUpdated={jest.fn()}
        ownUserPopupContent="This is you"
        loading
      />,
      { wrapper: Wrapper },
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();

    rerender(
      <MemberSelectionDropdown
        availableMembers={[]}
        selectedMembers={[]}
        label="Members"
        onSelectedMembersUpdated={jest.fn()}
        ownUserPopupContent="This is you"
        loading={false}
        error
      />,
    );

    expect(progressBar).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: 'Members' }));
    expect(
      screen.getByText(/Error while loading available users/),
    ).toBeInTheDocument();
  });
});
