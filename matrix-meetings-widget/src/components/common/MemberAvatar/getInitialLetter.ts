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

export function getInitialLetter(name: string): string {
  if (name.length < 1) {
    return '';
  }

  let idx = 0;
  const initial = name[0];
  if ((initial === '@' || initial === '#' || initial === '+') && name[1]) {
    idx++;
  }

  // string.codePointAt(0) would do this, but that isn't supported by
  // some browsers (notably PhantomJS).
  let chars = 1;
  const first = name.charCodeAt(idx);

  // check if it’s the start of a surrogate pair
  if (first >= 0xd800 && first <= 0xdbff && name[idx + 1]) {
    const second = name.charCodeAt(idx + 1);
    if (second >= 0xdc00 && second <= 0xdfff) {
      chars++;
    }
  }

  const firstChar = name.substring(idx, idx + chars);
  return firstChar.toUpperCase();
}
