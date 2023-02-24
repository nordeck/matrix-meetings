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

export function getColor(userId: string): string {
  const defaultColors = ['#0DBD8B', '#368bd6', '#ac3ba8'];
  let total = 0;
  for (let i = 0; i < userId.length; ++i) {
    total += userId.charCodeAt(i);
  }
  const colorIndex = total % defaultColors.length;

  return defaultColors[colorIndex];
}
