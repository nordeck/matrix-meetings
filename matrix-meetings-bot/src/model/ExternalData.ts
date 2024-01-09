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

import { parseRRuleSafe } from '../util/format';
import { OpenXChangeExternalReference } from './OpenXChangeExternalReference';

export const OPEN_XCHANGE_TYPE = 'io.ox';

export interface ExternalData {
  [space: string]: {
    [key: string]: unknown;
  };
}

export function extractOpenXChangeExternalReference(
  externalData: ExternalData | undefined,
): OpenXChangeExternalReference | undefined {
  const value = externalData?.[OPEN_XCHANGE_TYPE];

  if (!value) {
    return undefined;
  }

  if (typeof value.folder !== 'string') {
    return undefined;
  }

  if (value.id !== undefined && typeof value.id !== 'string') {
    return undefined;
  }

  if (
    value.rrules !== undefined &&
    (!Array.isArray(value.rrules) ||
      value.rrules.some((v) => typeof v !== 'string' || !parseRRuleSafe(v)))
  ) {
    return undefined;
  }

  return {
    folder: value.folder,
    id: value.id,
    rrules: value.rrules,
  };
}
