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

import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockCreateMeetingInvitation } from '../../../lib/testUtils';
import { MeetingInvitation } from '../../../reducer/meetingsApi';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { withRoomIdInvitedMeeting } from './withRoomIdInvitedMeeting';

const Component = withRoomIdInvitedMeeting(
  ({ meeting }: { meeting: MeetingInvitation }) => (
    <>
      <h1>{meeting.title}</h1>
      <p>My Content</p>
    </>
  ),
);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('withRoomIdInvitedMeeting', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(async () => {
    mockCreateMeetingInvitation(widgetApi);

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      }, []);
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should render without exploding', async () => {
    render(<Component roomId="!meeting-room-id" />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('heading', { name: /an important meeting/i }),
    ).resolves.toBeInTheDocument();
    expect(screen.getByText('My Content')).toBeInTheDocument();
  });

  it('should hide content', async () => {
    const { container } = render(<Component roomId="!another-room-id" />, {
      wrapper: Wrapper,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('should handle undefined roomId', async () => {
    const { container } = render(<Component roomId={undefined} />, {
      wrapper: Wrapper,
    });

    expect(container).toBeEmptyDOMElement();
  });
});
