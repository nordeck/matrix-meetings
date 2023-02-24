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

import { StateEventName } from '../src/model/StateEventName';
import { AbstractMatrixClient } from './AbstractMatrixClient';

/**
 * A stub or naive implementation of Matrix Client.
 * Implements base methods for rooms: creation, sending and receiving state events.
 * To be used in unit tests to reduce/remove duplicated code with mocks that mimics Matrix Client functionality.
 */
export class StubMatrixClient extends AbstractMatrixClient {
  private readonly stubUserId: string;

  private readonly roomStateMap: RoomStateMap;
  private readonly roomIds: string[];

  constructor(userId: string, roomStates: RoomState[] = []) {
    super('http://localhost', '');
    this.stubUserId = userId;

    const roomStateMap: RoomStateMap = {};
    for (const roomState of roomStates) {
      roomStateMap[roomState.roomId] = roomState.state;
    }
    this.roomStateMap = roomStateMap;
    this.roomIds = roomStates.map((rs) => rs.roomId);
  }

  getUserId(): Promise<string> {
    return Promise.resolve(this.stubUserId);
  }

  getRoomState(roomId: string): Promise<any[]> {
    const roomState = this.roomStateMap[roomId];
    return Promise.resolve(roomState);
  }

  createRoom(properties?: any): Promise<string> {
    if (properties?.creation_content && properties?.initial_state) {
      const roomState = [
        {
          type: StateEventName.M_ROOM_CREATION_EVENT,
          content: {
            type: properties.creation_content.type,
          },
        },
        ...(properties.initial_state as any[]),
      ];
      const roomId: string = this.nextRoomIdNumber().toString();
      this.roomStateMap[roomId] = roomState;
      this.roomIds.push(roomId);
      return Promise.resolve(roomId);
    } else {
      throw new Error('stub matrix client cannot create room');
    }
  }

  sendStateEvent(
    roomId: string,
    type: string,
    stateKey: string,
    content: any
  ): Promise<string> {
    const roomState = this.roomStateMap[roomId];
    roomState.push({
      type,
      state_key: stateKey,
      content,
    });

    return Promise.resolve('');
  }

  lastRoomId(): string | undefined {
    return this.roomIds.length
      ? this.roomIds[this.roomIds.length - 1]
      : undefined;
  }

  nextRoomIdNumber(): number {
    const roomIds = this.roomIds;
    const roomIdNumberMax =
      roomIds.length === 0
        ? 0
        : Math.max(
            ...this.roomIds
              .map((idx) => parseInt(idx))
              .filter((idx) => !isNaN(idx))
          );
    return roomIdNumberMax + 1;
  }

  uploadContent(): Promise<string> {
    return Promise.resolve('https://some_url/');
  }
}

export interface RoomState {
  roomId: string;
  state: any[];
}

interface RoomStateMap {
  [roomId: string]: any[];
}
