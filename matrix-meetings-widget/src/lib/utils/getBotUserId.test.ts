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

import { getEnvironment as getEnvironmentMocked } from '@matrix-widget-toolkit/mui';
import { describe, expect, it, vi } from 'vitest';
import { getBotUserId, isBotUser } from './getBotUserId';

vi.mock('@matrix-widget-toolkit/mui', async () => ({
  ...(await vi.importActual<typeof import('@matrix-widget-toolkit/mui')>(
    '@matrix-widget-toolkit/mui',
  )),
  getEnvironment: vi.fn(),
}));

const getEnvironment = vi.mocked(getEnvironmentMocked);

describe('getBotUserId', () => {
  it('should return undefined if not set', () => {
    expect(getBotUserId()).toBeUndefined();
  });

  it('should return user id', () => {
    getEnvironment.mockImplementation((name, defaultValue) =>
      name === 'REACT_APP_BOT_USER_ID' ? '@bot:matrix.org' : defaultValue,
    );

    expect(getBotUserId()).toBe('@bot:matrix.org');
  });
});

describe('isBotUser', () => {
  it('should return false if not set', () => {
    expect(isBotUser('@bot:matrix.org')).toBe(false);
  });

  it('should return true', () => {
    getEnvironment.mockReturnValue('@bot:matrix.org');

    expect(isBotUser('@bot:matrix.org')).toBe(true);
  });

  it('should return false', () => {
    getEnvironment.mockReturnValue('@bot:matrix.org');

    expect(isBotUser('@no-bot:matrix.org')).toBe(false);
  });
});
