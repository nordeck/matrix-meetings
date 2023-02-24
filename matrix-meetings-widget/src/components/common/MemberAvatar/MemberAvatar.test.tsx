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
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockRoomMember } from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { MemberAvatar } from './MemberAvatar';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MemberAvatar/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(mockRoomMember());

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

  it('should render without exploding', async () => {
    render(<MemberAvatar userId="@user-id" />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('img', { hidden: true })
    ).resolves.toBeInTheDocument();
  });

  it('should have not accessibility violations', async () => {
    const { container } = render(<MemberAvatar userId="@user-id" />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByRole('img', { hidden: true })
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render avatar url', async () => {
    render(<MemberAvatar userId="@user-id" />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('img', { hidden: true })
    ).resolves.toHaveAttribute(
      'src',
      expect.stringMatching(/\/_matrix\/media\/r0\/thumbnail\/alice/i)
    );
  });

  it('should render first letter', async () => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({ content: { avatar_url: undefined } })
    );

    render(<MemberAvatar userId="@user-id" />, { wrapper: Wrapper });

    await expect(screen.findByText('A')).resolves.toBeInTheDocument();
  });
});
