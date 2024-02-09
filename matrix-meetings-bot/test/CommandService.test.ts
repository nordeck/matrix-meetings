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

import { MatrixClient, MessageEventContent } from 'matrix-bot-sdk';
import {
  anyString,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito';
import { AppRuntimeContext } from '../src/AppRuntimeContext';
import { IAppConfiguration } from '../src/IAppConfiguration';
import { TranslatableError } from '../src/error/TranslatableError';
import { IRoomEvent } from '../src/matrix/event/IRoomEvent';
import { StateEventName } from '../src/model/StateEventName';
import { CommandService, SETUP_COMMANDS } from '../src/service/CommandService';
import { WelcomeWorkflowService } from '../src/service/WelcomeWorkflowService';
import { createAppConfig } from './util/MockUtils';

describe('test CommandService', () => {
  const ROOM_ID = 'roomId';
  const USER_ID = 'userId';
  const BOT_ID = '@bot:matrix.com';

  const appConfig: IAppConfiguration = {
    ...createAppConfig(),
    welcome_workflow_default_locale: 'de', // <= default locale
  };

  const privateRoomMarkerEvent = {
    roomId: ROOM_ID,
    originalRoomName: 'originalRoomName',
    originalRoomId: 'originalRoomId',
    locale: 'en', // <= locale in the private room
    userId: USER_ID,
    userDisplayName: 'displayname',
  };

  const matrixClientMock = mock(MatrixClient);
  let welcomeWorkflowService: WelcomeWorkflowService;
  let commandService: CommandService;

  const createEvent = () =>
    ({
      event_id: 'some_event_id',
      sender: 'sender@matrix.org',
      content: {
        body: '!meeting help',
        msgtype: 'm.text',
      },
      origin_server_ts: Date.now(),
    }) as IRoomEvent<MessageEventContent>;

  const appRuntimeContext: AppRuntimeContext = new AppRuntimeContext(
    BOT_ID,
    '',
    '',
    ['en'],
  );

  const captureSendHtmlText = () => {
    return capture(matrixClientMock.sendHtmlText).first()[1] as string;
  };

  const makeRoomPublic = (roomId = ROOM_ID) => {
    when(
      matrixClientMock.getRoomStateEvent(
        roomId,
        StateEventName.NIC_MEETINGS_WELCOME_ROOM,
        appRuntimeContext.botUserId,
      ),
    ).thenThrow(new Error('no NIC_MEETINGS_WELCOME_ROOM event'));
  };

  const makeRoomPrivate = (roomId = ROOM_ID) => {
    when(
      matrixClientMock.getRoomStateEvent(
        roomId,
        StateEventName.NIC_MEETINGS_WELCOME_ROOM,
        appRuntimeContext.botUserId,
      ),
    ).thenResolve(privateRoomMarkerEvent);
  };

  beforeEach(() => {
    welcomeWorkflowService = mock(WelcomeWorkflowService);
    commandService = new CommandService(
      instance(matrixClientMock),
      instance(welcomeWorkflowService),
      appConfig,
      appRuntimeContext,
    );

    when(matrixClientMock.getUserProfile(BOT_ID)).thenResolve({
      displayname: BOT_ID,
    });
  });

  afterEach(() => {
    reset(matrixClientMock);
  });

  test('handleRoomMessage help command', async () => {
    const event = createEvent();
    event.content.body = '!meeting help';
    await commandService.handleRoomMessage(ROOM_ID, event);
    verify(matrixClientMock.sendHtmlText(ROOM_ID, anyString())).once();
    const txt = captureSendHtmlText();
    expect(txt).toMatch(/Verfügbare Befehle:/);
  });

  test('handleRoomMessage a custom command', async () => {
    const event = createEvent();
    event.content.body = `!meeting ${SETUP_COMMANDS[0]}`;
    await commandService.handleRoomMessage(ROOM_ID, event);
    verify(welcomeWorkflowService.handleAddWidgetCommand(ROOM_ID)).once();
  });

  test('ignores msgtype other than m.text', async () => {
    const event = createEvent();
    event.content.msgtype = 'm.emote';
    event.content.body = `!meeting ${SETUP_COMMANDS[0]}`;
    await commandService.handleRoomMessage(ROOM_ID, event);
    verify(matrixClientMock.sendHtmlText(ROOM_ID, anyString())).never();
    verify(welcomeWorkflowService.handleAddWidgetCommand(ROOM_ID)).never();
  });

  test('ignore when no trigger', async () => {
    const event = createEvent();
    event.content.body = `doesn't start with a trigger !meeting ${SETUP_COMMANDS[0]}`;
    await commandService.handleRoomMessage(ROOM_ID, event);
    verify(matrixClientMock.sendHtmlText(ROOM_ID, anyString())).never();
    verify(welcomeWorkflowService.handleAddWidgetCommand(ROOM_ID)).never();
  });

  test('error when no command', async () => {
    const event = createEvent();
    event.content.body = '!meeting';
    await commandService.handleRoomMessage(ROOM_ID, event);
    verify(matrixClientMock.sendHtmlText(ROOM_ID, anyString())).never();
    // expect(callCount).toBe(0); // TODO: MA

    const txt = capture(matrixClientMock.replyText).last()[2];
    expect(txt).toEqual(
      'Der Befehl steht nicht zur Verfügung. Schreibe <code>!meeting help</code>',
    );
  });

  test('error when invalid command', async () => {
    const event = createEvent();
    event.content.body = '!meeting bad';
    await commandService.handleRoomMessage(ROOM_ID, event);
    verify(matrixClientMock.sendHtmlText(ROOM_ID, anyString())).never();
    // expect(callCount).toBe(0); // TODO: MA

    const txt = capture(matrixClientMock.replyText).last()[2];
    expect(txt).toEqual(
      'Der Hilfe-Befehl ist leider nicht richtig. Schreibe <code>!meeting help</code>',
    );
  });

  test('error NicError during command handle', async () => {
    const event = createEvent();
    event.content.body = `!meeting ${SETUP_COMMANDS[0]}`;
    when(welcomeWorkflowService.handleAddWidgetCommand(ROOM_ID)).thenThrow(
      new TranslatableError('commandErrors.generic', {
        message: 'example',
      }),
    );
    await commandService.handleRoomMessage(ROOM_ID, event);

    const txt = capture(matrixClientMock.replyText).last()[2];
    expect(txt).toEqual(
      'Leider konnte Dein Befehl nicht korrekt ausgeführt werden: example',
    );
  });

  test('error Error during command handle', async () => {
    const event = createEvent();
    event.content.body = `!meeting ${SETUP_COMMANDS[0]}`;

    const errMsg = 'Error';
    when(welcomeWorkflowService.handleAddWidgetCommand(ROOM_ID)).thenThrow(
      new Error(errMsg),
    );
    await commandService.handleRoomMessage(ROOM_ID, event);

    const txt = capture(matrixClientMock.replyText).last()[2];
    expect(txt).toEqual(
      'Leider konnte Dein Befehl nicht korrekt ausgeführt werden: Error',
    );
  });

  test('locale detection in private room', async () => {
    makeRoomPrivate(ROOM_ID);
    const event = createEvent();
    event.content.body = '!meeting help';
    await commandService.handleRoomMessage(ROOM_ID, event);
    const txt = captureSendHtmlText();
    // expect a custom locale from the private room
    expect(txt).toMatch(/Available commands:/);
  });

  test('locale detection in public room', async () => {
    makeRoomPublic(ROOM_ID);
    const event = createEvent();
    event.content.body = '!meeting help';
    await commandService.handleRoomMessage(ROOM_ID, event);
    const txt = captureSendHtmlText();
    // expect the default locale from the appConfig
    expect(txt).toMatch(/Verfügbare Befehle:/);
  });
});
