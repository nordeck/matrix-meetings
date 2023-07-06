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
import { EventContentRenderer } from '../EventContentRenderer';
import { MeetingType } from '../model/MeetingType';
import { MeetingClient } from './MeetingClient';

jest.mock('matrix-bot-sdk');

describe('MeetingClient', () => {
  describe('createMeeting', () => {
    beforeEach(() => {
      jest
        .spyOn(MatrixClient.prototype, 'getUserProfile')
        .mockResolvedValue({ displayname: 'User' });
      jest
        .spyOn(MatrixClient.prototype, 'createRoom')
        .mockResolvedValue('!new-room-id');
    });

    it.each([undefined, 100])(
      'should create a meeting',
      async (messagingPowerLevel) => {
        const client = new MeetingClient(
          new MatrixClient('', ''),
          new EventContentRenderer({} as any)
        );

        await expect(
          client.createMeeting(
            undefined,
            '@bot-user-id:example',
            {
              title: 'My Meeting',
              description: 'My Description',
              calendar: [
                {
                  uid: 'uid-0',
                  dtstart: { tzid: 'Europe/Berlin', value: '20200507T100000' },
                  dtend: { tzid: 'Europe/Berlin', value: '20200507T110000' },
                },
              ],
            },
            MeetingType.MEETING,
            { via: ['example'] },
            {
              stateEvents: [],
              roomEvents: [],
              widgetContents: [],
              allWidgetIds: [],
              defaultWidgetIds: [],
            },
            {
              locale: 'en',
              timezone: 'Europe/Berlin',
              userId: '@user-id:example',
            },
            60,
            messagingPowerLevel
          )
        ).resolves.toEqual([
          '!new-room-id',
          [
            {
              type: 'm.room.member',
              state_key: '@user-id:example',
              content: {
                membership: 'invite',
                'io.element.html_reason': expect.stringMatching(
                  /It will take place on <b>05\/07\/2020 at 10:00 AM CEST<\/b>.*<hr><div><i>My Description<\/i><\/div>$/
                ),
                reason: expect.stringMatching(
                  /It will take place on 05\/07\/2020 at 10:00 AM CEST/
                ),
              },
            },
          ],
        ]);

        expect(jest.mocked(MatrixClient).prototype.createRoom).toBeCalledWith({
          name: 'My Meeting',
          topic: 'My Description',
          visibility: 'private',
          preset: 'private_chat',
          creation_content: {
            type: 'net.nordeck.meetings.meeting',
          },
          power_level_content_override: {
            events_default: messagingPowerLevel,
            users: {
              '@bot-user-id:example': 101,
              '@user-id:example': 100,
            },
          },
          initial_state: [
            {
              type: 'net.nordeck.meetings.metadata',
              content: {
                creator: '@user-id:example',
                calendar: [
                  {
                    uid: 'uid-0',
                    dtstart: {
                      tzid: 'Europe/Berlin',
                      value: '20200507T100000',
                    },
                    dtend: { tzid: 'Europe/Berlin', value: '20200507T110000' },
                  },
                ],
                start_time: undefined,
                end_time: undefined,
                auto_deletion_offset: undefined,
                force_deletion_at: new Date(
                  '2020-05-07T12:00:00+02:00'
                ).getTime(),
              },
            },
          ],
        });
      }
    );

    it('should create a meeting with the legacy data format', async () => {
      const client = new MeetingClient(
        new MatrixClient('', ''),
        new EventContentRenderer({} as any)
      );

      await expect(
        client.createMeeting(
          undefined,
          '@bot-user-id:example',
          {
            title: 'My Meeting',
            description: 'My Description',
            start_time: '2020-05-07T10:00:00+02:00',
            end_time: '2020-05-07T11:00:00+02:00',
          },
          MeetingType.MEETING,
          { via: ['example'] },
          {
            stateEvents: [],
            roomEvents: [],
            widgetContents: [],
            allWidgetIds: [],
            defaultWidgetIds: [],
          },
          {
            locale: 'en',
            timezone: 'Europe/Berlin',
            userId: '@user-id:example',
          },
          60
        )
      ).resolves.toEqual([
        '!new-room-id',
        [
          {
            type: 'm.room.member',
            state_key: '@user-id:example',
            content: {
              membership: 'invite',
              'io.element.html_reason': expect.stringMatching(
                /It will take place on <b>05\/07\/2020 at 10:00 AM CEST<\/b>.*<hr><div><i>My Description<\/i><\/div>$/
              ),
              reason: expect.stringMatching(
                /It will take place on 05\/07\/2020 at 10:00 AM CEST/
              ),
            },
          },
        ],
      ]);

      expect(jest.mocked(MatrixClient).prototype.createRoom).toBeCalledWith({
        name: 'My Meeting',
        topic: 'My Description',
        visibility: 'private',
        preset: 'private_chat',
        creation_content: {
          type: 'net.nordeck.meetings.meeting',
        },
        power_level_content_override: {
          users: {
            '@bot-user-id:example': 101,
            '@user-id:example': 100,
          },
        },
        initial_state: [
          {
            type: 'net.nordeck.meetings.metadata',
            content: {
              creator: '@user-id:example',
              start_time: '2020-05-07T10:00:00+02:00',
              end_time: '2020-05-07T11:00:00+02:00',
              auto_deletion_offset: 60,
            },
          },
        ],
      });
    });

    // TODO: add more tests
  });

  describe('traverseRoomChildren', () => {
    // TODO: add more tests
  });

  describe('loadPartialRooms', () => {
    // TODO: add more tests
  });

  describe('loadRooms', () => {
    // TODO: add more tests
  });

  describe('createRoomList', () => {
    // TODO: add more tests
  });

  describe('fetchRoomAsync', () => {
    // TODO: add more tests
  });

  describe('parentAddChildRoom', () => {
    // TODO: add more tests
  });

  describe('inviteUserToPrivateRoom', () => {
    // TODO: add more tests
  });
});
