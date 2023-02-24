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

import { MatrixClient } from 'matrix-bot-sdk';
import {
  anyString,
  anything,
  capture,
  instance,
  mock,
  resetCalls,
  verify,
  when,
} from 'ts-mockito';
import { MeetingClient } from '../src/client/MeetingClient';
import { EventContentRenderer } from '../src/EventContentRenderer';
import { IAppConfiguration } from '../src/IAppConfiguration';
import { MatrixEndpoint } from '../src/MatrixEndpoint';
import { IMeeting } from '../src/model/IMeeting';
import { IUserContext } from '../src/model/IUserContext';
import { MeetingType } from '../src/model/MeetingType';
import { RoomMessageService } from '../src/service/RoomMessageService';
import { meetingChangesHelper } from '../src/util/IMeetingChanges';
import { createAppConfig } from './util/MockUtils';

describe('test RoomMessageService', () => {
  const matrixClientMock = mock(MatrixClient);
  let roomMessageService: RoomMessageService;
  const userId = 'user_id';
  const roomId = 'room_id';
  const eventId = 'event_id';
  const appConfig: IAppConfiguration = createAppConfig();
  const fetchResultWithRightUser = {
    rooms: {
      join: {
        '!CzfdAmuKWDLHyIwzTu:synapse.dev.nordeck.systems': {
          state: {
            events: [
              {
                content: {
                  userId,
                },
              },
            ],
          },
        },
      },
      invite: {},
    },
  };
  const initMeeting = () => {
    const meeting: IMeeting = {
      roomId,
      title: 'title',
      description: 'description',
      startTime: '2022-01-16T22:07:21.488Z',
      endTime: '3022-12-16T22:07:21.488Z',
      widgetIds: [],
      participants: [],
      creator: 'creator',
      type: MeetingType.MEETING,
    };
    return meeting;
  };
  const userContext: IUserContext = {
    locale: 'en',
    timezone: 'UTC',
    userId,
  };

  beforeEach(() => {
    resetCalls(matrixClientMock);
    const client = instance(matrixClientMock);
    const eventContentRenderer = new EventContentRenderer(appConfig);
    const meetingClient = new MeetingClient(client, eventContentRenderer);

    roomMessageService = new RoomMessageService(client, meetingClient);
    const fetchResult = {
      rooms: {
        join: {},
        invite: {},
      },
    };

    when(
      matrixClientMock.doRequest(
        'GET',
        MatrixEndpoint.MATRIX_CLIENT_SYNC,
        anything()
      )
    ).thenResolve(fetchResult);
    when(matrixClientMock.sendHtmlText(anyString(), anything())).thenResolve(
      eventId
    );
    when(matrixClientMock.createRoom(anything())).thenResolve(roomId);
    when(matrixClientMock.getUserId()).thenResolve(userId);
    when(matrixClientMock.sendMessage(anyString(), anything())).thenResolve(
      eventId
    );
    when(matrixClientMock.getUserProfile(anyString())).thenResolve('username');
  });

  it('test that a private message causes a room to be created when there is none', async () => {
    await roomMessageService.sendHtmlMessageToErrorPrivateRoom(
      userId,
      'asdfasdf'
    );
    verify(matrixClientMock.createRoom(anything())).times(1);
    verify(matrixClientMock.sendHtmlText(roomId, anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toEqual('asdfasdf');
  });

  it('test that a private message does not cause a room to be created if a suitable one already exists', async () => {
    when(
      matrixClientMock.doRequest(
        'GET',
        MatrixEndpoint.MATRIX_CLIENT_SYNC,
        anything()
      )
    ).thenResolve(fetchResultWithRightUser);
    await roomMessageService.sendHtmlMessageToErrorPrivateRoom(
      userId,
      'asdfasdf'
    );
    verify(matrixClientMock.createRoom(anything())).times(0);
    verify(
      matrixClientMock.sendHtmlText(
        '!CzfdAmuKWDLHyIwzTu:synapse.dev.nordeck.systems',
        anything()
      )
    ).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toEqual('asdfasdf');
  });

  it('test do not send a change-message if no values inside the meeting are changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(0);
  });

  it('test to send a message, that contains information about the title change, if title of meeting is changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    oldMeeting.title = 'changed';
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toContain('Title: title');
    expect(msg).toContain('previously: changed');
    expect(msg).not.toContain('Description: description');
  });

  it('test to send a message, that contains information about the description change, if description of meeting is changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    oldMeeting.description = 'changed';
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).not.toContain('Title: title');
    expect(msg).toContain('Description: description');
    expect(msg).toContain('previously: changed');
  });

  it('test to send a message, that contains information about the time-range change, if starttime of meeting is changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    oldMeeting.startTime = '2024-01-16T22:07:21.488Z';
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toContain(
      'Date: 01/16/2022 10:07 PM UTC to 12/16/3022 10:07 PM UTC'
    );
    expect(msg).toContain(
      '(previously: 01/16/2024 10:07 PM UTC to 12/16/3022 10:07 PM UTC)'
    );
    expect(msg).not.toContain('Title: title');
    expect(msg).not.toContain('Description: description');
  });

  it('test to send a message, that contains information about the time-range change, if endtime of meeting is changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    oldMeeting.endTime = '3024-12-16T22:07:21.488Z';
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toContain(
      'Date: 01/16/2022 10:07 PM UTC to 12/16/3022 10:07 PM UTC'
    );
    expect(msg).toContain(
      '(previously: 01/16/2022 10:07 PM UTC to 12/16/3024 10:07 PM UTC)'
    );
    expect(msg).not.toContain('Title: title');
    expect(msg).not.toContain('Description: description');
  });
});
