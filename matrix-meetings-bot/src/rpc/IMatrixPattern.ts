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

import { MsObjectPattern } from '@nestjs/microservices';
import { BotEventType } from '../matrix/BotEventType';
import { RoomEventName } from '../model/RoomEventName';
import { StateEventName } from '../model/StateEventName';

/**
 * Pattern to subscribe for Matrix events via bot sdk
 */
export interface IMatrixPattern extends MsObjectPattern {
  botEventType: BotEventType;
  matrixEventType: RoomEventName | StateEventName;
}

/**
 * Helper to create patterns
 */
class MatrixPatternHelper {
  /**
   * bot 'room.event'
   * @param matrixEventType matrix event type, example: 'm.room.member'
   */
  roomEvent(matrixEventType: RoomEventName | StateEventName): IMatrixPattern {
    return {
      botEventType: BotEventType.ROOM_EVENT,
      matrixEventType,
    };
  }

  /**
   * bot 'room.invite'
   */
  roomInvite: IMatrixPattern = {
    botEventType: BotEventType.ROOM_INVITE,
    matrixEventType: StateEventName.M_ROOM_MEMBER_EVENT,
  };

  /**
   * bot 'room.message'
   */
  roomMessage: IMatrixPattern = {
    botEventType: BotEventType.ROOM_MESSAGE,
    matrixEventType: RoomEventName.M_ROOM_MESSAGE,
  };
}

export const matrixPattern = new MatrixPatternHelper();
