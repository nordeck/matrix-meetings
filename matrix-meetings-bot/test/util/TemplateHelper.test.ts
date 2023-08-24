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

import { templateHelper } from '../../src/util/TemplateHelper';

describe('test TemplateHelper', () => {
  const CURRENT_USER = 'some_user_id';

  test('makeInviteReasons', async () => {
    const userContext = { userId: CURRENT_USER, locale: 'de', timezone: 'UTC' };

    const invites = templateHelper.makeInviteReasons(
      {
        description: 'demo',
        startTime: '2020-11-11T14:07:21.488Z',
        endTime: '2022-11-11T14:07:21.488Z',
      },
      userContext,
      'inviteName',
      true,
    );

    expect(invites.htmlReason).toContain('<b>11.11.2020 um 14:07 UTC</b>');
    expect(invites.textReason).toContain('11.11.2020 um 14:07 UTC');
  });
});
