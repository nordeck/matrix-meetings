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
import { MeetingCalenderDetailsShare } from './MeetingCalenderDetailsShare';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  extractWidgetApiParameters: jest.fn(),
}));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingCalenderDetailsShare/>', () => {
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

  /*   it('should render without exploding', async () => {
    render(
      <MeetingsCalendarDetailsDialog
        meetingId={{
          meetingId: '!meeting-room-id',
          uid: 'entry-0',
          recurrenceId: undefined,
        }}
        onClose={onClose}
      />,
      { wrapper: Wrapper }
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'An important meeting',
      description: 'January 1, 2999, 10:00 AM – 2:00 PM',
    });

    expect(
      within(dialog).getByRole('heading', {
        name: 'An important meeting',
        level: 3,
      })
    ).toBeInTheDocument();

    expect(
      within(dialog).getByText(/^January 1, 2999, 10:00 AM – 2:00 PM$/)
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Join' })
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Edit' })
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Delete' })
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Share by email' })
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Download ICS File' })
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('listitem', { name: 'Alice' })
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('link', {
        name: 'http://element.local/#/room/!meeting-room-id',
      })
    ).toBeInTheDocument();
  }); */

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingCalenderDetailsShare meeting={mockMeeting()} />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
