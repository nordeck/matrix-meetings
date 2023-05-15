/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { extractOpenXChangeExternalReference } from './ExternalData';

describe('extractOpenXChangeExternalReference', () => {
  it('should return reference', () => {
    expect(
      extractOpenXChangeExternalReference({
        'io.ox': {
          folder: 'cal://0/31',
          id: 'cal://0/31.1.0',
          rrules: ['FREQ=DAILY;COUNT=10'],
        },
      })
    ).toEqual({
      folder: 'cal://0/31',
      id: 'cal://0/31.1.0',
      rrules: ['FREQ=DAILY;COUNT=10'],
    });
  });

  it('should return reference if id is undefined', () => {
    expect(
      extractOpenXChangeExternalReference({
        'io.ox': {
          folder: 'cal://0/31',
          id: undefined,
          rrules: ['FREQ=DAILY;COUNT=10'],
        },
      })
    ).toEqual({
      folder: 'cal://0/31',
      id: undefined,
      rrules: ['FREQ=DAILY;COUNT=10'],
    });
  });

  it('should return undefined if folder has invalid type', () => {
    expect(
      extractOpenXChangeExternalReference({
        'io.ox': {
          folder: 555,
          id: 'cal://0/31.1.0',
          rrules: ['FREQ=DAILY;COUNT=10'],
        },
      })
    ).toBeUndefined();
  });

  it('should return undefined if id has invalid type', () => {
    expect(
      extractOpenXChangeExternalReference({
        'io.ox': {
          folder: 'cal://0/31',
          id: 555,
          rrules: ['FREQ=DAILY;COUNT=10'],
        },
      })
    ).toBeUndefined();
  });

  it.each([
    555,
    [555],
    ['FREQ=DAILY;COUNT=10', 555],
    ['FREQ=DAILY;COUNT=10', undefined],
    ['FREQ=DAILY;COUNT=10', null],
    ['FREQ=DAILY;COUNT=10', {}],
    ['not a rrule here'],
  ])('should return undefined if rrules has invalid value: %s', (rrules) => {
    expect(
      extractOpenXChangeExternalReference({
        'io.ox': {
          folder: 'cal://0/31',
          id: 'cal://0/31.1.0',
          rrules,
        },
      })
    ).toBeUndefined();
  });

  it('should return undefined if missing', () => {
    expect(extractOpenXChangeExternalReference(undefined)).toBeUndefined();
  });

  it('should return undefined if not OX namespace', () => {
    expect(
      extractOpenXChangeExternalReference({
        some_namespace: {
          folder: 'cal://0/31',
          id: 'cal://0/31.1.0',
          rrules: ['FREQ=DAILY;COUNT=10'],
        },
      })
    ).toBeUndefined();
  });
});
