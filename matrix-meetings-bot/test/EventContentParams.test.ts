/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import {
  IEventContentParams,
  eventContentParams,
} from '../src/IEventContentParams';

describe('EventContentParamsHelper', () => {
  test('should create an instance with room_id and title', () => {
    const params: IEventContentParams = eventContentParams.newInstance(
      'roomId123',
      'Sample Title',
    );

    expect(params.room_id).toBe('roomId123');
    expect(params.title).toBe('Sample Title');
    expect(params.base32_room_id).toBe('OJXW63KJMQYTEMY');
    expect(params.base32_room_id50).toBe('OJXW63KJMQYTEMY');
    expect(params.base32_room_id50?.length).toBeLessThanOrEqual(50);
    expect(params.uuid).toBeDefined();
  });

  test('should create an instance with undefined room_id and empty title', () => {
    const params: IEventContentParams = eventContentParams.newInstance(
      undefined,
      '',
    );

    expect(params.room_id).toBeUndefined();
    expect(params.title).toBe('');
    expect(params.base32_room_id).toBeUndefined();
    expect(params.base32_room_id50).toBeUndefined();
    expect(params.uuid).toBeDefined();
  });

  test('should truncate base32_room_id to 50 characters if longer', () => {
    const longRoomId = 'a'.repeat(60); // Create a roomId longer than 50 characters
    const params: IEventContentParams = eventContentParams.newInstance(
      longRoomId,
      'Sample Title',
    );

    expect(params.room_id).toBe(longRoomId);
    expect(params.title).toBe('Sample Title');
    expect(params.base32_room_id).toBe(
      'MFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLB',
    );
    expect(params.base32_room_id50).toBe(
      'MFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMF',
    );
    expect(params.base32_room_id50?.length).toBe(50); // Ensure it's truncated to 50 characters
    expect(params.uuid).toBeDefined();
  });
});
