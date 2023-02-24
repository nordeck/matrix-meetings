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

import { WidgetLayoutConfigReader } from '../src/io/WidgetLayoutConfigReader';

describe('test LayoutConfigReader', () => {
  let layoutConfigReader: WidgetLayoutConfigReader;

  beforeEach(() => {
    layoutConfigReader = new WidgetLayoutConfigReader(
      'test/conf/test_default_widget_layouts.json.json'
    );
  });

  test('just works', () => {
    const layoutConfigs = layoutConfigReader.read();
    expect(layoutConfigs).toHaveLength(4);
  });

  test('file not found', () => {
    const badReader = new WidgetLayoutConfigReader('bad');
    expect(() => badReader.read()).toThrow();
  });
});
