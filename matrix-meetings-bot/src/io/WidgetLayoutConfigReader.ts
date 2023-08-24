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

import { Logger } from '@nestjs/common';
import fs from 'fs';
import Joi from 'joi';
import { WidgetLayoutConfig } from '../model/WidgetLayoutTypes';

export class WidgetLayoutConfigReader {
  private logger = new Logger(WidgetLayoutConfigReader.name);

  constructor(private path: string) {}

  read() {
    const json = JSON.parse(
      fs.readFileSync(this.path, {
        encoding: 'utf8',
        flag: 'r',
      }),
    );
    Joi.assert(json, schema);
    const layouts = json as WidgetLayoutConfig[];
    for (const layout of layouts) {
      layout.widgetIds.sort(); // sorts widget ids, mutates original array
    }
    return layouts;
  }
}

export const schema = Joi.array().items(
  Joi.object({
    widgetIds: Joi.array().items(Joi.string().required()).required(), //TODO: MA string required?
    layouts: Joi.object().pattern(
      /^/,
      Joi.object({
        container: Joi.string()
          .valid('top', 'bottom', 'center', 'left', 'right')
          .required(),
        index: Joi.number(),
        width: Joi.number(),
        height: Joi.number(),
      }),
    ),
  }),
);
