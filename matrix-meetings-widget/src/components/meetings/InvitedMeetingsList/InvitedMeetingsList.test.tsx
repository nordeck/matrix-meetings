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
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { mockCreateMeetingInvitation } from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { InvitedMeetingsList } from './InvitedMeetingsList';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  extractWidgetApiParameters: jest.fn(),
}));

const extractWidgetApiParameters = jest.mocked(
  extractWidgetApiParametersMocked
);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<InvitedMeetingsList/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    extractWidgetApiParameters.mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    mockCreateMeetingInvitation(widgetApi);

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

  it('should render without exploding', async () => {
    render(<InvitedMeetingsList />, { wrapper: Wrapper });

    const region = screen.getByRole('region', { name: /invitations/i });

    expect(
      within(region).getByRole('heading', { level: 3, name: /invitations/i })
    ).toBeInTheDocument();

    const list = within(region).getByRole('list', { name: /invitations/i });

    const item = await within(list).findByRole('listitem', {
      name: /an important meeting/i,
    });
    expect(
      within(item).getByRole('heading', {
        level: 4,
        name: /an important meeting/i,
      })
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<InvitedMeetingsList />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('listitem', { name: /an important meeting/i })
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, in breakout mode', async () => {
    mockCreateMeetingInvitation(widgetApi, {
      create: { type: 'net.nordeck.meetings.breakoutsession' },
    });

    const { container } = render(<InvitedMeetingsList breakoutSessionMode />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByRole('listitem', { name: /an important meeting/i })
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render without exploding in breakout mode', async () => {
    mockCreateMeetingInvitation(widgetApi, {
      create: { type: 'net.nordeck.meetings.breakoutsession' },
    });

    render(<InvitedMeetingsList breakoutSessionMode />, { wrapper: Wrapper });

    expect(
      screen.getByRole('heading', { level: 3, name: /invitations/i })
    ).toBeInTheDocument();

    const list = screen.getByRole('list', { name: /invitations/i });

    const item = await within(list).findByRole('listitem', {
      name: /an important meeting/i,
    });
    expect(
      within(item).getByRole('heading', {
        level: 4,
        name: /an important meeting/i,
      })
    ).toBeInTheDocument();
  });
});
