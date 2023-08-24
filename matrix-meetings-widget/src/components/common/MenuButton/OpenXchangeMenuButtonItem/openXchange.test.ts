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
import { NordeckMeetingMetadataEvent } from '../../../../lib/matrix';
import { mockNordeckMeetingMetadataEvent } from '../../../../lib/testUtils';
import {
  buildOpenXChangeLink,
  getOpenXChangeExternalReference,
} from './openXchange';

function createEvent(opts: {
  folder: string | number;
  id: string | number;
}): StateEvent<NordeckMeetingMetadataEvent> {
  return mockNordeckMeetingMetadataEvent({
    content: {
      external_data: {
        'io.ox': {
          folder: opts.folder,
          id: opts.id,
          rrules: ['FREQ=DAILY;COUNT=10'],
        },
      },
    },
  });
}

describe('getOpenXChangeExternalReference', () => {
  it('should return reference', () => {
    expect(
      getOpenXChangeExternalReference(
        createEvent({
          folder: 'cal://0/31',
          id: 'cal://0/31.1.0',
        }),
      ),
    ).toEqual({
      folder: 'cal://0/31',
      id: 'cal://0/31.1.0',
    });
  });

  it('should return undefined if folder has invalid type', () => {
    expect(
      getOpenXChangeExternalReference(
        createEvent({
          folder: 555,
          id: 'cal://0/31.1.0',
        }),
      ),
    ).toBeUndefined();
  });

  it('should return undefined if invalid type', () => {
    expect(
      getOpenXChangeExternalReference(
        createEvent({
          folder: 'cal://0/31',
          id: 555,
        }),
      ),
    ).toBeUndefined();
  });

  it('should return undefined if missing', () => {
    expect(
      getOpenXChangeExternalReference(mockNordeckMeetingMetadataEvent()),
    ).toBeUndefined();
  });
});

describe('buildOpenXChangeLink', () => {
  it('should render template', () => {
    expect(
      buildOpenXChangeLink(
        {
          folder: 'cal://0/31',
          id: 'cal://0/31.1.0',
        },
        'https://ox.io/appsuite/#app=io.ox/calendar&id={{id}}&folder={{folder}}',
      ),
    ).toEqual(
      'https://ox.io/appsuite/#app=io.ox/calendar&id=cal://0/31.1.0&folder=cal://0/31',
    );
  });
});
