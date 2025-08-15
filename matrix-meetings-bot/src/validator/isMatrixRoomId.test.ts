/*
 * Copyright 2025 Nordeck IT + Consulting GmbH
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

import { isMatrixRoomId } from './IsMatrixRoomId';

describe('IsMatrixRoomId', () => {
  it('should accept room if from before room version 12', () => {
    expect(isMatrixRoomId('!meeting-room-id:example.com')).toBe(true);
  });

  it('should accept room id from version 12', () => {
    expect(isMatrixRoomId('!meeting-room-id')).toBe(true);
  });

  it('should not accept invalid room id', () => {
    expect(isMatrixRoomId('meeting-room-id')).toBe(false);
  });
});
