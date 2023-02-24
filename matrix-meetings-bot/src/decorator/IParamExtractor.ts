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

import { ExecutionContext } from '@nestjs/common';
import { IUserContext } from '../model/IUserContext';
import { IContext } from '../rpc/IContext';

export const NET_NORDECK_CONTEXT = 'netNordeckContext';

export enum ParamName {
  ROOM_ID = 'roomId',
  USER_CONTEXT = 'userContext',
}

interface IParamExtractor {
  (executionContext: ExecutionContext, paramName: ParamName): unknown;
}

/**
 * Extracts param from http or rpc context
 * @param executionContext nestjs request pipeline info
 * @param paramName parameter to extract
 */
export const paramExtractor: IParamExtractor = (
  executionContext: ExecutionContext,
  paramName: ParamName
): unknown => {
  switch (executionContext.getType()) {
    case 'http': {
      const request = executionContext.switchToHttp().getRequest();
      switch (paramName) {
        case ParamName.ROOM_ID:
          return undefined;
        case ParamName.USER_CONTEXT:
          return request[NET_NORDECK_CONTEXT] as IUserContext;
        default:
          throw new Error(
            `param ${paramName} not supported in context: ${executionContext.getType()}`
          );
      }
    }

    case 'rpc': {
      const context: IContext = executionContext.switchToRpc().getContext();
      switch (paramName) {
        case ParamName.ROOM_ID:
          return context.roomId;
        case ParamName.USER_CONTEXT:
          return context.userContext;
        default:
          throw new Error(
            `param ${paramName} not supported in context: ${executionContext.getType()}`
          );
      }
    }

    default:
      throw new Error(
        `unsupported context type: ${executionContext.getType()}`
      );
  }
};
