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
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { repeat } from 'lodash-es';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockMeeting,
  mockRoomMember,
  mockWidgetEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { SetupBreakoutSessions } from './SetupBreakoutSessions';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<SetupBreakoutSessions>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockWidgetEndpoint(server);
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

    vi.spyOn(Date, 'now').mockImplementation(
      () => +new Date('2022-01-02T13:10:00.000Z'),
    );

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      }, []);
      return (
        <LocalizationProvider>
          <WidgetApiMockProvider value={widgetApi}>
            <Provider store={store}>{children}</Provider>
          </WidgetApiMockProvider>
        </LocalizationProvider>
      );
    };
  });

  it('should render without exploding', async () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-02T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(),
    );

    const startAtGroup = screen.getByRole('group', { name: 'Start at' });

    expect(
      within(startAtGroup).getByRole('textbox', { name: 'Start time' }),
    ).toHaveValue('01:15 PM');

    const endAtGroup = screen.getByRole('group', { name: 'End at' });

    expect(
      within(endAtGroup).getByRole('textbox', { name: 'End time' }),
    ).toHaveValue('01:30 PM');

    expect(
      screen.getByRole('spinbutton', { name: 'Number of groups (required)' }),
    ).toHaveValue(1);

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'My description',
    );
    await userEvent.type(
      screen.getByRole('button', { name: 'Widget 2' }),
      '{Backspace}',
    );

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith({
      description: 'My description',
      endTime: '2022-01-02T13:30:00.000Z',
      startTime: '2022-01-02T13:15:00.000Z',
      groups: [{ participants: ['@user-id'], title: 'Group 1' }],
      widgetIds: ['widget-1'],
    });
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={vi.fn()}
        parentMeeting={mockMeeting()}
      />,
      { wrapper: Wrapper },
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should have a date picker if meeting start and end date are different', async () => {
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={vi.fn()}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-03T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    await waitFor(
      () => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(),
      { timeout: 10000 },
    );

    const startAtGroup = screen.getByRole('group', { name: 'Start at' });
    expect(
      within(startAtGroup).getByRole('textbox', { name: 'Start date' }),
    ).toHaveValue('01/02/2022');
    expect(
      within(startAtGroup).getByRole('textbox', { name: 'Start time' }),
    ).toHaveValue('01:15 PM');

    const endAtGroup = screen.getByRole('group', { name: 'End at' });
    expect(
      within(endAtGroup).getByRole('textbox', { name: 'End date' }),
    ).toHaveValue('01/02/2022');
    expect(
      within(endAtGroup).getByRole('textbox', { name: 'End time' }),
    ).toHaveValue('01:30 PM');
  }, 10000);

  it('should adjust the breakout session end time if the start time is changed', async () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-02T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(),
    );

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(screen.getByRole('textbox', { name: /start time/i }), {
      target: { value: '01:30 PM' },
    });

    expect(screen.getByRole('textbox', { name: /start time/i })).toHaveValue(
      '01:30 PM',
    );
    expect(screen.getByRole('textbox', { name: /end time/i })).toHaveValue(
      '01:45 PM',
    );

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith({
      description: '',
      endTime: '2022-01-02T13:45:00.000Z',
      startTime: '2022-01-02T13:30:00.000Z',
      groups: [{ participants: ['@user-id'], title: 'Group 1' }],
      widgetIds: ['widget-1', 'widget-2'],
    });
  });

  it('should warn if a group title is missing', async () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-02T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.clear(
      screen.getByRole('textbox', { name: 'Group title (required)' }),
    );

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn if the start time is to early', () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-02T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    const startTimeTextbox = screen.getByRole('textbox', {
      name: /start time/i,
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(startTimeTextbox, { target: { value: '01:00 PM' } });

    expect(startTimeTextbox).toHaveAccessibleDescription(
      'Breakout session should start between 1:10 PM and 2:00 PM.',
    );
    expect(startTimeTextbox).toBeInvalid();

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn if the start time is to late', () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-02T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    const startTimeTextbox = screen.getByRole('textbox', {
      name: /start time/i,
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(startTimeTextbox, { target: { value: '03:00 PM' } });

    expect(startTimeTextbox).toHaveAccessibleDescription(
      'Breakout session should start between 1:10 PM and 2:00 PM.',
    );
    expect(startTimeTextbox).toBeInvalid();

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn if the start time is to early, when the meeting spans multiple days', () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-03T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    const startDateTextbox = screen.getByRole('textbox', {
      name: /start date/i,
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(startDateTextbox, { target: { value: '01/01/2022' } });

    expect(startDateTextbox).toHaveAccessibleDescription(
      /Breakout session should start between January 2, 2022(,| at) 1:10 PM and January 3, 2022(,| at) 2:00 PM/,
    );
    expect(startDateTextbox).toBeInvalid();
    expect(screen.getByRole('textbox', { name: /start time/i })).toBeInvalid();

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn if the end time is to early', () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-02T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    const endTimeTextbox = screen.getByRole('textbox', {
      name: /end time/i,
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(screen.getByRole('textbox', { name: /start time/i }), {
      target: { value: '12:00 PM' },
    });
    fireEvent.change(endTimeTextbox, { target: { value: '01:00 PM' } });

    expect(endTimeTextbox).toHaveAccessibleDescription(
      'Breakout session should end between 1:10 PM and 2:00 PM.',
    );
    expect(endTimeTextbox).toBeInvalid();

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn if the end time is to late', () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-02T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    const endTimeTextbox = screen.getByRole('textbox', {
      name: /end time/i,
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(endTimeTextbox, { target: { value: '03:00 PM' } });

    expect(endTimeTextbox).toHaveAccessibleDescription(
      'Breakout session should end between 1:10 PM and 2:00 PM.',
    );
    expect(endTimeTextbox).toBeInvalid();

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn if the breakout session ends before it starts', () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-02T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    const endTimeTextbox = screen.getByRole('textbox', {
      name: /end time/i,
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(endTimeTextbox, { target: { value: '01:10 PM' } });

    expect(endTimeTextbox).toHaveAccessibleDescription(
      'Breakout session should start before it ends.',
    );
    expect(endTimeTextbox).toBeInvalid();

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should warn if the end time is to early, when the meeting spans multiple days', () => {
    const onBreakoutSessionsChange = vi.fn();
    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-03T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    const endDateTextbox = screen.getByRole('textbox', {
      name: /end date/i,
    });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(screen.getByRole('textbox', { name: /start date/i }), {
      target: { value: '01/01/2022' },
    });
    fireEvent.change(endDateTextbox, { target: { value: '01/01/2022' } });

    expect(endDateTextbox).toBeInvalid();
    expect(endDateTextbox).toHaveAccessibleDescription(
      /Breakout session should end between January 2, 2022(,| at) 1:10 PM and January 3, 2022(,| at) 2:00 PM/,
    );
    expect(screen.getByRole('textbox', { name: /end time/i })).toBeInvalid();

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should limit the length of the title and description', async () => {
    const onBreakoutSessionsChange = vi.fn();

    render(
      <SetupBreakoutSessions
        onBreakoutSessionsChange={onBreakoutSessionsChange}
        parentMeeting={mockMeeting({
          content: {
            startTime: '2022-01-02T13:00:00.000Z',
            endTime: '2022-01-03T14:00:00.000Z',
          },
        })}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('textbox', { name: 'Group title (required)' }),
    );
    await userEvent.paste(repeat('+', 255));

    await userEvent.click(screen.getByRole('textbox', { name: 'Description' }));
    await userEvent.paste(repeat('+', 21000));

    expect(onBreakoutSessionsChange).toHaveBeenLastCalledWith({
      description: repeat('+', 20000),
      endTime: '2022-01-02T13:30:00.000Z',
      startTime: '2022-01-02T13:15:00.000Z',
      groups: [
        {
          participants: ['@user-id'],
          title: 'Group 1' + repeat('+', 255 - 'Group 1'.length),
        },
      ],
      widgetIds: ['widget-1', 'widget-2'],
    });
  });
});
