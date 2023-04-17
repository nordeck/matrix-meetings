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

import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { DeepReadonly } from '../DeepReadOnly';
import { WidgetIdNameDto } from '../dto/WidgetIdNameDto';
import { EventContentRenderer } from '../EventContentRenderer';
import { IRoomMatrixEvents } from '../model/IRoomMatrixEvents';
import { ModuleProviderToken } from '../ModuleProviderToken';

@Controller({
  path: 'widget',
  version: '1',
})
export class WidgetController {
  constructor(
    private readonly eventContentRenderer: EventContentRenderer,
    @Inject(ModuleProviderToken.ROOM_MATRIX_EVENTS)
    private readonly roomMatrixEvents: DeepReadonly<IRoomMatrixEvents>
  ) {}

  @Get('list')
  @ApiOkResponse({ type: WidgetIdNameDto })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  widgetList(): WidgetIdNameDto[] {
    return this.roomMatrixEvents.widgetContents.map((wc) => {
      const name: string = this.eventContentRenderer.renderTemplate(
        wc.name,
        {}
      );
      return new WidgetIdNameDto(
        wc.id,
        name,
        !this.roomMatrixEvents.defaultWidgetIds.includes(wc.id)
      );
    });
  }
}
