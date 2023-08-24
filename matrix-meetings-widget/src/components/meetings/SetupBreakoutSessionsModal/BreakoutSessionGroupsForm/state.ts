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

import { TFunction } from 'i18next';
import {
  calculateSelectableMembers,
  distributeAllRoomMembers,
  initializeGroups,
} from './helpers';
import {
  BreakoutSessionGroupsFormActions,
  BreakoutSessionGroupsFormState,
} from './types';

/**
 * The initializer for the `useReducer()` hook.
 */
export function initializer(opts: {
  t: TFunction;
  ownUserId: string | undefined;
}): BreakoutSessionGroupsFormState {
  return {
    ctx: {
      ...opts,
      allMemberEvents: [],
    },
    groupsCount: 1,
    groups: initializeGroups(opts.t, [], 1, opts.ownUserId),
    selectableMemberEvents: [],
    validMemberEvents: [],
  };
}

/**
 * The reducer for the `useReducer()` hook.
 */
export function reducer(
  state: BreakoutSessionGroupsFormState,
  action: BreakoutSessionGroupsFormActions,
): BreakoutSessionGroupsFormState {
  switch (action.type) {
    case 'replaceCtx': {
      const groups = initializeGroups(
        action.ctx.t,
        state.groups,
        state.groupsCount,
        action.ctx.ownUserId,
      );

      return {
        ...state,
        ctx: action.ctx,
        groups,
        selectableMemberEvents: calculateSelectableMembers(
          action.ctx.allMemberEvents,
          groups,
        ),
        validMemberEvents: action.ctx.allMemberEvents.filter(
          (e) => e.state_key !== action.ctx.ownUserId,
        ),
      };
    }

    case 'updateCount': {
      const groupsCount = Math.max(
        1,
        Math.min(action.count, state.validMemberEvents.length),
      );

      if (state.groupsCount !== groupsCount) {
        const groups = initializeGroups(
          state.ctx.t,
          state.groups,
          groupsCount,
          state.ctx.ownUserId,
        );

        return {
          ...state,
          groupsCount,
          groups,
          selectableMemberEvents: calculateSelectableMembers(
            state.validMemberEvents,
            groups,
          ),
        };
      }
      break;
    }

    case 'updateGroup': {
      if (action.groupIndex < 0 || action.groupIndex >= state.groups.length) {
        return state;
      }

      const groups = state.groups.slice();
      groups[action.groupIndex] = {
        ...groups[action.groupIndex],
        ...action.group,
      };

      // make sure the own user is always in the group
      if (
        groups[action.groupIndex].members.length === 0 &&
        state.ctx.ownUserId
      ) {
        groups[action.groupIndex].members = [state.ctx.ownUserId];
      }

      return {
        ...state,
        groups,
        selectableMemberEvents: calculateSelectableMembers(
          state.validMemberEvents,
          groups,
        ),
      };
    }

    case 'distributeAll': {
      const groups = distributeAllRoomMembers(
        state.groups,
        state.validMemberEvents,
        state.ctx.ownUserId,
      );

      return {
        ...state,
        groups,
        selectableMemberEvents: calculateSelectableMembers(
          state.validMemberEvents,
          groups,
        ),
      };
    }
  }

  return state;
}
