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

import { Inject, Injectable, Logger } from '@nestjs/common';
import i18next from 'i18next';
import { MatrixClient, MessageEventContent } from 'matrix-bot-sdk';
import { AppRuntimeContext } from '../AppRuntimeContext';
import { IAppConfiguration } from '../IAppConfiguration';
import { ModuleProviderToken } from '../ModuleProviderToken';
import { TranslatableError } from '../error/TranslatableError';
import { IRoomEvent } from '../matrix/event/IRoomEvent';
import { StateEventName } from '../model/StateEventName';
import { WelcomeWorkflowService } from './WelcomeWorkflowService';

const TRIGGER = '!meeting';

export const HELP_COMMANDS: string[] = ['help', 'h'];
export const STATUS_COMMANDS: string[] = ['status', 'stat'];
export const SETUP_COMMANDS: string[] = ['setup', 'addwidget'];
export const LANG_COMMANDS: string[] = ['lang', 'language'];

@Injectable()
export class CommandService {
  private logger = new Logger(CommandService.name);

  private readonly botUserId: string;

  constructor(
    private readonly matrixClient: MatrixClient,
    private readonly welcomeWorkflowService: WelcomeWorkflowService,
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private readonly appConfig: IAppConfiguration,
    appRuntimeContext: AppRuntimeContext,
  ) {
    this.botUserId = appRuntimeContext.botUserId;
  }

  public async handleRoomMessage(
    roomId: string,
    event: IRoomEvent<MessageEventContent>,
  ) {
    if (!this.appConfig.enable_welcome_workflow) return;

    const { content: { msgtype = '' } = {} } = event;
    if (msgtype !== 'm.text') return;

    const triggers: string[] = [TRIGGER, this.botUserId];
    const body: string = event.content.body;

    const triggered = triggers.find((trigger) => body.startsWith(trigger));
    if (!triggered) return;

    const withoutTrigger = body.substring(triggered.length).trim();
    const args: string[] = withoutTrigger.split(' ');

    if (withoutTrigger.length === 0) {
      this.logger.verbose(
        `commandErrors.noCommandProvided triggered: ${triggered}`,
      );
      return this.replyWithError(
        roomId,
        event,
        'commandErrors.noCommandProvided',
        { trigger: TRIGGER },
      );
    }

    const commandName = args[0];
    const cmdArgs = args.slice(1);

    try {
      await this.processCommand(commandName, roomId, event, cmdArgs);
    } catch (e) {
      if (e instanceof TranslatableError) {
        this.logger.debug(
          `TranslatableError errorKey: ${e.errorKey} commandName: ${commandName}`,
        );
        await this.replyWithError(
          roomId,
          event,
          e.errorKey,
          e.translationParams,
        );
      } else if (e instanceof Error) {
        this.logger.debug(
          `commandErrors.generic commandName: ${commandName} error: ${e.message}`,
        );
        await this.replyWithError(roomId, event, 'commandErrors.generic', {
          message: e.message,
        });
      } else {
        this.logger.debug(
          `commandErrors.generic commandName: ${commandName} error: ${e}`,
        );
        await this.replyWithError(roomId, event, 'commandErrors.generic', {
          message: 'internal error',
        });
      }
    }
  }

  private async processCommand(
    commandName: string,
    roomId: string,
    event: IRoomEvent<MessageEventContent>,
    cmdArgs: string[],
  ) {
    const sender = event.sender;
    this.logger.debug(`${sender} is running command: ${commandName}`);

    if (HELP_COMMANDS.includes(commandName)) {
      const { displayname: botDisplayName } =
        await this.matrixClient.getUserProfile(this.botUserId);
      const lng: string = await this.detectLocale(roomId);

      const html: string = i18next.t('commandHelp', {
        lng,
        botDisplayName,
        joinArrays: '',
      });
      await this.matrixClient.sendHtmlText(roomId, html);
    } else if (LANG_COMMANDS.includes(commandName)) {
      await this.welcomeWorkflowService.handleLanguageChange(
        roomId,
        event,
        cmdArgs,
      );
    } else if (SETUP_COMMANDS.includes(commandName)) {
      await this.welcomeWorkflowService.handleAddWidgetCommand(roomId);
    } else if (STATUS_COMMANDS.includes(commandName)) {
      await this.welcomeWorkflowService.handleStatusCommand(roomId);
    } else {
      this.logger.verbose(
        `commandErrors.badCommand commandName: ${commandName}`,
      );
      await this.replyWithError(roomId, event, 'commandErrors.badCommand', {
        trigger: TRIGGER,
      });
    }
  }

  private async replyWithError(
    roomId: string,
    event: any,
    errorKey: string,
    params: any,
  ) {
    const lng: string = await this.detectLocale(roomId);
    /*
     * IMPORTANT: This comment defines the keys used for this function and is used to extract them via i18next-parser
     *
     * t('commandErrors.noCommandProvided', 'No command provided, try {{trigger}} help')
     * t('commandErrors.generic', 'There was an error processing your command: {{message}}')
     * t('commandErrors.badCommand', 'Bad command, try {{trigger}} help')
     *
     */
    // TODO: fix the types of i18next
    const text: string = i18next.t(errorKey, {
      lng,
      ...params,
    }) as unknown as string;
    this.logger.debug(`Replying with error: ${roomId} ${event} ${text}`);
    await this.matrixClient.replyText(roomId, event, text, text);
  }

  // detects the locale in the private room, or returns default
  private async detectLocale(roomId: string): Promise<string> {
    try {
      // TODO: extract this into a common service or cache
      const ctx = await this.matrixClient.getRoomStateEvent(
        roomId,
        StateEventName.NIC_MEETINGS_WELCOME_ROOM,
        this.botUserId,
      );
      return ctx?.locale ?? this.appConfig.welcome_workflow_default_locale;
    } catch (e) {
      this.logger.warn(
        `Can't detect locale in room: ${roomId} using ${StateEventName.NIC_MEETINGS_WELCOME_ROOM} event.`,
      );
    }
    // default
    return this.appConfig.welcome_workflow_default_locale;
  }
}
