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
import { renderHook } from '@testing-library/react-hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockMeeting } from '../../../lib/testUtils';
import { Meeting } from '../../../reducer/meetingsApi';
import { useMeetingUrl } from './useMeetingUrl';

vi.mock('@matrix-widget-toolkit/api', async () => ({
  ...(await vi.importActual<typeof import('@matrix-widget-toolkit/api')>(
    '@matrix-widget-toolkit/api',
  )),
  extractWidgetApiParameters: vi.fn(),
}));

const extractWidgetApiParameters = vi.mocked(extractWidgetApiParametersMocked);

describe('useMeetingUrl', () => {
  let meeting: Meeting;

  beforeEach(() => {
    meeting = mockMeeting();

    extractWidgetApiParameters.mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });
  });

  it('should generate the room url', () => {
    const { result } = renderHook(() => useMeetingUrl(meeting));

    expect(result.current).toEqual({
      url: 'http://element.local/#/room/!meeting-room-id',
    });
  });
});
