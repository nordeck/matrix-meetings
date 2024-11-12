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
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  mockCalendarEntry,
  mockConfigEndpoint,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { useMeetingEmail } from './useMeetingEmail';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual<typeof import('@matrix-widget-toolkit/api')>(
    '@matrix-widget-toolkit/api',
  )),
  extractWidgetApiParameters: vi.fn(),
}));

const extractWidgetApiParameters = vi.mocked(extractWidgetApiParametersMocked);

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('useMeetingEmail', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);

    extractWidgetApiParameters.mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => createStore({ widgetApi }));
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should generate the email message', () => {
    const { result } = renderHook(() => useMeetingEmail(mockMeeting()), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({
      message: `An important meeting

📅 1/1/2999, 10:00 AM – 2:00 PM

A brief description

__________________________
Room: http://element.local/#/room/!meeting-room-id
`,
    });
  });

  it('should generate the email message for recurring meeting', () => {
    const { result } = renderHook(
      () =>
        useMeetingEmail(
          mockMeeting({
            content: {
              startTime: '2999-01-05T10:00:00Z',
              endTime: '2999-01-05T14:00:00Z',
              recurrenceId: '2999-01-05T10:00:00Z',
              calendarEntries: [
                mockCalendarEntry({
                  dtstart: '29990101T100000',
                  dtend: '29990101T140000',
                  rrule: 'FREQ=DAILY',
                }),
              ],
            },
          }),
        ),
      { wrapper: Wrapper },
    );

    expect(result.current).toEqual({
      message: `An important meeting

📅 1/1/2999, 10:00 AM – 2:00 PM
🔁 Recurrence: Every day

A brief description

__________________________
Room: http://element.local/#/room/!meeting-room-id
`,
    });
  });

  it('should generate the email if meeting spans multiple days', () => {
    const { result } = renderHook(
      () =>
        useMeetingEmail(
          mockMeeting({ content: { endTime: '2999-01-02T00:00:00Z' } }),
        ),
      { wrapper: Wrapper },
    );

    expect(result.current).toEqual({
      message: `An important meeting

📅 1/1/2999, 10:00 AM – 1/2/2999, 12:00 AM

A brief description

__________________________
Room: http://element.local/#/room/!meeting-room-id
`,
    });
  });

  it('should generate the email message without description', () => {
    const { result } = renderHook(
      () =>
        useMeetingEmail(
          mockMeeting({
            content: {
              description: undefined,
            },
          }),
        ),
      { wrapper: Wrapper },
    );

    expect(result.current).toEqual({
      message: `An important meeting

📅 1/1/2999, 10:00 AM – 2:00 PM


__________________________
Room: http://element.local/#/room/!meeting-room-id
`,
    });
  });

  it('should include the dial-in number without a pin', async () => {
    mockConfigEndpoint(server, { jitsiDialInEnabled: true });
    mockMeetingSharingInformationEndpoint(server, {
      jitsi_dial_in_number: '0123',
    });

    const { result } = renderHook(() => useMeetingEmail(mockMeeting()), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        message: `An important meeting

📅 1/1/2999, 10:00 AM – 2:00 PM

A brief description

__________________________
Room: http://element.local/#/room/!meeting-room-id
Dial-In Number: 0123
Dial-In Pin: Pin not required
`,
      });
    });
  });

  it('should include the dial-in number with a pin', async () => {
    mockConfigEndpoint(server, { jitsiDialInEnabled: true });
    mockMeetingSharingInformationEndpoint(server, {
      jitsi_dial_in_number: '0123',
      jitsi_pin: 5555,
    });

    const { result } = renderHook(() => useMeetingEmail(mockMeeting()), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        message: `An important meeting

📅 1/1/2999, 10:00 AM – 2:00 PM

A brief description

__________________________
Room: http://element.local/#/room/!meeting-room-id
Dial-In Number: 0123
Dial-In Pin: 5555
`,
      });
    });
  });
});
