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
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockMeeting, mockRoomMember } from '../../../../lib/testUtils';
import { createStore, initializeStore } from '../../../../store/store';
import { BreakoutSessionGroupsForm } from './BreakoutSessionGroupsForm';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<BreakoutSessionGroupsForm>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({ room_id: '!meeting-room-id' }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        room_id: '!meeting-room-id',
        state_key: '@user-1',
        content: { displayname: undefined },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        room_id: '!meeting-room-id',
        state_key: '@user-2',
        content: { displayname: undefined },
      }),
    );

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
      <BreakoutSessionGroupsForm
        onGroupsChange={jest.fn()}
        parentMeeting={mockMeeting()}
      />,
      { wrapper: Wrapper },
    );

    const section = screen.getByRole('region', { name: 'Groups' });

    expect(
      within(section).getByRole('spinbutton', {
        name: 'Number of groups (required)',
      }),
    ).toHaveValue(1);

    const groupList = within(section).getByRole('list', { name: 'Groups' });
    expect(
      within(groupList).getByRole('listitem', {
        name: 'Group 1',
      }),
    ).toBeInTheDocument();
    expect(within(groupList).getAllByRole('listitem')).toHaveLength(1);
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <BreakoutSessionGroupsForm
        onGroupsChange={jest.fn()}
        parentMeeting={mockMeeting()}
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should adjust amount of groups', async () => {
    const onGroupsChange = jest.fn();
    render(
      <BreakoutSessionGroupsForm
        onGroupsChange={onGroupsChange}
        parentMeeting={mockMeeting()}
      />,
      { wrapper: Wrapper },
    );

    const section = screen.getByRole('region', { name: 'Groups' });

    // Wait first the loading is completed
    await expect(
      within(section).findByRole('status'),
    ).resolves.toHaveTextContent(
      /Some participants are not assigned to a group/,
    );

    await userEvent.type(
      within(section).getByRole('spinbutton', {
        name: 'Number of groups (required)',
      }),
      '{selectall}2',
    );

    expect(
      within(section).getByRole('spinbutton', {
        name: 'Number of groups (required)',
      }),
    ).toHaveValue(2);

    const groupList = within(section).getByRole('list', { name: 'Groups' });
    expect(
      within(groupList).getByRole('listitem', {
        name: 'Group 1',
      }),
    ).toBeInTheDocument();
    expect(
      within(groupList).getByRole('listitem', {
        name: 'Group 2',
      }),
    ).toBeInTheDocument();

    expect(onGroupsChange).toHaveBeenLastCalledWith([
      { members: ['@user-id'], title: 'Group 1' },
      { members: ['@user-id'], title: 'Group 2' },
    ]);
  });

  it('should distribute remaining members into groups', async () => {
    const onGroupsChange = jest.fn();
    render(
      <BreakoutSessionGroupsForm
        onGroupsChange={onGroupsChange}
        parentMeeting={mockMeeting()}
      />,
      { wrapper: Wrapper },
    );

    const section = screen.getByRole('region', { name: 'Groups' });

    // Wait first the loading is completed
    const alert = await within(section).findByRole('status');
    expect(alert).toHaveTextContent(
      /Some participants are not assigned to a group/,
    );

    await userEvent.click(
      within(section).getByRole('button', {
        name: 'Distribute all 2 participants',
      }),
    );

    expect(alert).not.toBeInTheDocument();
    expect(onGroupsChange).toHaveBeenLastCalledWith([
      {
        members: expect.arrayContaining(['@user-id', '@user-1', '@user-2']),
        title: 'Group 1',
      },
    ]);
  });

  it('should show an error if there are to many groups', async () => {
    const onGroupsChange = jest.fn();

    widgetApi.clearStateEvents();

    render(
      <BreakoutSessionGroupsForm
        onGroupsChange={onGroupsChange}
        parentMeeting={mockMeeting()}
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('spinbutton', {
        name: 'Number of groups (required)',
        description:
          'There are not enough participants for the number of groups you have entered.',
      }),
    ).toBeInvalid();

    expect(onGroupsChange).toHaveBeenLastCalledWith([]);
  });
});
