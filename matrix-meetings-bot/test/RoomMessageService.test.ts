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
import { EventContentRenderer } from '../src/EventContentRenderer';
import { IAppConfiguration } from '../src/IAppConfiguration';
import { MatrixEndpoint } from '../src/MatrixEndpoint';
import { MeetingClient } from '../src/client/MeetingClient';
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
  const initMeeting = (rrule?: string) => {
    const meeting: IMeeting = {
      roomId,
      title: 'title',
      description: 'description',
      calendar: [
        {
          uid: 'uuid',
          dtstart: { tzid: 'UTC', value: '20220116T090000' },
          dtend: { tzid: 'UTC', value: '20220116T100000' },
          rrule,
        },
      ],
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
        anything(),
      ),
    ).thenResolve(fetchResult);
    when(matrixClientMock.sendHtmlText(anyString(), anything())).thenResolve(
      eventId,
    );
    when(matrixClientMock.createRoom(anything())).thenResolve(roomId);
    when(matrixClientMock.getUserId()).thenResolve(userId);
    when(matrixClientMock.sendMessage(anyString(), anything())).thenResolve(
      eventId,
    );
    when(matrixClientMock.getUserProfile(anyString())).thenResolve('username');
  });

  it('test that a private message causes a room to be created when there is none', async () => {
    await roomMessageService.sendHtmlMessageToErrorPrivateRoom(
      userId,
      'asdfasdf',
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
        anything(),
      ),
    ).thenResolve(fetchResultWithRightUser);
    await roomMessageService.sendHtmlMessageToErrorPrivateRoom(
      userId,
      'asdfasdf',
    );
    verify(matrixClientMock.createRoom(anything())).times(0);
    verify(
      matrixClientMock.sendHtmlText(
        '!CzfdAmuKWDLHyIwzTu:synapse.dev.nordeck.systems',
        anything(),
      ),
    ).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toEqual('asdfasdf');
  });

  it('test do not send a change-message if no values inside the meeting are changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting,
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId,
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(0);
  });

  it('test to send a message, that contains information about the title change, if title of meeting is changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    oldMeeting.title = 'changed';
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting,
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId,
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toContain('Title: title');
    expect(msg).toContain('previously: changed');
    expect(msg).not.toContain('Description: description');
    expect(msg).not.toContain('Repeat meeting');
  });

  it('test to send a message, that contains information about the description change, if description of meeting is changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    oldMeeting.description = 'changed';
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting,
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId,
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).not.toContain('Title: title');
    expect(msg).toContain('Description: description');
    expect(msg).toContain('previously: changed');
    expect(msg).not.toContain('Repeat meeting');
  });

  it('test to send a message, that contains information about the time-range change, if starttime of meeting is changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    if (newMeeting.calendar) {
      newMeeting.calendar[0].dtstart.value = '20220116T080000';
    }
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting,
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId,
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toContain('Date: January 16, 2022, 8:00 – 10:00 AM UTC');
    expect(msg).toContain(
      '(previously: January 16, 2022, 9:00 – 10:00 AM UTC)',
    );
    expect(msg).not.toContain('Title: title');
    expect(msg).not.toContain('Description: description');
    expect(msg).not.toContain('Repeat meeting');
  });

  it('test to send a message, that contains information about the time-range change, if endtime of meeting is changed', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting();
    if (newMeeting.calendar) {
      newMeeting.calendar[0].dtend.value = '20220116T110000';
    }
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting,
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId,
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toContain('Date: January 16, 2022, 9:00 – 11:00 AM UTC');
    expect(msg).toContain(
      '(previously: January 16, 2022, 9:00 – 10:00 AM UTC)',
    );
    expect(msg).not.toContain('Title: title');
    expect(msg).not.toContain('Description: description');
    expect(msg).not.toContain('Repeat meeting');
  });

  it('test to send a message, that contains information about the repetition change, if repetition is added', async () => {
    const oldMeeting = initMeeting();
    const newMeeting = initMeeting('FREQ=MONTHLY');
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting,
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId,
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toContain('Repeat meeting: Every month');
    expect(msg).toContain('(previously: No repetition)');
    expect(msg).not.toContain('Title: title');
    expect(msg).not.toContain('Date:');
    expect(msg).not.toContain('Description: description');
  });

  it('test to send a message, that contains information about the repetition change, if repetition is updated', async () => {
    const oldMeeting = initMeeting('FREQ=DAILY');
    const newMeeting = initMeeting('FREQ=MONTHLY');
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting,
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId,
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toContain('Repeat meeting: Every month');
    expect(msg).toContain('(previously: Every day)');
    expect(msg).not.toContain('Title: title');
    expect(msg).not.toContain('Date:');
    expect(msg).not.toContain('Description: description');
  });

  it('test to send a message, that contains information about the repetition change, if repetition is deleted', async () => {
    const oldMeeting = initMeeting('FREQ=MONTHLY');
    const newMeeting = initMeeting();
    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting,
    );
    await roomMessageService.notifyMeetingTimeChangedAsync(
      userContext,
      oldMeeting,
      newMeeting,
      meetingChanges,
      roomId,
    );
    verify(matrixClientMock.sendHtmlText(anyString(), anything())).times(1);
    const msg = capture(matrixClientMock.sendHtmlText).first()[1];
    expect(msg).toContain('Repeat meeting: No repetition');
    expect(msg).toContain('(previously: Every month)');
    expect(msg).not.toContain('Title: title');
    expect(msg).not.toContain('Date:');
    expect(msg).not.toContain('Description: description');
  });
});
