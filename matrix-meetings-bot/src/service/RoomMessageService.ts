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

import { Injectable, Logger } from '@nestjs/common';
import { parseICalDate } from '@nordeck/matrix-meetings-calendar';
import i18next from 'i18next';
import { MatrixClient } from 'matrix-bot-sdk';
import { MatrixEndpoint } from '../MatrixEndpoint';
import { MeetingClient } from '../client/MeetingClient';
import { fullLongDateFormat } from '../dateFormat';
import { ISyncParams } from '../matrix/dto/ISyncParams';
import { IMeeting } from '../model/IMeeting';
import { IUserContext } from '../model/IUserContext';
import { StateEventName } from '../model/StateEventName';
import { IMeetingChanges } from '../util/IMeetingChanges';
import { formatRRuleText } from '../util/format';

@Injectable()
export class RoomMessageService {
  private logger = new Logger(RoomMessageService.name);

  constructor(
    readonly client: MatrixClient,
    readonly meetingClient: MeetingClient,
  ) {}

  public async sendHtmlMessageToErrorPrivateRoom(
    userId: string,
    message: string,
  ) {
    const privateRoomId = await this.setupErrorPrivateRoom(userId);
    await this.client.sendHtmlText(privateRoomId, message);
    return privateRoomId;
  }

  private async setupErrorPrivateRoom(userId: string): Promise<string> {
    const roomName = i18next.t(
      'bot.private.errorRoom.create.message',
      'Error messages from NeoDateFix-Bot',
    );
    const topic = i18next.t(
      'bot.private.errorRoom.create.topic',
      'More details',
    );
    const htmlReason = `<table><tr><td><b>${topic}</b></td></tr></table>`;

    // only create one private room per userId
    const directMessageRoomIds = await this.findDirectMessageRoomsForUser(
      userId,
      StateEventName.NIC_MEETINGS_PRIVATE_BOT_MESSAGES_ROOM_TYPE,
    );

    if (directMessageRoomIds.length > 0) {
      const privateRoomId: string = directMessageRoomIds[0].roomId;
      try {
        // Try to invite the user, in case they have left the room
        await this.meetingClient.inviteUserToPrivateRoom(
          userId,
          privateRoomId,
          topic,
          htmlReason,
        );
      } catch (e) {
        // Do not throw an exception if invite fails (user is in the room)
        this.logger.debug(
          `setupErrorPrivateRoom: failed to invite to room ${privateRoomId}`,
          e,
        );
      }
      return privateRoomId;
    }

    return await this.createAndInviteToErrorPrivateChatRoom(
      userId,
      roomName,
      topic,
    );
  }

  private async createAndInviteToErrorPrivateChatRoom(
    userId: string,
    roomName: string,
    topic: string,
  ): Promise<string> {
    const privateRoomId = await this.client.createRoom({
      name: roomName,
      topic,
      preset: 'trusted_private_chat',
      invite: [userId],
      initial_state: [
        {
          type: 'm.room.guest_access',
          state_key: '',
          content: { guest_access: 'forbidden' },
        },
        {
          type: 'm.room.history_visibility',
          state_key: '',
          content: { history_visibility: 'shared' },
        },
        {
          type: StateEventName.NIC_MEETINGS_PRIVATE_BOT_MESSAGES_ROOM_TYPE,
          state_key: await this.client.getUserId(),
          content: { userId },
        },
      ],
      visibility: 'private',
      is_direct: true,
    });

    const htmlReason = `<table><tr><td><b>${topic}</b></td></tr></table>`;
    await this.meetingClient.inviteUserToPrivateRoom(
      userId,
      privateRoomId,
      topic,
      htmlReason,
    );
    return privateRoomId;
  }

  public async findDirectMessageRoomsForUser(
    userId: string,
    markerStateEvent: StateEventName,
  ): Promise<{ roomId: string; content: any }[]> {
    const NO_EVENTS = { not_types: ['*'] };
    const filter = {
      account_data: NO_EVENTS,
      event_fields: ['content'],
      presence: NO_EVENTS,
      room: {
        state: {
          types: [markerStateEvent],
          senders: [await this.client.getUserId()],
        },
        timeline: NO_EVENTS,
        account_data: NO_EVENTS,
        ephemeral: NO_EVENTS,
      },
    };

    const qs: ISyncParams = {
      filter: JSON.stringify(filter),
      full_state: false,
      timeout: 60000,
    };

    const privateRoomIds: { roomId: string; content: any }[] = [];

    const syncResponse = await this.client.doRequest(
      'GET',
      MatrixEndpoint.MATRIX_CLIENT_SYNC,
      qs,
    );
    if (!syncResponse.rooms) return [];

    // only interested in rooms that the bot have joined
    const syncRoomJoin: { [id: string]: any } = syncResponse.rooms.join || {};

    // extract room IDs that bot created only for the userId
    for (const roomId in syncRoomJoin) {
      const events: any[] = syncRoomJoin[roomId].state.events;

      events
        .filter((o) => o.content.userId === userId)
        .forEach((o) =>
          privateRoomIds.push({
            roomId,
            content: o.content || {},
          }),
        );
    }
    return privateRoomIds;
  }

  public async notifyMeetingTimeChangedAsync(
    userContext: IUserContext,
    oldMeeting: IMeeting,
    newMeeting: IMeeting,
    meetingChanges: IMeetingChanges,
    toRoomId: string,
  ): Promise<void> {
    const lng = userContext.locale ? userContext.locale : 'en';
    const timeZone = userContext.timezone ? userContext.timezone : 'UTC';

    if (!meetingChanges.anythingChanged) return;

    let notification = '';

    if (
      !meetingChanges.calendarChanges.some(
        (e) =>
          e.changeType !== 'updateSingleOrRecurringTime' &&
          e.changeType !== 'updateSingleOrRecurringRrule',
      )
    ) {
      notification += formatCurrent(
        i18next.t('meeting.room.notification.changed.headLine', 'CHANGES', {
          lng,
        }),
      );
    }

    if (meetingChanges.titleChanged) {
      notification += formatCurrent(
        i18next.t(
          'meeting.room.notification.changed.title.current',
          'Title: {{title}}',
          { lng, title: newMeeting.title },
        ),
      );
      notification += formatPrevious(
        i18next.t(
          'meeting.room.notification.changed.title.previous',
          '(previously: {{title}})',
          { lng, title: oldMeeting.title },
        ),
      );
    }

    for (const change of meetingChanges.calendarChanges) {
      if (change.changeType === 'updateSingleOrRecurringTime') {
        notification += formatCurrent(
          i18next.t(
            'meeting.room.notification.changed.date.current',
            'Date: {{range, daterange}}',
            {
              lng,
              range: [
                parseICalDate(change.newValue.dtstart).toJSDate(),
                parseICalDate(change.newValue.dtend).toJSDate(),
              ],
              formatParams: {
                range: {
                  timeZone,
                  ...fullLongDateFormat,
                },
              },
            },
          ),
        );

        notification += formatPrevious(
          i18next.t(
            'meeting.room.notification.changed.date.previous',
            '(previously: {{range, daterange}})',
            {
              lng,
              range: [
                parseICalDate(change.oldValue.dtstart).toJSDate(),
                parseICalDate(change.oldValue.dtend).toJSDate(),
              ],
              formatParams: {
                range: {
                  timeZone,
                  ...fullLongDateFormat,
                },
              },
            },
          ),
        );
      }
    }

    if (meetingChanges.descriptionChanged) {
      notification += formatCurrent(
        i18next.t(
          'meeting.room.notification.changed.description.current',
          'Description: {{description}}',
          { lng, description: newMeeting.description },
        ),
      );
      notification += formatPrevious(
        i18next.t(
          'meeting.room.notification.changed.description.previous',
          '(previously: {{description}})',
          { lng, description: oldMeeting.description },
        ),
      );
    }

    for (const change of meetingChanges.calendarChanges) {
      if (change.changeType === 'updateSingleOrRecurringRrule') {
        const newRrule = change.newValue;
        const newRruleText = newRrule
          ? formatRRuleText(newRrule, i18next.t, lng)
          : i18next.t(
              'meeting.room.notification.noRepetition',
              'No repetition',
              {
                lng,
              },
            );
        notification += formatCurrent(
          i18next.t(
            'meeting.room.notification.changed.repetition.current',
            'Repeat meeting: {{repetitionText}}',
            { lng, repetitionText: newRruleText },
          ),
        );

        const oldRrule = change.oldValue;
        const oldRruleText = oldRrule
          ? formatRRuleText(oldRrule, i18next.t, lng)
          : i18next.t(
              'meeting.room.notification.noRepetition',
              'No repetition',
              {
                lng,
              },
            );
        notification += formatPrevious(
          i18next.t(
            'meeting.room.notification.changed.repetition.previous',
            '(previously: {{repetitionText}})',
            { lng, repetitionText: oldRruleText },
          ),
        );
      }
    }

    for (const change of meetingChanges.calendarChanges) {
      if (
        change.changeType === 'addOverride' ||
        change.changeType === 'updateOverride'
      ) {
        const start: Date = parseICalDate(change.value.dtstart).toJSDate();
        const end: Date = parseICalDate(change.value.dtend).toJSDate();

        notification += formatCurrent(
          i18next.t(
            'meeting.room.notification.changed.occurrence.current',
            'A single meeting from a meeting series is moved to {{range, daterange}}',
            {
              lng,
              range: [start, end],
              formatParams: {
                range: {
                  timeZone,
                  ...fullLongDateFormat,
                },
              },
            },
          ),
        );

        const [prevStart, prevEnd] =
          change.changeType === 'addOverride'
            ? [
                parseICalDate(change.oldDtstart).toJSDate(),
                parseICalDate(change.oldDtend).toJSDate(),
              ]
            : [
                parseICalDate(change.oldValue.dtstart).toJSDate(),
                parseICalDate(change.oldValue.dtend).toJSDate(),
              ];

        notification += formatPrevious(
          i18next.t(
            'meeting.room.notification.changed.occurrence.previous',
            '(previously: {{value, daterange}})',
            {
              lng,
              value: [prevStart, prevEnd],
              formatParams: {
                value: {
                  timeZone,
                  ...fullLongDateFormat,
                },
              },
            },
          ),
        );
      } else if (
        change.changeType === 'deleteOverride' ||
        change.changeType === 'addExdate'
      ) {
        const [start, end] =
          change.changeType === 'deleteOverride'
            ? [
                parseICalDate(change.value.dtstart).toJSDate(),
                parseICalDate(change.value.dtend).toJSDate(),
              ]
            : [
                parseICalDate(change.dtstart).toJSDate(),
                parseICalDate(change.dtend).toJSDate(),
              ];

        notification += formatCurrent(
          i18next.t(
            'meeting.room.notification.changed.occurrence.deleted',
            'A single meeting from a meeting series on {{range, daterange}} is deleted',
            {
              lng,
              range: [start, end],
              formatParams: {
                range: {
                  timeZone,
                  ...fullLongDateFormat,
                },
              },
            },
          ),
        );
      }
    }

    await this.client.sendHtmlText(toRoomId, notification);
  }
}

function formatCurrent(text: string): string {
  return `<strong>${text}</strong><br>`;
}
function formatPrevious(text: string): string {
  return `<font color="#888">${text}</font><br>`;
}
