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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { expect } from 'vitest';
import { axe } from 'vitest-axe';
import { acknowledgeAllEvents } from '../../../lib/testUtils';
import { cancelRunningAwaitAcknowledgements } from '../../../reducer/meetingsApi/helpers';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { BreakoutSessionsMessageForm } from './BreakoutSessionsMessageForm';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<BreakoutSessionsMessageForm/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      }, []);
      return (
        <Provider store={store}>
          <WidgetApiMockProvider value={widgetApi}>
            {children}
          </WidgetApiMockProvider>
        </Provider>
      );
    };
  });

  it('should render without exploding', () => {
    render(<BreakoutSessionsMessageForm />, { wrapper: Wrapper });

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /send message to all breakout session rooms/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('textbox', {
        name: /send message to all breakout session rooms/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /send message to all rooms/i }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<BreakoutSessionsMessageForm />, {
      wrapper: Wrapper,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should send a message', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.sub_meetings.send_message')
      .subscribe(acknowledgeAllEvents(widgetApi));

    render(<BreakoutSessionsMessageForm />, { wrapper: Wrapper });

    const button = screen.getByRole('button', {
      name: /send message to all rooms/i,
    });

    expect(button).toBeDisabled();

    const textbox = screen.getByRole('textbox', {
      name: /send message to all breakout session rooms/i,
    });

    await userEvent.type(textbox, 'Hello folks');

    await userEvent.click(button);

    await waitFor(() => {
      expect(textbox).toHaveValue('');
    });

    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.meetings.sub_meetings.send_message',
      {
        context: expect.anything(),
        data: {
          target_room_id: '!room-id',
          message: 'Hello folks',
        },
      },
    );
  });

  it('should send multiline message and submit with {enter}', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.sub_meetings.send_message')
      .subscribe(acknowledgeAllEvents(widgetApi));

    render(<BreakoutSessionsMessageForm />, { wrapper: Wrapper });

    const textbox = screen.getByRole('textbox', {
      name: /send message to all breakout session rooms/i,
    });

    await userEvent.type(
      textbox,
      'Hello folks{Shift>}{enter}{/Shift}Whats up?{enter}',
    );

    await waitFor(() => {
      expect(textbox).toHaveValue('');
    });

    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.meetings.sub_meetings.send_message',
      {
        context: expect.anything(),
        data: {
          target_room_id: '!room-id',
          message: 'Hello folks\nWhats up?',
        },
      },
    );
  });

  it('should show error alert', async () => {
    widgetApi
      .observeRoomEvents('net.nordeck.meetings.sub_meetings.send_message')
      .subscribe(acknowledgeAllEvents(widgetApi, { key: 'X' }));

    render(<BreakoutSessionsMessageForm />, { wrapper: Wrapper });

    const textbox = screen.getByRole('textbox', {
      name: /send message to all breakout session rooms/i,
    });

    await userEvent.type(textbox, 'Hello folks{enter}');

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText(/failed to send the message/i),
    ).toBeInTheDocument();
    expect(within(alert).getByText(/please try again/i)).toBeInTheDocument();

    expect(textbox).toHaveValue('Hello folks');
    expect(textbox).toHaveFocus();
  });

  it('should show warning on timeout', async () => {
    render(<BreakoutSessionsMessageForm />, { wrapper: Wrapper });

    const textbox = screen.getByRole('textbox', {
      name: /send message to all breakout session rooms/i,
    });

    await userEvent.type(textbox, 'Hello folks{enter}');

    await waitFor(() => {
      expect(widgetApi.sendRoomEvent).toBeCalledWith(
        expect.any(String),
        expect.anything(),
      );
    });

    cancelRunningAwaitAcknowledgements();

    const alert = await screen.findByRole('status');
    expect(
      within(alert).getByText(/the request was sent/i),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText(
        /the change was submitted and will be applied soon/i,
      ),
    ).toBeInTheDocument();

    expect(textbox).toHaveValue('');
  });
});
