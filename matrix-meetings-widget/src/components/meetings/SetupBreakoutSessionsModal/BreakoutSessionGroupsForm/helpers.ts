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

import {
  RoomMemberStateEventContent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { TFunction } from 'i18next';
import { range, shuffle } from 'lodash-es';
import { BreakoutSessionGroup } from './types';

/**
 * Initialize and update the groups based on the input parameters.
 * This will remove unneeded groups and will create new ones.
 * It will also make sure that the owned user is a member of each group.
 *
 * @param t - the i18next translation function
 * @param originalGroups - a list of all existing groups
 * @param expectedCount - the count of groups that should exist
 * @param ownUserId - the optional id of the own user
 * @returns the updated groups
 */
export function initializeGroups(
  t: TFunction,
  originalGroups: BreakoutSessionGroup[],
  expectedCount: number,
  ownUserId: string | undefined,
): BreakoutSessionGroup[] {
  let groups = originalGroups;

  if (ownUserId) {
    groups = groups.map((g) => ({
      ...g,
      members: [ownUserId, ...g.members.filter((m) => m !== ownUserId)],
    }));
  }

  // remove groups from the end
  if (expectedCount < groups.length) {
    return groups.slice(0, expectedCount);
  }

  // add groups to the end
  if (expectedCount > groups.length) {
    return groups.concat(
      range(groups.length, expectedCount).map((index) => ({
        title: t('setupBreakoutSessions.groupTitleDefaultValue', {
          index: index + 1,
          defaultValue: 'Group {{index}}',
        }),
        members: ownUserId ? [ownUserId] : [],
      })),
    );
  }

  // nothing to do
  return groups;
}

/**
 * Get a list of members that are not yet part of a group
 *
 * @param memberEvents - all known member events
 * @param groups - the groups
 * @returns all selectable member events
 */
export function calculateSelectableMembers(
  memberEvents: StateEvent<RoomMemberStateEventContent>[],
  groups: BreakoutSessionGroup[],
): StateEvent<RoomMemberStateEventContent>[] {
  const all = new Set(memberEvents.map((m) => m.state_key));
  groups.forEach((g) => g.members.forEach((m) => all.delete(m)));

  return memberEvents.filter((m) => all.has(m.state_key));
}

/**
 * Distribute all members randomly into the groups.
 * This will replace all prior group assignments.
 *
 * @param groups - the groups
 * @param memberEvents - all known member events
 * @param ownUserId - the optional id of the own user
 * @returns the updated groups
 */
export function distributeAllRoomMembers(
  groups: BreakoutSessionGroup[],
  memberEvents: StateEvent<RoomMemberStateEventContent>[],
  ownUserId: string | undefined,
): BreakoutSessionGroup[] {
  const shuffled = shuffle(memberEvents.slice());

  const newGroups = groups.map<BreakoutSessionGroup>((g) => ({
    ...g,
    members: ownUserId ? [ownUserId] : [],
  }));

  shuffled.forEach((e, idx) => {
    newGroups[idx % newGroups.length].members.push(e.state_key);
  });

  return newGroups;
}
