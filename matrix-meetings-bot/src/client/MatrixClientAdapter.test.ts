/*
 * Copyright 2025 Nordeck IT + Consulting GmbH
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

import { MatrixClient } from 'matrix-bot-sdk';
import { MatrixClientAdapter } from './MatrixClientAdapter';

jest.mock('matrix-bot-sdk');

describe('MatrixClientAdapter', () => {
  beforeEach(() => {
    jest
      .spyOn(MatrixClient.prototype, 'doRequest')
      .mockImplementation((method, endpoint) => {
        const response =
          endpoint === '/_matrix/client/v3/capabilities'
            ? {
                capabilities: {
                  'm.room_versions': {
                    default: '12',
                    available: {},
                    'org.matrix.msc3244.room_capabilities': {},
                  },
                  'm.change_password': { enabled: true },
                  'm.set_displayname': { enabled: true },
                  'm.set_avatar_url': { enabled: true },
                  'm.3pid_changes': { enabled: true },
                  'm.get_login_token': { enabled: false },
                  'm.profile_fields': { enabled: true },
                },
              }
            : undefined;

        return Promise.resolve(response);
      });
  });

  it('should get synapse default room version via capabilities endpoint', async () => {
    const matrixClient = new MatrixClient('https://example.com', 'token123');
    const matrixClientAdapter = new MatrixClientAdapter(matrixClient);

    expect(
      await matrixClientAdapter.getCapabilitiesDefaultRoomVersion(),
    ).toEqual('12');
    expect(MatrixClient.prototype.doRequest).toHaveBeenCalledWith(
      'GET',
      '/_matrix/client/v3/capabilities',
    );
    expect(MatrixClient.prototype.doRequest).toHaveBeenCalledTimes(1);
  });

  it('should get and cache synapse default room version via capabilities endpoint', async () => {
    jest.useFakeTimers();

    const matrixClient = new MatrixClient('https://example.com', 'token123');
    const matrixClientAdapter = new MatrixClientAdapter(matrixClient);

    expect(
      await matrixClientAdapter.getCapabilitiesDefaultRoomVersion(),
    ).toEqual('12');
    expect(MatrixClient.prototype.doRequest).toHaveBeenCalledWith(
      'GET',
      '/_matrix/client/v3/capabilities',
    );
    expect(MatrixClient.prototype.doRequest).toHaveBeenCalledTimes(1);

    expect(
      await matrixClientAdapter.getCapabilitiesDefaultRoomVersion(),
    ).toEqual('12');
    expect(MatrixClient.prototype.doRequest).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(7200000); // 2 hours

    expect(
      await matrixClientAdapter.getCapabilitiesDefaultRoomVersion(),
    ).toEqual('12');
    expect(MatrixClient.prototype.doRequest).toHaveBeenCalledTimes(2);
  });
});
