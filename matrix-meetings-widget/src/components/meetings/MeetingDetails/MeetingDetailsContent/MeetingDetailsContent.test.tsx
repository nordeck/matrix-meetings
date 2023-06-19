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

import { extractWidgetApiParameters } from '@matrix-widget-toolkit/api';
import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  mockConfigEndpoint,
  mockCreateMeetingRoom,
  mockMeeting,
  mockMeetingSharingInformationEndpoint,
} from '../../../../lib/testUtils';
import { createStore } from '../../../../store';
import { initializeStore } from '../../../../store/store';
import { MeetingDetailsContent } from './MeetingDetailsContent';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  extractWidgetApiParameters: jest.fn(),
}));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingDetailsContent/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);
    jest.mocked(extractWidgetApiParameters).mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    mockCreateMeetingRoom(widgetApi);

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

  it.todo('should render without exploding');

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingDetailsContent
        meeting={mockMeeting()}
        meetingTimeId="meeting-id"
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it.todo('should join meeting room by clicking the link');
  it.todo('should copy the room link');
});
