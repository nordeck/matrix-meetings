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

import { APIRequestContext } from '@playwright/test';
import { getBotUrl } from '../util';
import { OpenIdToken } from './elementWebPage';

export class MeetingsBotApi {
  constructor(private readonly request: APIRequestContext) {}

  public async createMeeting({
    parentRoomId,
    title,
    description,
    startTime,
    endTime,
    participants,
    openIdToken,
  }: {
    parentRoomId?: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    participants: string[];
    openIdToken: OpenIdToken;
  }): Promise<{
    roomId: string;
    meetingUrl: string;
  }> {
    const response = await this.request.post(
      `${getBotUrl()}/v1/meeting/create`,
      {
        headers: this.getRequestHeaders(openIdToken),
        data: {
          parent_room_id: parentRoomId,
          title,
          description,
          start_time: startTime,
          end_time: endTime,
          participants: participants.map((u) => ({
            user_id: `@${u}:localhost`,
          })),
          external_data: {
            'io.ox': {
              folder: 'cal://0/471',
              id: 'meeting-id',
            },
          },
        },
      }
    );

    if (!response.ok()) {
      throw new Error(`Error while creating meeting: ${await response.text()}`);
    }

    const result = await response.json();

    return {
      roomId: result.room_id,
      meetingUrl: result.meeting_url,
    };
  }

  public async updateMeeting({
    roomId,
    title,
    description,
    startTime,
    endTime,
    openIdToken,
  }: {
    roomId: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    openIdToken: OpenIdToken;
  }) {
    const response = await this.request.put(
      `${getBotUrl()}/v1/meeting/update`,
      {
        headers: this.getRequestHeaders(openIdToken),
        data: {
          target_room_id: roomId,
          start_time: startTime,
          end_time: endTime,
          title,
          description,
          external_data: {
            'io.ox': {
              folder: 'cal://0/471',
              id: 'meeting-id',
            },
          },
        },
      }
    );

    if (!response.ok()) {
      throw new Error(`Error while updating meeting: ${await response.text()}`);
    }
  }

  public async deleteMeeting({
    roomId,
    method,
    openIdToken,
  }: {
    roomId: string;
    method: 'tombstone' | 'kick_all_participants';
    openIdToken: OpenIdToken;
  }) {
    const response = await this.request.post(
      `${getBotUrl()}/v1/meeting/close`,
      {
        headers: this.getRequestHeaders(openIdToken),
        data: {
          target_room_id: roomId,
          method,
        },
      }
    );

    if (!response.ok()) {
      throw new Error(`Error while deleting meeting: ${await response.text()}`);
    }
  }

  private getRequestHeaders(openIdToken: OpenIdToken): {
    [key: string]: string;
  } {
    return {
      authorization: this.createMxIdentityToken(openIdToken),
      'x-timezone': 'Europe/Berlin',
      'accept-language': 'en',
    };
  }

  private createMxIdentityToken(openIdToken: OpenIdToken): string {
    const token = {
      matrix_server_name: openIdToken.matrix_server_name,
      access_token: openIdToken.access_token,
    };
    return `MX-Identity ${btoa(JSON.stringify(token))}`;
  }
}
