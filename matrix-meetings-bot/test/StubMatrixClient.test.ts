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
import { RoomState, StubMatrixClient } from './StubMatrixClient';

describe('test stub matrix client', () => {
  const userId = '@botUserId:matrix.org';

  test('base api test', async () => {
    const roomStates: RoomState[] = [
      { roomId: '0', state: [{ type: StateEventName.M_ROOM_CREATION_EVENT }] },
      { roomId: '1', state: [{ type: StateEventName.M_ROOM_CREATION_EVENT }] },
    ];

    const matrixClient = new StubMatrixClient(userId, roomStates);

    expect(await matrixClient.lastRoomId()).toBe('1');

    expect(await matrixClient.getUserId()).toBe(userId);

    const roomInitState = [
      {
        type: StateEventName.NIC_MEETINGS_METADATA_EVENT,
        content: {},
      },
    ];

    const roomProps = {
      creation_content: { type: 'room_type_here' },
      initial_state: roomInitState,
    };

    const roomId = await matrixClient.createRoom(roomProps);
    expect(roomId).toBe('2');

    const roomState = await matrixClient.getRoomState(roomId);
    expect(roomState.length).toBe(2);

    expect(roomState[0].type).toBe(StateEventName.M_ROOM_CREATION_EVENT);
    expect(roomState[1]).toStrictEqual(roomInitState[0]);
  });

  test('next room id test', async () => {
    let matrixClient = new StubMatrixClient(userId, [
      { roomId: '3', state: [] },
      { roomId: '4', state: [] },
    ]);
    expect(matrixClient.nextRoomIdNumber()).toBe(5);

    matrixClient = new StubMatrixClient(userId, [
      { roomId: '3', state: [] },
      { roomId: 'a4', state: [] },
    ]);
    expect(matrixClient.nextRoomIdNumber()).toBe(4);
  });
});
