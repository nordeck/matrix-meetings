/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { EventContentRenderer } from '../EventContentRenderer';
import { IAppConfiguration } from '../IAppConfiguration';
import { WidgetController } from './WidgetController';

describe('WidgetController', () => {
  let eventContentRenderer: EventContentRenderer;

  beforeEach(() => {
    eventContentRenderer = new EventContentRenderer({
      bot_displayname: 'Bot User',
    } as IAppConfiguration);
  });

  it('should return a list of widgets', () => {
    const widgetController = new WidgetController(eventContentRenderer, {
      roomEvents: [],
      stateEvents: [],
      widgetContents: [
        { id: 'widget-1', name: 'Widget 1', type: 'm.custom', url: '' },
        { id: 'widget-2', name: 'Widget 2', type: 'm.custom', url: '' },
      ],
      allWidgetIds: ['widget-1', 'widget-2'],
      defaultWidgetIds: ['widget-1', 'widget-2'],
    });

    expect(widgetController.widgetList()).toEqual([
      { id: 'widget-1', name: 'Widget 1', optional: false },
      { id: 'widget-2', name: 'Widget 2', optional: false },
    ]);
  });

  it('should return optional widgets', () => {
    const widgetController = new WidgetController(eventContentRenderer, {
      roomEvents: [],
      stateEvents: [],
      widgetContents: [
        { id: 'widget-1', name: 'Widget 1', type: 'm.custom', url: '' },
        { id: 'widget-2', name: 'Widget 2', type: 'm.custom', url: '' },
      ],
      allWidgetIds: ['widget-1', 'widget-2'],
      defaultWidgetIds: ['widget-2'],
    });

    expect(widgetController.widgetList()).toEqual([
      { id: 'widget-1', name: 'Widget 1', optional: true },
      { id: 'widget-2', name: 'Widget 2', optional: false },
    ]);
  });

  it('should render configuration values in the name', () => {
    const widgetController = new WidgetController(eventContentRenderer, {
      roomEvents: [],
      stateEvents: [],
      widgetContents: [
        {
          id: 'widget-1',
          name: 'Widget 1 ({{appConfig.bot_displayname}})',
          type: 'm.custom',
          url: '',
        },
      ],
      allWidgetIds: ['widget-1'],
      defaultWidgetIds: ['widget-1'],
    });

    expect(widgetController.widgetList()).toEqual([
      { id: 'widget-1', name: 'Widget 1 (Bot User)', optional: false },
    ]);
  });
});
