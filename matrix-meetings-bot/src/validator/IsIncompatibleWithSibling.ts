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

import { isDefined, ValidateBy, ValidateIf } from 'class-validator';

/**
 * Checks if the none of the provided {@code propNames} are defined when this property is defined.
 * If the given property is not defined, it ignores all validators.
 *
 * @param propNames - A list of property names in the same object that must not be defined.
 */
export function IsIncompatibleWithSibling(...propNames: string[]) {
  const notSiblingOf = ValidateBy({
    name: 'isNotSiblingOf',
    validator: {
      validate: (value, args): boolean => {
        // if defined -> the other must not be defined
        return (
          // this field is required
          !isDefined(value) ||
          // other fields shouldn't exist
          propNames.some(
            (propName) => !isDefined((args?.object as any)?.[propName]),
          )
        );
      },
      defaultMessage: (args) => {
        const failures = propNames.filter((propName) =>
          isDefined((args?.object as any)?.[propName]),
        );

        return `${args?.property} cannot exist alongside the following defined properties: ${failures.join(
          ', ',
        )}`;
      },
    },
  });

  const validateIf = ValidateIf((object, value) => {
    return (
      // enable validation if the property is defined
      isDefined(value) ||
      // enable verification if _no other_ property is defined
      propNames.some((propName) => !isDefined(object[propName]))
    );
  });

  return (target: any, key: string) => {
    notSiblingOf(target, key);
    validateIf(target, key);
  };
}
