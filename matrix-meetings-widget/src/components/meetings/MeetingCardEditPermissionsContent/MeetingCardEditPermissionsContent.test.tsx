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
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  acknowledgeAllEvents,
  mockMeeting,
  mockPowerLevelsEvent,
} from '../../../lib/testUtils';
import { cancelRunningAwaitAcknowledgements } from '../../../reducer/meetingsApi/helpers';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { MeetingCardEditPermissionsContent } from './MeetingCardEditPermissionsContent';

jest.mock('@matrix-widget-toolkit/mui', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/mui'),
  getEnvironment: jest.fn(),
}));

const getEnvironment = jest.mocked(getEnvironmentMocked);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingCardEditPermissionsContent/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
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
    render(<MeetingCardEditPermissionsContent meeting={mockMeeting()} />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /permissions/i });

    expect(
      within(list).getByRole('checkbox', {
        name: /allow messaging for all users/i,
      })
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingCardEditPermissionsContent meeting={mockMeeting()} />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have accessible description', async () => {
    render(
      <>
        <p id="title-id">Example Context</p>
        <MeetingCardEditPermissionsContent
          aria-describedby="title-id"
          meeting={mockMeeting()}
        />
      </>,
      { wrapper: Wrapper }
    );

    await expect(
      screen.findByRole('checkbox', { name: /allow messaging for all users/i })
    ).resolves.toHaveAccessibleDescription(/example context/i);
  });

  it('should show warning if meeting already ended', () => {
    render(
      <MeetingCardEditPermissionsContent
        meeting={mockMeeting({ content: { endTime: '0001-01-01T00:00:00Z' } })}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      /the meeting is already over and cannot be changed/i
    );
  });

  it('should enable the permissions', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!meeting-room-id',
        content: { events_default: 100 },
      })
    );

    widgetApi
      .observeRoomEvents(
        'net.nordeck.meetings.meeting.change.message_permissions'
      )
      .subscribe(acknowledgeAllEvents(widgetApi));

    render(<MeetingCardEditPermissionsContent meeting={mockMeeting()} />, {
      wrapper: Wrapper,
    });

    const checkbox = await screen.findByRole('checkbox', {
      name: /allow messaging for all users/i,
    });

    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.meetings.meeting.change.message_permissions',
      {
        context: expect.anything(),
        data: {
          target_room_id: '!meeting-room-id',
          messaging_power_level: 0,
        },
      }
    );
  });

  it('should disable the permissions', async () => {
    widgetApi
      .observeRoomEvents(
        'net.nordeck.meetings.meeting.change.message_permissions'
      )
      .subscribe(acknowledgeAllEvents(widgetApi));

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!meeting-room-id',
        content: { events_default: 0 },
      })
    );

    render(<MeetingCardEditPermissionsContent meeting={mockMeeting()} />, {
      wrapper: Wrapper,
    });

    const checkbox = await screen.findByRole('checkbox', {
      name: /allow messaging for all users/i,
    });

    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);

    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.meetings.meeting.change.message_permissions',
      {
        context: expect.anything(),
        data: {
          target_room_id: '!meeting-room-id',
          messaging_power_level: 100,
        },
      }
    );
  });

  it('should show error alert', async () => {
    widgetApi
      .observeRoomEvents(
        'net.nordeck.meetings.meeting.change.message_permissions'
      )
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    render(<MeetingCardEditPermissionsContent meeting={mockMeeting()} />, {
      wrapper: Wrapper,
    });

    const checkbox = await screen.findByRole('checkbox', {
      name: /allow messaging for all users/i,
    });

    await userEvent.click(checkbox);

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText(/failed to update the permissions/i)
    ).toBeInTheDocument();
    expect(within(alert).getByText(/please try again/i)).toBeInTheDocument();
  });

  it('should show warning on timeout', async () => {
    render(<MeetingCardEditPermissionsContent meeting={mockMeeting()} />, {
      wrapper: Wrapper,
    });

    const checkbox = await screen.findByRole('checkbox', {
      name: /allow messaging for all users/i,
    });

    await userEvent.click(checkbox);

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalled();
    });

    cancelRunningAwaitAcknowledgements();

    const alert = await screen.findByRole('status');
    expect(
      within(alert).getByText(/the request was sent/i)
    ).toBeInTheDocument();
    expect(
      within(alert).getByText(
        /the change was submitted and will be applied soon/i
      )
    ).toBeInTheDocument();
  });

  it.each`
    input        | expectedPowerLevel
    ${undefined} | ${100}
    ${'-1'}      | ${100}
    ${10}        | ${10}
  `(
    'should read the power level from REACT_APP_MESSAGING_NOT_ALLOWED_POWER_LEVEL=$input',
    async ({ input, expectedPowerLevel }) => {
      widgetApi.mockSendStateEvent(
        mockPowerLevelsEvent({
          room_id: '!meeting-room-id',
          content: { events_default: 0 },
        })
      );
      getEnvironment.mockImplementation((name, defaultValue) =>
        name === 'REACT_APP_MESSAGING_NOT_ALLOWED_POWER_LEVEL'
          ? input
          : defaultValue
      );

      render(<MeetingCardEditPermissionsContent meeting={mockMeeting()} />, {
        wrapper: Wrapper,
      });

      const checkbox = await screen.findByRole('checkbox', {
        name: /allow messaging for all users/i,
      });

      await userEvent.click(checkbox);

      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        'net.nordeck.meetings.meeting.change.message_permissions',
        {
          context: expect.anything(),
          data: {
            target_room_id: '!meeting-room-id',
            messaging_power_level: expectedPowerLevel,
          },
        }
      );
    }
  );
});
