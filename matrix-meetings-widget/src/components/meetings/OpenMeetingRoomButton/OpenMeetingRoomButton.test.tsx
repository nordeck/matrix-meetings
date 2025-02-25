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
import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren } from 'react';
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MockedWidgetApi, mockWidgetApi } from '../../../lib/mockWidgetApi';
import { OpenMeetingRoomButton } from './OpenMeetingRoomButton';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual('@matrix-widget-toolkit/api')),
  extractWidgetApiParameters: vi.fn(),
}));

const extractWidgetApiParameters = vi.mocked(extractWidgetApiParametersMocked);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<OpenMeetingRoomButton/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    extractWidgetApiParameters.mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return (
        <WidgetApiMockProvider value={widgetApi}>
          {children}
        </WidgetApiMockProvider>
      );
    };
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<OpenMeetingRoomButton roomId="!room-id" />, {
      wrapper: Wrapper,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations in breakout session mode', async () => {
    const { container } = render(
      <OpenMeetingRoomButton
        meetingType="net.nordeck.meetings.breakoutsession"
        roomId="!room-id"
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should navigate to the room', async () => {
    render(
      <OpenMeetingRoomButton
        meetingType="net.nordeck.meetings.meeting"
        roomId="!room-id"
      />,
      { wrapper: Wrapper },
    );

    const button = screen.getByRole('button', {
      name: /open the meeting room/i,
    });

    await userEvent.click(button);

    expect(widgetApi.navigateTo).toBeCalledWith('https://matrix.to/#/!room-id');
  });

  it('should navigate to the breakout room', () => {
    render(
      <OpenMeetingRoomButton
        meetingType="net.nordeck.meetings.breakoutsession"
        roomId="!room-id"
      />,
      { wrapper: Wrapper },
    );

    const button = screen.getByRole('link', {
      name: /open the breakout session room/i,
    });

    expect(button).toHaveAttribute('target', '_blank');
    expect(button).toHaveAttribute(
      'href',
      'http://element.local/#/room/!room-id',
    );
  });

  it('should have accessible description', () => {
    render(
      <>
        <p id="title-id">Example context</p>
        <OpenMeetingRoomButton aria-describedby="title-id" roomId="!room-id" />
      </>,
      { wrapper: Wrapper },
    );

    const button = screen.getByRole('button', {
      name: /open the meeting room/i,
    });

    expect(button).toHaveAccessibleDescription(/example context/i);
  });
});
