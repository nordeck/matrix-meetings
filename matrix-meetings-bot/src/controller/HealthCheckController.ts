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

import { Controller, Get, HttpException, Inject } from '@nestjs/common';
import { IAppConfiguration } from '../IAppConfiguration';
import { ModuleProviderToken } from '../ModuleProviderToken';

@Controller({
  path: 'health',
  version: ['1'],
})
export class HealthCheckController {
  constructor(
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private appConfig: IAppConfiguration,
  ) {}

  //TODO: PB-2420 put jsdoc here with description
  //TODO: PB-2420 test a bit more what happens if synapse not working or other cases
  @Get()
  async health() {
    const url = `${this.appConfig.homeserver_url}/health`;
    const response = await fetch(url);
    if (response.ok) {
      return 'Healthy';
    } else {
      throw new HttpException(await response.text(), response.status);
    }
  }
}
