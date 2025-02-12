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

import { describe, expect, it } from 'vitest';
import i18next from '../../../../i18n';
import { mockRoomMember } from '../../../../lib/testUtils';
import { initializer, reducer } from './state';

describe('reducer', () => {
  describe('initializer', () => {
    it('should work', () => {
      expect(initializer({ t: i18next.t, ownUserId: '@my-user' })).toEqual({
        ctx: { t: i18next.t, allMemberEvents: [], ownUserId: '@my-user' },
        groups: [{ title: 'Group 1', members: ['@my-user'] }],
        groupsCount: 1,
        selectableMemberEvents: [],
        validMemberEvents: [],
      });
    });
  });

  describe('reducer', () => {
    const events = [
      mockRoomMember({ state_key: '@my-user' }),
      mockRoomMember({ state_key: '@user1' }),
      mockRoomMember({ state_key: '@user2' }),
    ];

    describe('replaceCtx', () => {
      it('should work', () => {
        const state = {
          ctx: { t: i18next.t, allMemberEvents: [], ownUserId: undefined },
          groups: [{ title: 'Group 1', members: [] }],
          groupsCount: 1,
          selectableMemberEvents: [],
          validMemberEvents: [],
        };

        expect(
          reducer(state, {
            type: 'replaceCtx',
            ctx: {
              t: i18next.t,
              allMemberEvents: events,
              ownUserId: '@my-user',
            },
          }),
        ).toEqual({
          ctx: { t: i18next.t, allMemberEvents: events, ownUserId: '@my-user' },
          groups: [{ title: 'Group 1', members: ['@my-user'] }],
          groupsCount: 1,
          selectableMemberEvents: events.slice(1),
          validMemberEvents: events.slice(1),
        });
      });
    });

    describe('updateCount', () => {
      it('should update', () => {
        const members = [mockRoomMember(), mockRoomMember()];

        const state = {
          ctx: { t: i18next.t, allMemberEvents: members, ownUserId: undefined },
          groups: [{ title: 'Group 1', members: [] }],
          groupsCount: 1,
          selectableMemberEvents: members,
          validMemberEvents: members,
        };

        expect(
          reducer(state, {
            type: 'updateCount',
            count: 2,
          }),
        ).toEqual({
          ctx: { t: i18next.t, allMemberEvents: members, ownUserId: undefined },
          groups: [
            { title: 'Group 1', members: [] },
            { title: 'Group 2', members: [] },
          ],
          groupsCount: 2,
          selectableMemberEvents: members,
          validMemberEvents: members,
        });
      });

      it('should handle no change', () => {
        const members = [mockRoomMember()];

        const state = {
          ctx: { t: i18next.t, allMemberEvents: members, ownUserId: undefined },
          groups: [{ title: 'Group 1', members: [] }],
          groupsCount: 1,
          selectableMemberEvents: members,
          validMemberEvents: members,
        };

        expect(
          reducer(state, {
            type: 'updateCount',
            count: 1,
          }),
        ).toEqual(state);
      });

      it('should ignore negative numbers', () => {
        const state = {
          ctx: { t: i18next.t, allMemberEvents: [], ownUserId: undefined },
          groups: [{ title: 'Group 1', members: [] }],
          groupsCount: 1,
          selectableMemberEvents: [],
          validMemberEvents: [],
        };

        expect(
          reducer(state, {
            type: 'updateCount',
            count: -1,
          }),
        ).toEqual(state);
      });

      it('should always have a single group even without room members', () => {
        const state = {
          ctx: { t: i18next.t, allMemberEvents: [], ownUserId: undefined },
          groups: [{ title: 'Group 1', members: [] }],
          groupsCount: 1,
          selectableMemberEvents: [],
          validMemberEvents: [],
        };

        expect(
          reducer(state, {
            type: 'updateCount',
            count: 0,
          }),
        ).toEqual({
          ctx: { t: i18next.t, allMemberEvents: [], ownUserId: undefined },
          groups: [{ title: 'Group 1', members: [] }],
          groupsCount: 1,
          selectableMemberEvents: [],
          validMemberEvents: [],
        });
      });

      it('should not allow more groups than there are participants', () => {
        const members = [mockRoomMember(), mockRoomMember()];

        const state = {
          ctx: { t: i18next.t, allMemberEvents: members, ownUserId: undefined },
          groups: [{ title: 'Group 1', members: [] }],
          groupsCount: 1,
          selectableMemberEvents: members,
          validMemberEvents: members,
        };

        expect(
          reducer(state, {
            type: 'updateCount',
            count: 5,
          }),
        ).toEqual({
          ctx: { t: i18next.t, allMemberEvents: members, ownUserId: undefined },
          groups: [
            { title: 'Group 1', members: [] },
            { title: 'Group 2', members: [] },
          ],
          groupsCount: 2,
          selectableMemberEvents: members,
          validMemberEvents: members,
        });
      });
    });

    describe('updateGroup', () => {
      it('should update members', () => {
        const state = {
          ctx: { t: i18next.t, allMemberEvents: events, ownUserId: undefined },
          groups: [
            { title: 'Group 1', members: [] },
            { title: 'Group 2', members: [] },
            { title: 'Group 3', members: [] },
          ],
          groupsCount: 3,
          selectableMemberEvents: events,
          validMemberEvents: events,
        };

        expect(
          reducer(state, {
            type: 'updateGroup',
            groupIndex: 1,
            group: {
              title: 'New Title',
              members: ['@my-user'],
            },
          }),
        ).toEqual({
          ctx: { t: i18next.t, allMemberEvents: events, ownUserId: undefined },
          groups: [
            { title: 'Group 1', members: [] },
            { title: 'New Title', members: ['@my-user'] },
            { title: 'Group 3', members: [] },
          ],
          groupsCount: 3,
          selectableMemberEvents: events.slice(1),
          validMemberEvents: events,
        });
      });

      it('should not remove own user', () => {
        const state = {
          ctx: { t: i18next.t, allMemberEvents: [], ownUserId: '@my-user' },
          groups: [{ title: 'Group 1', members: ['@my-user'] }],
          groupsCount: 1,
          selectableMemberEvents: [],
          validMemberEvents: [],
        };

        expect(
          reducer(state, {
            type: 'updateGroup',
            groupIndex: 0,
            group: {
              members: [],
            },
          }),
        ).toEqual(state);
      });

      it('should handle invalid index members', () => {
        const state = {
          ctx: { t: i18next.t, allMemberEvents: [], ownUserId: undefined },
          groups: [{ title: 'Group 1', members: [] }],
          groupsCount: 1,
          selectableMemberEvents: [],
          validMemberEvents: [],
        };

        expect(
          reducer(state, {
            type: 'updateGroup',
            groupIndex: 1000,
            group: {
              title: 'New Title',
            },
          }),
        ).toEqual(state);
      });
    });

    describe('distributeAll', () => {
      it('should distribute members', () => {
        const state = {
          ctx: {
            t: i18next.t,
            allMemberEvents: events.slice(2),
            ownUserId: undefined,
          },
          groups: [{ title: 'Group 1', members: [] }],
          groupsCount: 1,
          selectableMemberEvents: events.slice(2),
          validMemberEvents: events.slice(2),
        };

        expect(
          reducer(state, {
            type: 'distributeAll',
          }),
        ).toEqual({
          ctx: {
            t: i18next.t,
            allMemberEvents: events.slice(2),
            ownUserId: undefined,
          },
          groups: [{ title: 'Group 1', members: ['@user2'] }],
          groupsCount: 1,
          selectableMemberEvents: [],
          validMemberEvents: events.slice(2),
        });
      });
    });
  });
});
