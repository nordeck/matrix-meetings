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

import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { IAppConfiguration } from '../IAppConfiguration';
import { ModuleProviderToken } from '../ModuleProviderToken';
import { ConfigurationDto } from '../dto/ConfigurationDto';
import { MatrixAuthGuard } from '../guard/MatrixAuthGuard';

@Controller({
  path: 'config',
  version: ['1'],
})
@UseGuards(MatrixAuthGuard)
export class ConfigurationController {
  constructor(
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private appConfig: IAppConfiguration,
  ) {}

  @Get()
  getConfigValues(): ConfigurationDto {
    return new ConfigurationDto(
      this.appConfig.homeserver_url,
      !!this.appConfig.jitsi_dial_in_json_url,
      this.appConfig.open_xchange_meeting_url_template,
    );
  }
}
