/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { Logger } from '@nestjs/common';
import { MatrixClient } from 'matrix-bot-sdk';

// This file was copied and adapted from https://github.com/turt2live/matrix-bot-sdk/blob/c7d16776502c26bbb547a3d667ec92eb50e7026c/src/mixins/AutojoinRoomsMixin.ts
// We added error handling because nodejs will crash if an unhandled promise exception occurs.
// This happens if the room join fails for some reason.
// TODO: this change can be contributed back to the matrix-bot-sdk

const logger = new Logger('matrix.mixins.AutojoinRoomsMixin');

export class AutojoinRoomsMixin {
  public static setupOnClient(client: MatrixClient): void {
    client.on('room.invite', async (roomId: string) => {
      try {
        await client.joinRoom(roomId);
      } catch (e) {
        logger.error(e, `Could not automatically join room ${roomId}`);
      }
    });
  }
}
