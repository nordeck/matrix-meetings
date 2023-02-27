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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockRoomMember } from '../../../../lib/testUtils';
import { createStore, initializeStore } from '../../../../store/store';
import { BreakoutSessionGroupForm } from './BreakoutSessionGroupForm';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<BreakoutSessionGroupForm>', () => {
  let allMemberEvents: StateEvent<RoomMemberStateEventContent>[];
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    allMemberEvents = [
      mockRoomMember(),
      mockRoomMember({
        state_key: '@user-1',
        content: { displayname: undefined },
      }),
    ];

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      }, []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>
            <ul>{children}</ul>
          </Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should render without exploding', () => {
    render(
      <BreakoutSessionGroupForm
        allMemberEvents={allMemberEvents}
        group={{
          title: 'My Group',
          members: ['@user-id', '@user-1'],
        }}
        onGroupChange={jest.fn()}
        selectableMemberEvents={allMemberEvents}
      />,
      { wrapper: Wrapper }
    );

    const listItem = screen.getByRole('listitem', { name: 'My Group' });

    expect(
      within(listItem).getByRole('textbox', { name: 'Group title (required)' })
    ).toHaveValue('My Group');
    expect(within(listItem).getByText('Alice')).toBeInTheDocument();
    expect(within(listItem).getByText('@user-1')).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <BreakoutSessionGroupForm
        allMemberEvents={allMemberEvents}
        group={{
          title: 'My Group',
          members: ['@user-id', '@user-1'],
        }}
        onGroupChange={jest.fn()}
        selectableMemberEvents={allMemberEvents}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should show an error if the group title is empty', () => {
    render(
      <BreakoutSessionGroupForm
        allMemberEvents={allMemberEvents}
        group={{
          title: '',
          members: ['@user-id', '@user-1'],
        }}
        onGroupChange={jest.fn()}
        selectableMemberEvents={allMemberEvents}
      />,
      { wrapper: Wrapper }
    );

    const listItem = screen.getByRole('listitem');

    expect(
      within(listItem).getByRole('textbox', {
        name: 'Group title (required)',
        description: 'A title is required',
      })
    ).toBeInvalid();
  });

  it('should notify on changes', async () => {
    const onGroupChange = jest.fn();
    render(
      <BreakoutSessionGroupForm
        allMemberEvents={allMemberEvents}
        group={{
          title: 'My Group',
          members: ['@user-id', '@user-1'],
        }}
        onGroupChange={onGroupChange}
        selectableMemberEvents={allMemberEvents}
      />,
      { wrapper: Wrapper }
    );

    const listItem = screen.getByRole('listitem', { name: 'My Group' });

    await userEvent.type(
      within(listItem).getByRole('button', { name: '@user-1' }),
      '{Backspace}'
    );

    await waitFor(() =>
      expect(onGroupChange).toHaveBeenLastCalledWith({ members: ['@user-id'] })
    );
  });
});
