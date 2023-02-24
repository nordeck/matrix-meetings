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

import { StateEvent } from '@matrix-widget-toolkit/api';
import Mustache from 'mustache';
import { NordeckMeetingMetadataEvent } from '../../../../lib/matrix';

const OPEN_XCHANGE_TYPE = 'io.ox';

export type OpenXChangeExternalReference = {
  folder: string;
  id: string;
};

export function getOpenXChangeExternalReference(
  event: StateEvent<NordeckMeetingMetadataEvent>
): OpenXChangeExternalReference | undefined {
  const externalData = event.content.external_data?.[OPEN_XCHANGE_TYPE];

  if (!externalData) {
    return undefined;
  }

  if (typeof externalData.folder !== 'string') {
    return undefined;
  }

  if (typeof externalData.id !== 'string') {
    return undefined;
  }

  return {
    folder: externalData.folder,
    id: externalData.id,
  };
}

export function buildOpenXChangeLink(
  reference: OpenXChangeExternalReference,
  urlTemplate: string
): string {
  return Mustache.render(urlTemplate, reference, undefined, {
    escape: (t) => t,
  });
}
