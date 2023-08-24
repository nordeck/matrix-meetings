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

import { getEnvironment as getEnvironmentMocked } from '@matrix-widget-toolkit/mui';
import { getMessagingPowerLevel } from './getMessagingPowerLevel';

jest.mock('@matrix-widget-toolkit/mui', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/mui'),
  getEnvironment: jest.fn(),
}));

const getEnvironment = jest.mocked(getEnvironmentMocked);

describe('getMessagingPowerLevel', () => {
  it.each`
    input        | expectedPowerLevel
    ${undefined} | ${100}
    ${'-1'}      | ${100}
    ${10}        | ${10}
  `(
    'should read the power level from REACT_APP_MESSAGING_NOT_ALLOWED_POWER_LEVEL=$input',
    async ({ input, expectedPowerLevel }) => {
      getEnvironment.mockImplementation((name, defaultValue) =>
        name === 'REACT_APP_MESSAGING_NOT_ALLOWED_POWER_LEVEL'
          ? input
          : defaultValue,
      );

      expect(getMessagingPowerLevel()).toEqual(expectedPowerLevel);
    },
  );
});
