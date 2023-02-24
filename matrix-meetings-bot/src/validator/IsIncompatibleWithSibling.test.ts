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

import { IsString, validate } from 'class-validator';
import { IsIncompatibleWithSibling } from './IsIncompatibleWithSibling';

class TestDto {
  @IsString()
  @IsIncompatibleWithSibling('third')
  first?: string;

  @IsString()
  @IsIncompatibleWithSibling('third')
  second?: string;

  @IsString()
  @IsIncompatibleWithSibling('first', 'second')
  third?: string;

  constructor(first?: string, second?: string, third?: string) {
    this.first = first;
    this.second = second;
    this.third = third;
  }
}

describe('IsIncompatibleWithSibling', () => {
  it('should accept first and second property', async () => {
    const input = new TestDto('FIRST', 'SECOND', undefined);

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it('should accept third property', async () => {
    const input = new TestDto(undefined, undefined, 'THIRD');

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it('should generate error messages', async () => {
    const input = new TestDto('FIRST', 'SECOND', 'THIRD');

    await expect(validate(input)).resolves.toEqual([
      expect.objectContaining({
        property: 'first',
        constraints: {
          isNotSiblingOf:
            'first cannot exist alongside the following defined properties: third',
        },
      }),
      expect.objectContaining({
        property: 'second',
        constraints: {
          isNotSiblingOf:
            'second cannot exist alongside the following defined properties: third',
        },
      }),
      expect.objectContaining({
        property: 'third',
        constraints: {
          isNotSiblingOf:
            'third cannot exist alongside the following defined properties: first, second',
        },
      }),
    ]);
  });

  it.each([
    ['FIRST', undefined, undefined],
    [undefined, 'SECOND', undefined],
    ['FIRST', undefined, 'THIRD'],
    [undefined, 'SECOND', 'THIRD'],
    ['FIRST', 'SECOND', 'THIRD'],
  ])('should reject %p', async (first, second, third) => {
    const input = new TestDto(first, second, third);

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });
});
