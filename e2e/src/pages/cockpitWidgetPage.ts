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

import { FrameLocator, Locator, Page } from '@playwright/test';
import { MeetingCardPage } from './meetingCardPage';

export class CockpitWidgetPage {
  public readonly backToParentRoomButton: Locator;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator
  ) {
    this.backToParentRoomButton = widget.getByRole('button', {
      name: 'Back to parent room',
    });
  }

  async backToParentRoom() {
    await this.backToParentRoomButton.click();
  }

  getMeeting(): MeetingCardPage {
    return new MeetingCardPage(
      this.page,
      this.widget,
      this.widget.getByRole('heading').locator('..').locator('..').locator('..')
    );
  }
}
