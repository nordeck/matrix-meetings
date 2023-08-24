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

import {
  HttpArgumentsHost,
  RpcArgumentsHost,
} from '@nestjs/common/interfaces/features/arguments-host.interface';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { instance, mock, reset, when } from 'ts-mockito';
import {
  NET_NORDECK_CONTEXT,
  ParamName,
  paramExtractor,
} from '../../src/decorator/IParamExtractor';
import { IUserContext } from '../../src/model/IUserContext';
import { IContext } from '../../src/rpc/IContext';

describe('paramExtractor suite', () => {
  const userContext: IUserContext = {
    locale: '',
    timezone: '',
    userId: '',
  };

  const context: IContext = {
    roomId: 'a1',
    event: undefined as any,
    userContext,
  };

  const exMock: ExecutionContextHost = mock(ExecutionContextHost);
  const ex: ExecutionContextHost = instance(exMock);

  beforeEach(() => {
    reset(exMock);
  });

  test('contextExtractor apply http', () => {
    const httpArgumentsHost: HttpArgumentsHost = {
      getNext(): any {
        return undefined;
      },
      getRequest(): any {
        return {
          [NET_NORDECK_CONTEXT]: context.userContext,
        };
      },
      getResponse(): any {
        return undefined;
      },
    };

    when(exMock.getType()).thenReturn('http');
    when(exMock.switchToHttp()).thenReturn(httpArgumentsHost);

    expect(paramExtractor(ex, ParamName.USER_CONTEXT)).toBe(
      context.userContext,
    );
  });

  test('paramExtractor apply rpc', () => {
    const rpcArgumentsHost: RpcArgumentsHost = {
      getContext(): any {
        return context;
      },
      getData(): any {
        return undefined;
      },
    };

    when(exMock.getType()).thenReturn('rpc');
    when(exMock.switchToRpc()).thenReturn(rpcArgumentsHost);

    expect(paramExtractor(ex, ParamName.ROOM_ID)).toBe(context.roomId);
    expect(paramExtractor(ex, ParamName.USER_CONTEXT)).toBe(
      context.userContext,
    );
  });

  test('paramExtractor apply other', () => {
    when(exMock.getType()).thenReturn('ws');

    expect(() => {
      paramExtractor(ex, ParamName.ROOM_ID);
    }).toThrow(new Error('unsupported context type: ws'));
  });
});
