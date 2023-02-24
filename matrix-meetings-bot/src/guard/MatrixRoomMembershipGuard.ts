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

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MatrixClient } from 'matrix-bot-sdk';
import { NET_NORDECK_CONTEXT } from '../decorator/IParamExtractor';
import { IUserContext } from '../model/IUserContext';

@Injectable()
export class MatrixRoomMembershipGuard implements CanActivate {
  private logger = new Logger(MatrixRoomMembershipGuard.name);
  constructor(private matrixClient: MatrixClient) {}

  /**
   * checks the current user for the requested room if given
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      try {
        const userContext: IUserContext = request[
          NET_NORDECK_CONTEXT
        ] as IUserContext;
        const roomId = request.params['roomId']
          ? request.params['roomId']
          : request.query['roomId'];
        if (roomId) {
          const joinedRoomMembers =
            await this.matrixClient.getJoinedRoomMembers(roomId);
          const userIsInRoom = joinedRoomMembers.find(
            (userId) => userId === userContext.userId
          );
          if (userIsInRoom) return true;
          this.logger.warn(
            `User ${userContext.userId} is not a joined room-member of room ${roomId}`
          );
          return false;
        }
      } catch (err) {
        this.logger.error(err, 'Failed getJoinedRoomMembers');
        return false;
      }
      return true;
    } else if (context.getType() === 'rpc') {
      return true;
    } else {
      throw new Error(`unsupported context type: ${context.getType()}`);
    }
  }
}
