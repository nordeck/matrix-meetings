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

import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { expect } from 'vitest';
import { axe } from 'vitest-axe';
import { MockedWidgetApi, mockWidgetApi } from '../../../../lib/mockWidgetApi';
import {
  mockCreateBreakoutMeetingRoom,
  mockCreateMeetingRoom,
  mockMeeting,
} from '../../../../lib/testUtils';
import { createStore } from '../../../../store';
import { initializeStore } from '../../../../store/store';
import { MeetingHasBreakoutSessionsWarning } from './MeetingHasBreakoutSessionsWarning';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingHasBreakoutSessionsWarning/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingHasBreakoutSessionsWarning meeting={mockMeeting()} />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should skip warning', async () => {
    const { container } = render(
      <MeetingHasBreakoutSessionsWarning meeting={mockMeeting()} />,
      { wrapper: Wrapper },
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should render warning', async () => {
    mockCreateMeetingRoom(widgetApi);
    mockCreateBreakoutMeetingRoom(widgetApi);

    render(<MeetingHasBreakoutSessionsWarning meeting={mockMeeting()} />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByText(/The meeting already has breakout sessions/),
    ).resolves.toBeInTheDocument();
  });
});
