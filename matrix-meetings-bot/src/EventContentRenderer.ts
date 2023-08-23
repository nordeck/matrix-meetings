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

import { Inject, Injectable } from '@nestjs/common';
import Mustache from 'mustache';
import { DeepReadonly, DeepReadonlyArray } from './DeepReadOnly';
import { IAppConfiguration } from './IAppConfiguration';
import { IEventContentParams } from './IEventContentParams';
import { ModuleProviderToken } from './ModuleProviderToken';
import { IMatrixEvent } from './matrix/event/IMatrixEvent';
import { IRoomEvent } from './matrix/event/IRoomEvent';
import { IStateEvent } from './matrix/event/IStateEvent';
import { IWidgetContent } from './model/IWidgetContent';
import { StateEventName } from './model/StateEventName';

@Injectable()
export class EventContentRenderer {
  constructor(
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private appConfiguration: IAppConfiguration
  ) {}

  public renderStateEvents<T>(
    events: DeepReadonlyArray<IStateEvent<T>>,
    model: IEventContentParams
  ): DeepReadonlyArray<IStateEvent<T>> {
    return this.renderEvents(events, model);
  }

  public renderRoomEvents<T>(
    events: DeepReadonlyArray<IRoomEvent<T>>,
    model: IEventContentParams
  ): DeepReadonlyArray<IRoomEvent<T>> {
    return this.renderEvents(events, model);
  }

  private renderEvents<T, E extends DeepReadonly<IMatrixEvent<T>>>(
    events: DeepReadonlyArray<E>,
    model: IEventContentParams
  ): DeepReadonlyArray<E> {
    return events.map((input) => {
      const newContent = this.renderEventContent(
        input.type,
        input.content,
        model
      );
      const eventCopy: DeepReadonly<E> = {
        ...input,
        content: newContent,
      };
      return eventCopy;
    });
  }

  public renderEventContent(
    eventType: string,
    eventContent: any,
    model: IEventContentParams
  ): any {
    const templateModel: any = {
      ...model,
    };

    if (eventType === StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT) {
      const widgetContent: IWidgetContent = eventContent as IWidgetContent;

      // non mustache data values are assigned to the model to be used in rendering if needed
      for (const key in widgetContent.data) {
        const value = widgetContent.data[key];
        if (typeof value !== 'string' || !value.startsWith('{{')) {
          if (!templateModel['data']) {
            templateModel['data'] = {};
          }
          templateModel['data'][key] = value;
        }
      }
    }

    const template = JSON.stringify(eventContent);
    const renderedTemplate = this.renderTemplate(template, templateModel);
    return JSON.parse(renderedTemplate);
  }

  public renderTemplate(template: string, model: any): string {
    const templateModel: any = {
      appConfig: this.appConfiguration,
      ...model,
      encodeURIComponent() {
        return function (text: string, render: (text: string) => string) {
          return encodeURIComponent(render(text));
        };
      },
    };

    const renderOptions = {
      escape(value: any): string {
        if (typeof value === 'string') {
          return value
            .replace(/\\/g, '\\\\') // \ -> \\
            .replace(/"/g, '\\"'); // " -> \"
        } else {
          return value;
        }
      },
    };

    return Mustache.render(template, templateModel, undefined, renderOptions);
  }
}
