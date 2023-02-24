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
import { render, screen, within } from '@testing-library/react';
import { ComponentType, PropsWithChildren } from 'react';
import { mockMeeting } from '../../../lib/testUtils';
import { Meeting } from '../../../reducer/meetingsApi';
import { MeetingInvitationGuard } from './MeetingInvitationGuard';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<MeetingInvitationGuard/>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;
  let meeting: Meeting;

  beforeEach(() => {
    meeting = mockMeeting();

    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <WidgetApiMockProvider value={widgetApi}>
        {children}
      </WidgetApiMockProvider>
    );
  });

  it('should render without exploding', () => {
    render(
      <MeetingInvitationGuard meeting={meeting}>
        <p>My Content</p>
      </MeetingInvitationGuard>,
      { wrapper }
    );

    expect(screen.getByText(/My Content/)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should show message if user is invited', () => {
    meeting.participants[0].membership = 'invite';

    render(
      <MeetingInvitationGuard meeting={meeting}>
        <p>My Content</p>
      </MeetingInvitationGuard>,
      { wrapper }
    );

    const alert = screen.getByRole('status');
    expect(
      within(alert).getByText(/Please accept the meeting invitation/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/My Content/)).not.toBeInTheDocument();
  });
});
