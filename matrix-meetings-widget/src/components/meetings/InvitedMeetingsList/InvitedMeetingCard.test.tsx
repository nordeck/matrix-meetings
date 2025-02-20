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
import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MockedWidgetApi, mockWidgetApi } from '../../../lib/mockWidgetApi';
import {
  mockCreateMeetingInvitation,
  mockRoomMember,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { InvitedMeetingCard } from './InvitedMeetingCard';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual('@matrix-widget-toolkit/api')),
  extractWidgetApiParameters: vi.fn(),
}));

const extractWidgetApiParameters = vi.mocked(extractWidgetApiParametersMocked);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<InvitedMeetingCard/>', () => {
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
        <Provider store={store}>
          <WidgetApiMockProvider value={widgetApi}>
            {children}
          </WidgetApiMockProvider>
        </Provider>
      );
    };
  });

  it('should render meeting without inviter', async () => {
    render(<InvitedMeetingCard roomId="!meeting-room-id" />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByRole('heading', { level: 4, name: /An important meeting/i }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /open the meeting room/i }),
    ).toBeInTheDocument();

    expect(screen.queryByText(/invited by/i)).not.toBeInTheDocument();
  });

  it('should render meeting with inviter', async () => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@inviter-id',
        room_id: '!meeting-room-id',
        content: { displayname: 'Inviter' },
      }),
    );

    render(<InvitedMeetingCard roomId="!meeting-room-id" />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByRole('heading', { level: 4, name: /An important meeting/i }),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /open the meeting room/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/invited by: inviter/i)).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <InvitedMeetingCard roomId="!meeting-room-id" />,
      { wrapper: Wrapper },
    );

    await expect(screen.findByRole('heading')).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });
});
