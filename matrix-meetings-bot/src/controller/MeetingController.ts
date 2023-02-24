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
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RoomIdParam } from '../decorator/RoomIdParam';
import { UserContextParam } from '../decorator/UserContextParam';
import { BreakoutSessionsDto } from '../dto/BreakoutSessionsDto';
import { MeetingChangeMessagingPermissionDto } from '../dto/MeetingChangeMessagingPermissionDto';
import { MeetingCloseDto } from '../dto/MeetingCloseDto';
import { MeetingCreateDto } from '../dto/MeetingCreateDto';
import { MeetingCreateResponseDto } from '../dto/MeetingCreateResponseDto';
import { MeetingParticipantsHandleDto } from '../dto/MeetingParticipantsHandleDto';
import { MeetingSharingInformationDto } from '../dto/MeetingSharingInformationDto';
import { MeetingUpdateDetailsDto } from '../dto/MeetingUpdateDetailsDto';
import { MeetingWidgetsHandleDto } from '../dto/MeetingWidgetsHandleDto';
import { SubMeetingsSendMessageDto } from '../dto/SubMeetingsSendMessageDto';
import { WebExceptionFilter } from '../filter/WebExceptionFilter';
import { MatrixAuthGuard } from '../guard/MatrixAuthGuard';
import { MatrixRoomMembershipGuard } from '../guard/MatrixRoomMembershipGuard';
import { IUserContext } from '../model/IUserContext';
import { MeetingType } from '../model/MeetingType';
import { RoomEventName } from '../model/RoomEventName';
import { matrixPattern } from '../rpc/IMatrixPattern';
import { MeetingService } from '../service/MeetingService';

@Controller({
  path: 'meeting',
  version: ['1'],
})
@UseFilters(WebExceptionFilter)
@UseGuards(MatrixAuthGuard, MatrixRoomMembershipGuard)
@UsePipes(ValidationPipe)
export class MeetingController {
  constructor(private meetingService: MeetingService) {}

  @Post('create')
  @EventPattern(
    matrixPattern.roomEvent(RoomEventName.NIC_MEETINGS_MEETING_CREATE)
  )
  async create(
    @RoomIdParam() roomId: string | undefined,
    @UserContextParam() userContext: IUserContext,
    @Payload() data: MeetingCreateDto
  ): Promise<MeetingCreateResponseDto> {
    const newData: MeetingCreateDto = roomId
      ? {
          ...data,
          parent_room_id: roomId, // overrides parent room id
        }
      : data;
    return await this.meetingService.createMeeting(
      userContext,
      newData,
      MeetingType.MEETING
    );
  }

  @EventPattern(
    matrixPattern.roomEvent(RoomEventName.NIC_MEETINGS_BREAKOUTSESSIONS_CREATE)
  )
  async createBreakoutSessions(
    @RoomIdParam() roomId: string,
    @UserContextParam() userContext: IUserContext,
    @Payload() data: BreakoutSessionsDto
  ) {
    await this.meetingService.createBreakOutSessions(userContext, roomId, data);
  }

  @Put('update')
  @EventPattern(
    matrixPattern.roomEvent(RoomEventName.NIC_MEETINGS_MEETING_UPDATE_DETAILS)
  )
  async update(
    @UserContextParam() userContext: IUserContext,
    @Payload() data: MeetingUpdateDetailsDto
  ) {
    await this.meetingService.updateMeetingDetails(userContext, data);
  }

  @EventPattern(
    matrixPattern.roomEvent(
      RoomEventName.NIC_MEETING_MEETING_CHANGE_MESSAGING_PERMISSIONS
    )
  )
  async changeMessagingPermissions(
    @UserContextParam() userContext: IUserContext,
    @Payload() data: MeetingChangeMessagingPermissionDto
  ) {
    await this.meetingService.changeMessagingPermissions(userContext, data);
  }

  @Post('close')
  @EventPattern(
    matrixPattern.roomEvent(RoomEventName.NIC_MEETINGS_MEETING_CLOSE)
  )
  async close(
    @UserContextParam() userContext: IUserContext,
    @Payload() data: MeetingCloseDto
  ) {
    await this.meetingService.closeMeeting(userContext, data);
  }

  @EventPattern(
    matrixPattern.roomEvent(
      RoomEventName.NIC_MEETINGS_SUB_MEETINGS_SEND_MESSAGE
    )
  )
  async subMeetingsSendMessage(
    @UserContextParam() userContext: IUserContext,
    @Payload() data: SubMeetingsSendMessageDto
  ) {
    await this.meetingService.subMeetingsSendMessage(userContext, data);
  }

  @EventPattern(
    matrixPattern.roomEvent(
      RoomEventName.NIC_MEETINGS_MEETING_PARTICIPANTS_HANDLE
    )
  )
  async participantsHandle(
    @UserContextParam() userContext: IUserContext,
    @Payload() data: MeetingParticipantsHandleDto
  ) {
    await this.meetingService.handleParticipants(userContext, data);
  }

  @EventPattern(
    matrixPattern.roomEvent(RoomEventName.NIC_MEETINGS_MEETING_WIDGETS_HANDLE)
  )
  async widgetsHandle(
    @UserContextParam() userContext: IUserContext,
    @Payload() data: MeetingWidgetsHandleDto
  ) {
    await this.meetingService.handleWidgets(userContext, data);
  }

  @Get(':roomId/sharingInformation')
  async sharingInformation(
    @Param('roomId') room_id: string
  ): Promise<MeetingSharingInformationDto> {
    return await this.meetingService.getSharingInformationAsync(room_id);
  }
}
