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

import base64url from 'base64url';
import { Request } from 'express';
import fetch from 'jest-fetch-mock';
import { MatrixClient } from 'matrix-bot-sdk';
import { mock, resetCalls } from 'ts-mockito';
import { IAppConfiguration } from '../../src/IAppConfiguration';
import { MatrixAuthMiddleware } from '../../src/middleware/MatrixAuthMiddleware';
import { createAppConfig } from '../util/MockUtils';

describe('test relevant functionality of MatrixAuthMiddleware', () => {
  const appConfig: IAppConfiguration = createAppConfig();
  const clientMock: MatrixClient = mock(MatrixClient);

  beforeEach(() => {
    fetch.resetMocks();
    fetch.enableMocks();
    resetCalls(clientMock);
  });

  test('with missing header', async () => {
    const matrixAuth = new MatrixAuthMiddleware(appConfig);
    const mockRequest: Request = {} as Request;
    await expect(
      matrixAuth.extractUserContext(mockRequest),
    ).resolves.toBeUndefined();
  });

  test('Valid header for authorization is missing', async () => {
    const matrixAuth = new MatrixAuthMiddleware(appConfig);
    const mockRequest = {
      headers: {
        authorization: 'PETER asdfasdf',
      },
    } as Request;
    await expect(matrixAuth.extractUserContext(mockRequest)).rejects.toThrow(
      Error,
    );
  });

  test('MX-Identity valid authorization-header', async () => {
    appConfig.homeserver_url = 'abc';
    const matrixAuth = new MatrixAuthMiddleware(appConfig);
    const auth = `MX-Identity ${base64url(
      '{"state":"allowed","original_request_id":"widgetapi-163.....28529","access_token":"gaRTYVTSFO-----","token_type":"Bearer","matrix_server_name":"server","expires_in":3600,"expirationDate":"2021-10-11T08:47:11.551Z"}',
    )}`;
    const mockRequest = {
      headers: {
        authorization: auth,
      },
    } as Request;

    fetch.mockResponseOnce(JSON.stringify({ sub: 4711 }));
    const result = await matrixAuth.extractUserContext(mockRequest);
    expect(result?.userId).toEqual(4711);
  });

  test('MX-Identity invalid authorization-header for example not base64Url', async () => {
    appConfig.homeserver_url = 'abc';
    const matrixAuth = new MatrixAuthMiddleware(appConfig);
    const auth =
      'MX-Identity ' +
      '{"state":"allowed","original_request_id":"widgetapi-163.....28529","access_token":"gaRTYVTSFO-----","token_type":"Bearer","matrix_server_name":"server","expires_in":3600,"expirationDate":"2021-10-11T08:47:11.551Z"}';
    const mockRequest = {
      headers: {
        authorization: auth,
      },
    } as Request;
    await expect(matrixAuth.extractUserContext(mockRequest)).rejects.toThrow(
      Error,
    );
  });

  test('Bearer authorization-header', async () => {
    const matrixAuth = new MatrixAuthMiddleware(appConfig);
    const auth = 'Bearer syt_bWlraGFpbA_PyWOkXWDjmWqFSOYGBiI_2aBYTR';
    const mockRequest = {
      headers: {
        authorization: auth,
      },
    } as Request;

    fetch.mockResponseOnce(JSON.stringify({ user_id: '@user' }));
    const result = await matrixAuth.extractUserContext(mockRequest);
    expect(result?.userId).toEqual('@user');
  });
});
