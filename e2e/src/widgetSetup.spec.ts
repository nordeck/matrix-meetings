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

import { expect } from '@playwright/test';
import { test } from './fixtures';
import { MeetingsWidgetPage } from './pages';
import { getBotUsername } from './util';

test.describe('Meeting Widget Setup', () => {
  test('should show setup instructions if opened outside of element', async ({
    page,
    baseURL,
  }) => {
    await page.goto(baseURL!);

    await expect(page.getByText(/Only runs as a widget/)).toBeVisible();
    await expect(page.getByText(/\/addwidget/)).toBeVisible();
  });

  test('should install the meetings widget into a room manually', async ({
    alicePage,
    aliceElementWebPage,
    baseURL,
  }) => {
    await aliceElementWebPage.createRoom('Calendar');
    await aliceElementWebPage.setupWidget(baseURL!);

    // We are explicitly not using aliceMeetingsWidgetPage here, as it is using
    // the bot to setup the page
    const widget = new MeetingsWidgetPage(
      alicePage,
      aliceElementWebPage.widgetByTitle('Custom')
    );

    await expect(widget.scheduleMeetingButton).toBeVisible();
  });

  test('should invite the meeting bot into a room to setup the widget', async ({
    aliceElementWebPage,
    aliceMeetingsWidgetPage,
  }) => {
    await expect(aliceMeetingsWidgetPage.scheduleMeetingButton).toBeVisible();

    // Check that the meeting bot invited Alice to the help room
    await aliceElementWebPage.navigateToRoomOrInvitation('Help for Calendar');
    await aliceElementWebPage.acceptPrivateChatInvitation();
    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /Hello Alice, thank you for inviting me to the/
      )
    ).toBeVisible();
  });

  test('should not setup the widget twice if bot is removed and added to the room again', async ({
    alicePage,
    aliceElementWebPage,
    aliceMeetingsWidgetPage,
  }) => {
    await expect(aliceMeetingsWidgetPage.scheduleMeetingButton).toBeVisible();

    await aliceElementWebPage.removeUser(getBotUsername());
    await aliceElementWebPage.inviteUser(getBotUsername());
    await aliceElementWebPage.waitForUserToJoin(getBotUsername());
    await aliceElementWebPage.promoteUserAsModerator(getBotUsername());

    // Wait for a moment and give the bot a chance to initialize the room. There
    // is no better way to observe that the bot has completed its work.
    await alicePage.waitForTimeout(1000);

    expect(await aliceElementWebPage.getWidgets()).toEqual(['Meetings']);
  });
});
