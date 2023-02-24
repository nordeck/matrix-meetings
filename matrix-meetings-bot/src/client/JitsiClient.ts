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
import fetch from 'node-fetch';
import { base32 } from 'rfc4648';
import { MeetingSharingInformationDto } from '../dto/MeetingSharingInformationDto';
import { IAppConfiguration } from '../IAppConfiguration';
import { ModuleProviderToken } from '../ModuleProviderToken';

@Injectable()
export class JitsiClient {
  private logger = new Logger(JitsiClient.name);

  private cached_jitsi_dial_in_numbers = null;

  constructor(
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private appConfig: IAppConfiguration
  ) {}

  public async getSharingInformationAsync(
    room_id: string
  ): Promise<MeetingSharingInformationDto> {
    return {
      jitsi_dial_in_number: this.getDefaultPhoneNumber(
        await this.getJitsiDialInNumberAsync()
      ),
      jitsi_pin: await this.getJitsiPinAsync(room_id),
    };
  }

  private async getJitsiDialInNumberAsync() {
    if (
      this.appConfig.jitsi_dial_in_json_url &&
      !this.cached_jitsi_dial_in_numbers
    ) {
      try {
        const response = await fetch(this.appConfig.jitsi_dial_in_json_url, {
          method: 'get',
        });
        if (response.ok) {
          this.cached_jitsi_dial_in_numbers = await response.json();
        } else {
          this.logger.error(
            `Could not fetch jitsi_dial_in_json_url ${
              this.appConfig.jitsi_dial_in_json_url
            } ${response.status}  ${await response.text()}`
          );
        }
      } catch (err) {
        if (err instanceof Error) {
          this.logger.error(
            err,
            `Could not fetch jitsi_dial_in_json_url ${this.appConfig.jitsi_dial_in_json_url} error: ${err.message}, stack: ${err.stack}`
          );
        } else {
          this.logger.error(
            err,
            `Could not fetch jitsi_dial_in_json_url ${this.appConfig.jitsi_dial_in_json_url} error: ${err}`
          );
        }
      }
    }
    return this.cached_jitsi_dial_in_numbers;
  }

  private getDefaultPhoneNumber(dialInNumbers: any): string | undefined {
    if (dialInNumbers) {
      if (Array.isArray(dialInNumbers)) {
        const defaultNumber = dialInNumbers.find((number) => number.default);
        if (defaultNumber) {
          return defaultNumber.formattedNumber;
        }
        return dialInNumbers.length > 0
          ? dialInNumbers[0].formattedNumber
          : null;
      }
      const { numbers } = dialInNumbers;
      if (numbers && Object.keys(numbers).length > 0) {
        const firstRegion = Object.keys(numbers)[0];
        return firstRegion && numbers[firstRegion][0];
      }
    }
    return undefined;
  }

  private async getJitsiPinAsync(room_id: string): Promise<number | undefined> {
    let result: number | undefined = undefined;
    if (this.appConfig.jitsi_pin_url) {
      try {
        const base32_room_name = base32.stringify(Buffer.from(room_id), {
          pad: false,
        });
        const url = this.appConfig.jitsi_pin_url.replace(
          '{base32_room_name}',
          base32_room_name
        );
        const response = await fetch(url, { method: 'get' });
        if (response.ok) {
          result = (await response.json()).id;
        } else {
          this.logger.error(
            `Could not fetch jitsi_pin_url ${this.appConfig.jitsi_pin_url} ${
              response.status
            }  ${await response.text()}`
          );
        }
      } catch (err) {
        if (err instanceof Error) {
          this.logger.error(
            err,
            `Could not fetch jitsi_pin_url ${this.appConfig.jitsi_pin_url} error: ${err.message}, stack: ${err.stack}`
          );
        } else {
          this.logger.error(
            err,
            `Could not fetch jitsi_pin_url ${this.appConfig.jitsi_pin_url}`
          );
        }
      }
    }
    return result;
  }
}
