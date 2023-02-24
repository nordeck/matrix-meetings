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

/**
 * A single breakout session group
 */
export type BreakoutSessionGroup = {
  title: string;
  members: string[];
};

/**
 * A list of actions for the local reducer.
 */
export type BreakoutSessionGroupsFormActions =
  | { type: 'replaceCtx'; ctx: BreakoutSessionGroupsFormState['ctx'] }
  | { type: 'updateCount'; count: number }
  | {
      type: 'updateGroup';
      groupIndex: number;
      group: Partial<BreakoutSessionGroup>;
    }
  | { type: 'distributeAll' };

/**
 * The state of the local reducer.
 */
export type BreakoutSessionGroupsFormState = {
  /** The context */
  ctx: {
    /** The i18next translate function */
    t: TFunction;

    /** A list of all members of the room */
    allMemberEvents: StateEvent<RoomMemberStateEventContent>[];

    /** The optional id of the own user */
    ownUserId: string | undefined;
  };

  /** The number of groups that should exits */
  groupsCount: number;

  /** A list of all existing groups */
  groups: BreakoutSessionGroup[];

  /** A list of members that are in no group yet */
  selectableMemberEvents: StateEvent<RoomMemberStateEventContent>[];

  /** All members that are editable. This will not include the own user if `ctx.ownUserId` is set. */
  validMemberEvents: StateEvent<RoomMemberStateEventContent>[];
};
