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

import { validate } from 'class-validator';
import { ParticipantDto } from './ParticipantDto';

describe('ParticipantDto', () => {
  it('should accept minimal entry', async () => {
    const input = new ParticipantDto('@user-id:matrix.org', undefined);

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it('should accept entry', async () => {
    const input = new ParticipantDto('@user-id:matrix.org', 100);

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it.each([
    { user_id: null },
    { user_id: undefined },
    { user_id: 111 },
    { user_id: 'no-user-id' },
    { power_level: '111' },
  ])('should reject entry with patch %p', async (patch) => {
    const input = new ParticipantDto('@user-id:matrix.org', 100);

    Object.entries(patch).forEach(([key, value]) => {
      (input as any)[key] = value;
    });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });
});
