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
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { mockCreateMeetingRoom, mockMeeting } from '../../../../lib/testUtils';
import { createStore } from '../../../../store';
import { initializeStore } from '../../../../store/store';
import { MeetingDetailsHeader } from './MeetingDetailsHeader';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  extractWidgetApiParameters: jest.fn(),
}));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingDetailsHeader/>', () => {
  const onClose = jest.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
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
      <MeetingDetailsHeader meeting={mockMeeting()} onClose={onClose} />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it.todo('should join meeting room');
  it.todo('should open edit dialog');
  it.todo('should delete the meeting');
  it.todo('should show message if delete the meeting failed');
  it.todo('should close the expended meeting dialog');
});
