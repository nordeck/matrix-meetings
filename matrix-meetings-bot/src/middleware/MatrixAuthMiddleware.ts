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

import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import base64url from 'base64url';
import { NextFunction, Request, Response } from 'express';
import fetch from 'node-fetch';
import { IAppConfiguration } from '../IAppConfiguration';
import { MatrixEndpoint } from '../MatrixEndpoint';
import { ModuleProviderToken } from '../ModuleProviderToken';
import { NET_NORDECK_CONTEXT } from '../decorator/IParamExtractor';
import { IUserContext } from '../model/IUserContext';

export const BEARER = 'Bearer';
export const MX_IDENTITY = 'MX-Identity';

export const HEADER_NAME_TIMEZONE = 'x-timezone';
export const HEADER_NAME_ACCEPT_LANGUAGE = 'accept-language';

@Injectable()
export class MatrixAuthMiddleware implements NestMiddleware {
  private logger = new Logger(MatrixAuthMiddleware.name);

  constructor(
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private appConfig: IAppConfiguration,
  ) {}

  /**
   * sets request.netNordeckContext with IUserContext if matrix user token is presented in headers and valid
   * @param request
   * @param response
   * @param next
   */
  async use(request: Request, response: Response, next: NextFunction) {
    let userContext: IUserContext | undefined;
    try {
      userContext = await this.extractUserContext(request);
    } catch (err) {
      this.logger.warn(`Matrix authentication fails: ${err}`);
    }
    if (userContext) {
      (request as any)[NET_NORDECK_CONTEXT] = userContext;
    }
    next();
  }

  async extractUserContext(
    request: Request,
  ): Promise<IUserContext | undefined> {
    if (!request.headers?.authorization) {
      return undefined;
    }

    let userId;
    const authorization = request.headers.authorization.split(' ');
    switch (authorization[0]) {
      case MX_IDENTITY: {
        let json;
        try {
          json = JSON.parse(
            base64url.decode(
              request.headers.authorization.substring(MX_IDENTITY.length + 1),
            ),
          );
        } catch (err) {
          throw new Error('Could not parse Json');
        }
        userId = await this.loginByOpenIdToken(json);
        break;
      }
      case BEARER: {
        userId = await this.whoAmI(request.headers.authorization);
        break;
      }
      default: {
        throw new Error('Invalid authorization header');
      }
    }

    return {
      userId,
      locale: request.headers[HEADER_NAME_ACCEPT_LANGUAGE] ?? 'en',
      timezone:
        (request.headers[HEADER_NAME_TIMEZONE] as string) ?? 'Europe/Berlin', //TODO: PB-2465 timezone to UTC
    };
  }

  /**
   * Exchanges an OpenID access token for information about the user who generated the token. Currently this only exposes the Matrix User ID of the owner.
   * @param openIdTokenFromWidget the OpenID access token to get information about the owner for.
   * @return The Matrix User ID who generated the token.
   */
  private async loginByOpenIdToken(
    openIdTokenFromWidget: any,
  ): Promise<string> {
    if (
      !openIdTokenFromWidget.matrix_server_name ||
      !openIdTokenFromWidget.access_token
    ) {
      throw new Error('Invalid authorization header');
    }

    const access_token = encodeURIComponent(openIdTokenFromWidget.access_token);
    const fetchUrl = `${this.appConfig.homeserver_url}${MatrixEndpoint.USER_INFO}?access_token=${access_token}`;
    let response;
    try {
      response = await fetch(fetchUrl);
    } catch (err) {
      const ex: any = err;
      throw new Error(
        `Client was not able to connect to the needed address: ${ex.code} ${ex.message}`,
      );
    }

    if (response.ok) {
      const result = await response.json();
      const userId = result.sub;
      return userId;
    } else {
      const text = await response.text();
      const status = response.status;
      throw new Error(`Could not verify user by token:  ${status} ${text}`);
    }
  }

  private async whoAmI(authorizationHeader: string): Promise<string> {
    let response;
    try {
      response = await fetch(
        `${this.appConfig.homeserver_url}${MatrixEndpoint.WHO_AM_I}`,
        {
          headers: {
            Authorization: authorizationHeader,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (err) {
      const ex: any = err;
      throw new Error(
        `Client was not able to connect to the needed address ${ex.code} ${ex.message}`,
      );
    }
    if (response.ok) {
      const json = await response.json();
      return json.user_id;
    } else {
      const text = await response.text();
      const status = response.status;
      throw new Error(`Could not verify user by token: ${status} ${text}`);
    }
  }
}
