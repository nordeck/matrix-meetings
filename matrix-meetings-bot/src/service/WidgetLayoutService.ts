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

import { Inject, Injectable, Logger } from '@nestjs/common';
import _ from 'lodash-es';
import { ModuleProviderToken } from '../ModuleProviderToken';
import {
  WidgetLayoutConfig,
  WidgetLayoutStateEventContent,
} from '../model/WidgetLayoutTypes';

@Injectable()
export class WidgetLayoutService {
  private logger = new Logger(WidgetLayoutService.name);

  constructor(
    @Inject(ModuleProviderToken.WIDGET_LAYOUTS)
    private readonly layouts: WidgetLayoutConfig[],
  ) {}

  /**
   *  If there's a custom layout config, then renders the **content** for the 'io.element.widgets.layout' state event
   * @param widgetIds - array of widget ids
   * @return the event **content**, null if there's no custom config for the provided widget ids
   */
  public renderWidgetLayoutEventContent(
    widgetIds: string[],
  ): WidgetLayoutStateEventContent | null {
    // find a config for provided widget ids
    const widgetIdsSorted = _.sortBy(widgetIds);
    const config: WidgetLayoutConfig | undefined = this.layouts.find((o) =>
      _.isEqual(o.widgetIds, widgetIdsSorted),
    );
    if (!config) {
      this.logger.debug(`Can't find widget layout config for [${widgetIds}]`);
      return null;
    }

    return {
      widgets: config.layouts,
    };
  }
}
