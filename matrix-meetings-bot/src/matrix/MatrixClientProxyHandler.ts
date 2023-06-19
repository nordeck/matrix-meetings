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
import { MatrixClient } from 'matrix-bot-sdk';
import { Matrix404Error } from '../error/Matrix404Error';
import { MatrixError } from '../error/MatrixError';

const logger = new Logger('MatrixClientProxyHandler');
/**
 * Proxy handler to intercept MatrixClient invocations.
 * Improves error handling by throwing MatrixError with relevant stack and message if operation to Matrix failed.
 */
export class MatrixClientProxyHandler implements ProxyHandler<MatrixClient> {
  get(target: MatrixClient, propKey: string | symbol): any {
    const targetPropValue: unknown = (target as any)[propKey];

    if (typeof targetPropValue === 'function') {
      // method invocation, apply custom error handling

      const errorStack = new Error().stack; // stores stack to be used in case of error

      return async function (...args: any[]) {
        let remainingRetries = 5;

        // eslint-disable-next-line no-constant-condition
        while (remainingRetries > 0) {
          try {
            return await targetPropValue.apply(target, args);
          } catch (reason) {
            const body = (reason as any)?.body;
            if (
              body?.errcode === 'M_LIMIT_EXCEEDED' &&
              body?.error &&
              body?.retry_after_ms
            ) {
              logger.warn(
                `${body.errcode}: Retry for ${remainingRetries} times. Wait for ${body.retry_after_ms}`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, body.retry_after_ms)
              );
              remainingRetries--;
            } else {
              const error = extractError(reason);
              error.stack = errorStack;
              throw error;
            }
          }
        }
      };
    } else {
      return targetPropValue;
    }
  }
}

function extractError(reason: unknown): Error {
  const body = (reason as any)?.body;
  if (body) {
    if (body.errcode && body.error) {
      return new Matrix404Error(body.errcode, body.error);
    } else {
      return new MatrixError(JSON.stringify(body));
    }
  } else if (reason instanceof Error) {
    return new MatrixError(reason.message);
  } else {
    return new MatrixError(JSON.stringify(reason));
  }
}
