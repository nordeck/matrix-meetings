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

import { vi } from 'vitest';
import i18next from '../../../../i18n';
import { mockRoomMember } from '../../../../lib/testUtils';
import {
  calculateSelectableMembers,
  distributeAllRoomMembers,
  initializeGroups,
} from './helpers';

vi.mock('lodash/shuffle', () => ({
  default: (value: Array<unknown>) => value.reverse(),
}));

describe('initializeGroups', () => {
  it('should not add groups when not changed', () => {
    expect(initializeGroups(i18next.t, [], 0, undefined)).toEqual([]);
  });

  it.each([undefined, '@my-user'])(
    'should add initial group with own user %s',
    (ownUser) => {
      expect(initializeGroups(i18next.t, [], 1, ownUser)).toEqual([
        { title: 'Group 1', members: ownUser ? [ownUser] : [] },
      ]);
    },
  );

  it.each([undefined, '@my-user'])(
    'should add new groups with own user %s',
    (ownUser) => {
      const own = ownUser ? [ownUser] : [];
      expect(
        initializeGroups(
          i18next.t,
          [
            { title: 'First Group', members: ['u1'] },
            { title: 'Second Group', members: ['u2'] },
          ],
          4,
          ownUser,
        ),
      ).toEqual([
        { title: 'First Group', members: [...own, 'u1'] },
        { title: 'Second Group', members: [...own, 'u2'] },
        { title: 'Group 3', members: own },
        { title: 'Group 4', members: own },
      ]);
    },
  );

  it('should delete groups', () => {
    expect(
      initializeGroups(
        i18next.t,
        [
          { title: 'First Group', members: [] },
          { title: 'Second Group', members: [] },
        ],
        1,
        undefined,
      ),
    ).toEqual([{ title: 'First Group', members: [] }]);
  });
});

describe('calculateSelectableMembers', () => {
  it('should calculate', () => {
    expect(
      calculateSelectableMembers(
        [
          mockRoomMember({ state_key: '@user1' }),
          mockRoomMember({ state_key: '@user2' }),
        ],
        [{ title: '1', members: ['@user1'] }],
      ),
    ).toEqual([mockRoomMember({ state_key: '@user2' })]);
  });
});

describe('distributeAllRoomMembers', () => {
  it('should shuffle', () => {
    expect(
      distributeAllRoomMembers(
        [
          { title: 'Group 1', members: [] },
          { title: 'Group 2', members: [] },
        ],
        [
          mockRoomMember({ state_key: '@user1' }),
          mockRoomMember({ state_key: '@user2' }),
        ],
        undefined,
      ),
    ).toEqual([
      { title: 'Group 1', members: ['@user2'] },
      { title: 'Group 2', members: ['@user1'] },
    ]);
  });

  it('should always include the own user', () => {
    expect(
      distributeAllRoomMembers(
        [
          { title: 'Group 1', members: [] },
          { title: 'Group 2', members: [] },
        ],
        [
          mockRoomMember({ state_key: '@user1' }),
          mockRoomMember({ state_key: '@user2' }),
        ],
        '@my-user',
      ),
    ).toEqual([
      { title: 'Group 1', members: ['@my-user', '@user2'] },
      { title: 'Group 2', members: ['@my-user', '@user1'] },
    ]);
  });
});
