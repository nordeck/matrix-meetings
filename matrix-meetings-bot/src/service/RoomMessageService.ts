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
import i18next from 'i18next';
import { MatrixClient } from 'matrix-bot-sdk';
import moment from 'moment-timezone';
import { MeetingClient } from '../client/MeetingClient';
import { ISyncParams } from '../matrix/dto/ISyncParams';
import { MatrixEndpoint } from '../MatrixEndpoint';
import { IMeeting } from '../model/IMeeting';
import { IUserContext } from '../model/IUserContext';
import { StateEventName } from '../model/StateEventName';
import { isRecurringCalendarSourceEntry } from '../shared/calendarUtils/helpers';
import { formatRRuleText } from '../shared/format';
import { IMeetingChanges } from '../util/IMeetingChanges';

@Injectable()
export class RoomMessageService {
  private logger = new Logger(RoomMessageService.name);

  constructor(
    readonly client: MatrixClient,
    readonly meetingClient: MeetingClient
  ) {}

  public async sendHtmlMessageToErrorPrivateRoom(
    userId: string,
    message: string
  ) {
    const privateRoomId = await this.setupErrorPrivateRoom(userId);
    await this.client.sendHtmlText(privateRoomId, message);
    return privateRoomId;
  }

  private async setupErrorPrivateRoom(userId: string): Promise<string> {
    const roomName = i18next.t(
      'bot.private.errorRoom.create.message',
      'Error messages from Meetings-Bot'
    );
    const topic = i18next.t(
      'bot.private.errorRoom.create.topic',
      'More details'
    );
    const htmlReason = `<table><tr><td><b>${topic}</b></td></tr></table>`;

    // only create one private room per userId
    const directMessageRoomIds = await this.findDirectMessageRoomsForUser(
      userId,
      StateEventName.NIC_MEETINGS_PRIVATE_BOT_MESSAGES_ROOM_TYPE
    );

    if (directMessageRoomIds.length > 0) {
      const privateRoomId: string = directMessageRoomIds[0].roomId;
      try {
        // Try to invite the user, in case they have left the room
        await this.meetingClient.inviteUserToPrivateRoom(
          userId,
          privateRoomId,
          topic,
          htmlReason
        );
      } catch (e) {
        // Do not throw an exception if invite fails (user is in the room)
        this.logger.debug(
          `setupErrorPrivateRoom: failed to invite to room ${privateRoomId}`,
          e
        );
      }
      return privateRoomId;
    }

    return await this.createAndInviteToErrorPrivateChatRoom(
      userId,
      roomName,
      topic
    );
  }

  private async createAndInviteToErrorPrivateChatRoom(
    userId: string,
    roomName: string,
    topic: string
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
      htmlReason
    );
    return privateRoomId;
  }

  public async findDirectMessageRoomsForUser(
    userId: string,
    markerStateEvent: StateEventName
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
      qs
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
          })
        );
    }
    return privateRoomIds;
  }

  private static formatDateTime(
    timezone: string,
    locale: string,
    date: string | number | Date
  ): string {
    return moment(new Date(date)).tz(timezone).locale(locale).format('L LT z');
  }

  private formatHeader(text: string) {
    return `<strong>${text}</strong><br>`;
  }
  private formatCurrent(text: string) {
    return `<strong>${text}</strong><br>`;
  }
  private formatPrevious(text: string) {
    return `<font color="#888">${text}</font><br>`;
  }

  private createTitleLine(lng: string, title: string, previous?: boolean) {
    if (previous) {
      return this.formatPrevious(
        i18next.t(
          'meeting.room.notification.changed.title.previous',
          '(previously: {{title}})',
          { lng, title }
        )
      );
    } else {
      return this.formatCurrent(
        i18next.t(
          'meeting.room.notification.changed.title.current',
          'Title: {{title}}',
          { lng, title }
        )
      );
    }
  }
  private createStartEndTimesLine(
    lng: string,
    start: string,
    end: string,
    previous?: boolean
  ) {
    if (previous) {
      return this.formatPrevious(
        i18next.t(
          'meeting.room.notification.changed.date.previous',
          '(previously: {{start}} to {{end}})',
          { lng, start, end }
        )
      );
    } else {
      return this.formatCurrent(
        i18next.t(
          'meeting.room.notification.changed.date.current',
          'Date: {{start}} to {{end}}',
          { lng, start, end }
        )
      );
    }
  }
  private createDescriptionLine(
    lng: string,
    description: string,
    previous?: boolean
  ) {
    if (previous) {
      return this.formatPrevious(
        i18next.t(
          'meeting.room.notification.changed.description.previous',
          '(previously: {{description}})',
          { lng, description }
        )
      );
    } else {
      return this.formatCurrent(
        i18next.t(
          'meeting.room.notification.changed.description.current',
          'Description: {{description}}',
          { lng, description }
        )
      );
    }
  }

  private createRepetitionLine(
    lng: string,
    repetitionText: string,
    previous?: boolean
  ) {
    if (previous) {
      return this.formatPrevious(
        i18next.t(
          'meeting.room.notification.changed.repetition.previous',
          '(previously: {{repetitionText}})',
          { lng, repetitionText }
        )
      );
    } else {
      return this.formatCurrent(
        i18next.t(
          'meeting.room.notification.changed.repetition.current',
          'Repeat meeting: {{repetitionText}}',
          { lng, repetitionText }
        )
      );
    }
  }

  public async notifyMeetingTimeChangedAsync(
    userContext: IUserContext,
    oldMeeting: IMeeting,
    newMeeting: IMeeting,
    meetingChanges: IMeetingChanges,
    toRoomId: string
  ): Promise<void> {
    const lng = userContext.locale ? userContext.locale : 'en';
    const timeZone = userContext.timezone ? userContext.timezone : 'UTC';

    if (!meetingChanges.anythingChanged) return;

    let notification = this.formatHeader(
      i18next.t('meeting.room.notification.changed.headLine', 'CHANGES', {
        lng,
      })
    );
    if (meetingChanges.titleChanged) {
      const newTitle = newMeeting.title;
      const oldTitle = oldMeeting.title;

      notification += this.createTitleLine(lng, newTitle);
      notification += this.createTitleLine(lng, oldTitle, true);
    }

    if (meetingChanges.timeChanged) {
      const newStart = RoomMessageService.formatDateTime(
        timeZone,
        lng,
        newMeeting.startTime
      );
      const newEnd = RoomMessageService.formatDateTime(
        timeZone,
        lng,
        newMeeting.endTime
      );
      const oldStart = RoomMessageService.formatDateTime(
        timeZone,
        lng,
        oldMeeting.startTime
      );
      const oldEnd = RoomMessageService.formatDateTime(
        timeZone,
        lng,
        oldMeeting.endTime
      );
      notification += this.createStartEndTimesLine(lng, newStart, newEnd);
      notification += this.createStartEndTimesLine(lng, oldStart, oldEnd, true);
    }

    if (meetingChanges.descriptionChanged) {
      const newDescription = newMeeting.description;
      const oldDescription = oldMeeting.description;
      notification += this.createDescriptionLine(lng, newDescription);
      notification += this.createDescriptionLine(lng, oldDescription, true);
    }

    if (meetingChanges.calendarChanged) {
      const newRruleText = isRecurringCalendarSourceEntry(newMeeting.calendar)
        ? formatRRuleText(newMeeting.calendar[0].rrule, i18next.t, lng)
        : i18next.t('meeting.room.notification.noRepetition', 'No repetition', {
            lng,
          });
      notification += this.createRepetitionLine(lng, newRruleText);

      const oldRruleText = isRecurringCalendarSourceEntry(oldMeeting.calendar)
        ? formatRRuleText(oldMeeting.calendar[0].rrule, i18next.t, lng)
        : i18next.t('meeting.room.notification.noRepetition', 'No repetition', {
            lng,
          });
      notification += this.createRepetitionLine(lng, oldRruleText, true);
    }

    await this.client.sendHtmlText(toRoomId, notification);
  }
}
