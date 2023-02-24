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
  buildMessage,
  isString,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';

export const IS_MATRIX_ROOM_ID = 'isMatrixRoomId';

export function isMatrixRoomId(value: unknown): boolean {
  if (isString(value)) {
    return value.startsWith('!') && value.includes(':');
  } else {
    return false;
  }
}

export function IsMatrixRoomId(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_MATRIX_ROOM_ID,
      validator: {
        validate: (value): boolean => isMatrixRoomId(value),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be a matrix room id starting with !`,
          validationOptions
        ),
      },
    },
    validationOptions
  );
}
