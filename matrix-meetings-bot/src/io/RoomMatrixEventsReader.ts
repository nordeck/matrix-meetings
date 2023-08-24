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

import fs from 'fs';
import Joi from 'joi';
import { IRoomEvent } from '../matrix/event/IRoomEvent';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { IRoomMatrixEvents } from '../model/IRoomMatrixEvents';
import { RoomMatrixEventsHelper } from '../model/RoomMatrixEventsHelper';
import { StateEventName } from '../model/StateEventName';

export class RoomMatrixEventsReader {
  constructor(private defaultEventsPath: string) {}

  read(): IRoomMatrixEvents {
    const json = JSON.parse(fs.readFileSync(this.defaultEventsPath).toString());
    Joi.assert(json, schema);
    const stateEvents = json.state_events as IStateEvent<unknown>[];
    const roomEvents = json.room_events as IRoomEvent<unknown>[];
    return new RoomMatrixEventsHelper(
      this.defaultEventsPath,
    ).buildRoomMatrixEvents(stateEvents, roomEvents);
  }
}

export const schema = Joi.object({
  state_events: Joi.array().items(
    Joi.object({
      type: Joi.string().required(),
      state_key: Joi.alternatives().conditional('type', {
        is: StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
        then: Joi.string().required(), // widgets are required to have state_key that will be used as widget id as well
        otherwise: Joi.string().allow(''),
      }),
      optional: Joi.alternatives()
        .conditional('type', {
          is: StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
          then: Joi.boolean().required(),
          otherwise: Joi.disallow(),
        })
        .optional(),
      content: Joi.alternatives().conditional('type', {
        is: StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
        then: Joi.object({
          type: Joi.string().required(),
          url: Joi.string().required(),
          name: Joi.string().required(),
          avatar_url: Joi.string().uri({
            scheme: 'mxc', // matrix URL possible
            allowRelative: true, // for avatar upload
          }),
          data: Joi.object(),
        })
          .unknown()
          .required(),
        otherwise: Joi.object().required(),
      }),
    }).unknown(),
  ),
  room_events: Joi.array().items(
    Joi.object({
      type: Joi.string().required(),
      content: Joi.object().required(),
    }).unknown(),
  ),
}).unknown();
