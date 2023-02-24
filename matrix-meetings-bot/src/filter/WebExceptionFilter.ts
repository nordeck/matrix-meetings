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
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import i18next from 'i18next';
import { MatrixClient } from 'matrix-bot-sdk';
import { ReactionClient } from '../client/ReactionClient';
import { IAppConfiguration } from '../IAppConfiguration';
import { IRoomEvent } from '../matrix/event/IRoomEvent';
import { StateEventName } from '../model/StateEventName';
import { ModuleProviderToken } from '../ModuleProviderToken';
import { IHandlerArguments } from '../rpc/MatrixServer';
import { RoomMessageService } from '../service/RoomMessageService';

@Catch()
export class WebExceptionFilter extends BaseExceptionFilter {
  private logger = new Logger(WebExceptionFilter.name);

  constructor(
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private appConfig: IAppConfiguration,
    private adapterHost: HttpAdapterHost,
    private matrixClient: MatrixClient,
    private roomMessageService: RoomMessageService,
    private reactionClient: ReactionClient
  ) {
    super(adapterHost.httpAdapter.getHttpServer());
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      this.catchHttpError(exception, host);
    } else if (host.getType() === 'rpc') {
      const args: IHandlerArguments = {
        data: host.getArgByIndex(0),
        context: host.getArgByIndex(1),
      };

      await this.catchRpcError(exception, args);
    } else {
      throw new Error(`unsupported context type: ${host.getType()}`);
    }
  }

  private catchHttpError(exception: any, host: ArgumentsHost) {
    let exceptionPropagate: unknown;

    this.logger.error(exception);
    if (exception instanceof HttpException) {
      exceptionPropagate = exception;
    } else {
      exceptionPropagate = new HttpException(
        (exception as Error).message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // super is not a promise
    // eslint-disable-next-line promise/valid-params
    super.catch(exceptionPropagate, host);
  }

  private async catchRpcError(exception: any, args: IHandlerArguments) {
    const error: any = exception;
    const errCode = error?.statusCode;

    if (errCode === 429) {
      // LIMIT_EXCEEDED
      this.logger.error(error, 'Fatal error. Bot should not be rate-limited');
    } else {
      const context = args.context;
      const roomId: string = context.roomId;
      const event: IRoomEvent<unknown> = context.event;

      let roomName = '';
      const errorName = error.constructor.name;
      const requestId = context.userContext.requestId;
      try {
        const nameEvent = await this.matrixClient.getRoomStateEvent(
          roomId,
          StateEventName.M_ROOM_NAME_EVENT,
          ''
        );
        roomName = nameEvent?.name;
      } catch (err) {
        this.logger.warn(
          `Can not fetch room name for ${roomId} while sending a message`
        );
      }

      let privateRoomId: string | undefined;
      try {
        const errorMessage = i18next.t(
          'base.exception.message',
          'An error "{{errorName}}" occurred while processing events for the room {{roomId}} {{roomName}}. <br> Please provide this number: [{{requestId}}] for further questions.',
          {
            lng: 'en',
            requestId,
            roomId,
            roomName,
            errorName,
          }
        );
        const eventString = event ? JSON.stringify(event) : '';
        this.logger.error(
          error,
          '%s %s %s %s %s ',
          requestId,
          errorName,
          errorMessage,
          eventString,
          error.stack
        );

        if (this.appConfig.enable_private_room_error_sending) {
          privateRoomId =
            await this.roomMessageService.sendHtmlMessageToErrorPrivateRoom(
              context.userContext.userId,
              errorMessage
            );
        }
      } catch (e) {
        this.logger.error(
          e,
          `Could not send message to private room for user ${context.userContext.userId}`
        );
      }

      try {
        await this.reactionClient.sendFailure(
          roomId,
          privateRoomId,
          event.event_id
        );
      } catch (e) {
        this.logger.warn(
          `Could not send failure for user ${context.userContext.userId} and room : ${roomId}`
        );
      }
    }
  }
}
