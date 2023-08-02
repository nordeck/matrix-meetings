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

import { Fragment } from 'react';

export function isReduceAnimations(): boolean {
  // We disable animation during tests in jsdom as it results in issues with
  // duplicate roles during transitions.
  return typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
}

export function NoTextField() {
  return <Fragment />;
}
