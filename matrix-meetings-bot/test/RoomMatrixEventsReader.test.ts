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

import { RoomMatrixEventsReader } from '../src/io/RoomMatrixEventsReader';

describe('RoomMatrixEventsReader', () => {
  test('read test', async () => {
    const events = new RoomMatrixEventsReader(
      'test/conf/test_default_events.json'
    ).read();
    expect(events.stateEvents.length).toBe(8);
    expect(events.roomEvents).toStrictEqual([]);
    expect(events.widgetIds.length).toBe(4);
    expect(events.widgetContents.length).toBe(4);

    events.widgetIds.forEach((o) => {
      if (!o) throw new Error('undefined widgetIds found');
    });

    events.widgetContents.forEach((o) => {
      if (!o) throw new Error('undefined widgetContents found');
    });
  });
});
