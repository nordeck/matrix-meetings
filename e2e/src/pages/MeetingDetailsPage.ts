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

import { Locator } from '@playwright/test';

export class MeetingDetailsPage {
  public readonly meetingTimeRangeText: Locator;
  public readonly meetingTitleText: Locator;
  public readonly meetingDescriptionText: Locator;

  constructor(public readonly meetingDetailsView: Locator) {
    this.meetingTimeRangeText = this.meetingDetailsView
      .getByRole('heading')
      .locator('..')
      .locator('> span');
    this.meetingTitleText = this.meetingDetailsView.getByRole('heading', {
      level: 3,
    });
    this.meetingDescriptionText = this.meetingDetailsView
      .getByRole('paragraph')
      .first();
  }
}
