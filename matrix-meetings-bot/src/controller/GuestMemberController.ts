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

import { Controller, UseFilters } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  MembershipEventContent,
  PowerLevelsEventContent,
} from 'matrix-bot-sdk';
import { RoomIdParam } from '../decorator/RoomIdParam';
import { WebExceptionFilter } from '../filter/WebExceptionFilter';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { StateEventName } from '../model/StateEventName';
import { matrixPattern } from '../rpc/IMatrixPattern';
import { GuestMemberService } from '../service/GuestMemberService';

@Controller()
@UseFilters(WebExceptionFilter)
export class GuestMemberController {
  constructor(private guestWorkflowService: GuestMemberService) {}

  @EventPattern(matrixPattern.roomEvent(StateEventName.M_ROOM_MEMBER_EVENT))
  async member(
    @RoomIdParam() roomId: string,
    @Payload() event: IStateEvent<MembershipEventContent>,
  ) {
    await this.guestWorkflowService.processMember(roomId, event);
  }
  @EventPattern(
    matrixPattern.roomEvent(StateEventName.M_ROOM_POWER_LEVELS_EVENT),
  )
  async powerLevels(
    @RoomIdParam() roomId: string,
    @Payload() event: IStateEvent<PowerLevelsEventContent>,
  ) {
    await this.guestWorkflowService.processPowerLevels(roomId, event);
  }
}
