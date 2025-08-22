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

import { Injectable } from '@nestjs/common';
import { MatrixClient } from 'matrix-bot-sdk';

// Follows what matrix bot sdk doing for versions: https://github.com/turt2live/matrix-bot-sdk/blob/ac53f0fb625911b87b3c1427661824b9a38d0514/src/MatrixClient.ts#L50
const defaultRoomVersionCacheMs = 7200000; // 2 hours

@Injectable()
export class MatrixClientAdapter {
  private cachedDefaultRoomVersion?: string;
  private defaultRoomVersionLastFetched: number = 0;

  constructor(private matrixClient: MatrixClient) {}

  /**
   * Retrieves synapse default room version using '/_matrix/client/v3/capabilities' endpoint.
   * @returns {Promise<string>} Resolves to the synapse default room version
   */
  public async getCapabilitiesDefaultRoomVersion(): Promise<string> {
    let defaultRoomVersion: string;

    if (
      !this.cachedDefaultRoomVersion ||
      Date.now() - this.defaultRoomVersionLastFetched >=
        defaultRoomVersionCacheMs
    ) {
      const response = await this.matrixClient.doRequest(
        'GET',
        '/_matrix/client/v3/capabilities',
      );
      const responseDefaultRoomVersion =
        response['capabilities']['m.room_versions']['default'];
      defaultRoomVersion = responseDefaultRoomVersion;
      this.cachedDefaultRoomVersion = responseDefaultRoomVersion;
      this.defaultRoomVersionLastFetched = Date.now();
    } else {
      defaultRoomVersion = this.cachedDefaultRoomVersion;
    }

    return defaultRoomVersion;
  }
}
