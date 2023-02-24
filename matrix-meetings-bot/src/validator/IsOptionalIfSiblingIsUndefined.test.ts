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
import { IsOptionalIfSiblingIsUndefined } from './IsOptionalIfSiblingIsUndefined';

class TestDto {
  @IsString()
  @IsOptionalIfSiblingIsUndefined('second')
  first?: string;

  @IsString()
  @IsOptionalIfSiblingIsUndefined('first')
  second?: string;

  constructor(first?: string, second?: string) {
    this.first = first;
    this.second = second;
  }
}

describe('IsOptionalIfSiblingIsUndefined', () => {
  it('should accept first and second property', async () => {
    const input = new TestDto('FIRST', 'SECOND');

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it('should accept missing properties', async () => {
    const input = new TestDto(undefined, undefined);

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it('should generate error message when first property is not set', async () => {
    const input = new TestDto(undefined, 'FIRST');

    await expect(validate(input)).resolves.toEqual([
      expect.objectContaining({
        property: 'first',
        constraints: {
          isString: 'first must be a string',
        },
      }),
    ]);
  });

  it('should generate error message when second property is not set', async () => {
    const input = new TestDto('FIRST', undefined);

    await expect(validate(input)).resolves.toEqual([
      expect.objectContaining({
        property: 'second',
        constraints: {
          isString: 'second must be a string',
        },
      }),
    ]);
  });
});
