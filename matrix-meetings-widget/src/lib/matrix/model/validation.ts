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

import { RoomEvent, StateEvent } from '@matrix-widget-toolkit/api';
import Joi from 'joi';

export function isValidEvent(
  event: RoomEvent<unknown> | StateEvent<unknown>,
  eventType: string,
  schema: Joi.AnySchema,
): boolean {
  if (event.type !== eventType) {
    return false;
  }

  // Events from invited rooms only miss some properties. We still validate them but we don't enforce them!
  // See also https://spec.matrix.org/v1.2/client-server-api/#stripped-state

  if (!event.content || typeof event.content !== 'object') {
    return false;
  }

  const result = schema.validate(event.content);

  if (result.error) {
    // TODO: Log here if desired: console.warn(result.error);
    return false;
  }

  return true;
}
