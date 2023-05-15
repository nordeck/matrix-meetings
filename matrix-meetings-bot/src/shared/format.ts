/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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
import { Options, RRule } from 'rrule';

const logger = new Logger('format');

export function parseRRule(rule: string): Partial<Options> {
  // parseString automatically ignores the missing RRULE: prefix
  const ruleOptions = RRule.parseString(rule);

  if (ruleOptions.dtstart) {
    throw new Error('rule should not include DTSTART or similar');
  }

  return ruleOptions;
}

export function parseRRuleSafe(rule: string): Partial<Options> | undefined {
  try {
    return parseRRule(rule);
  } catch (error) {
    logger.warn(`Cannot parse recurrence rule: ${rule}`);
    return undefined;
  }
}
