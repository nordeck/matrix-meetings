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

import { Controller, UseFilters } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MessageEventContent } from 'matrix-bot-sdk';
import { RoomIdParam } from '../decorator/RoomIdParam';
import { WebExceptionFilter } from '../filter/WebExceptionFilter';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { matrixPattern } from '../rpc/IMatrixPattern';
import { CommandService } from '../service/CommandService';

@Controller()
@UseFilters(WebExceptionFilter)
export class CommandController {
  constructor(private commandService: CommandService) {}

  @EventPattern(matrixPattern.roomMessage)
  async roomMessage(
    @RoomIdParam() roomId: string,
    @Payload() event: IStateEvent<MessageEventContent>,
  ) {
    await this.commandService.handleRoomMessage(roomId, event);
  }
}
