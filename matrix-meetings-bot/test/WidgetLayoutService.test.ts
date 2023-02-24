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
import { WidgetLayoutService } from '../src/service/WidgetLayoutService';

describe('test WidgetLayoutService', () => {
  let layoutConfigReader: WidgetLayoutConfigReader;
  let widgetLayoutService: WidgetLayoutService;

  beforeEach(() => {
    layoutConfigReader = new WidgetLayoutConfigReader(
      'test/conf/test_default_widget_layouts.json.json'
    );
    widgetLayoutService = new WidgetLayoutService(layoutConfigReader.read());
  });

  test("can't find the layout config", () => {
    const key: string[] = ['poll'];
    const layoutForWidgetCombination =
      widgetLayoutService.renderWidgetLayoutEventContent(key);
    expect(layoutForWidgetCombination).toBeNull();
  });

  test('read layout', async () => {
    const stateKeys = ['poll', 'jitsi'];

    // this is the content for IO_ELEMENT_WIDGETS_LAYOUT_EVENT state event
    const expectedContent = {
      widgets: {
        poll: {
          container: 'top',
          index: 0,
          width: 100,
          height: 40,
        },
        jitsi: {
          container: 'right',
        },
      },
    };

    const layoutForWidgetCombination =
      widgetLayoutService.renderWidgetLayoutEventContent(stateKeys);
    expect(layoutForWidgetCombination).toStrictEqual(expectedContent);
  });
});
