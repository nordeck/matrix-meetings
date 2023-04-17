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
import fs from 'fs';
import path from 'path';
import { IRoomEvent } from '../matrix/event/IRoomEvent';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { StringUtil } from '../StringUtil';
import { IRoomMatrixEvents } from './IRoomMatrixEvents';
import { IWidgetContent } from './IWidgetContent';
import { StateEventName } from './StateEventName';

export class RoomMatrixEventsHelper {
  private logger = new Logger(RoomMatrixEventsHelper.name);

  constructor(private defaultEventsPath: string) {}

  public buildRoomMatrixEvents(
    stateEvents: readonly IStateEvent<unknown>[],
    roomEvents: readonly IRoomEvent<unknown>[]
  ): IRoomMatrixEvents {
    const allWidgetEvents = stateEvents.filter(
      (se) => se.type === StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT
    );

    const widgetContents = allWidgetEvents.map<IWidgetContent>((se) => {
      const widgetContent = se.content as IWidgetContent;

      // id and state key will be the same, they both should be able to identify the widget
      const widgetId = se.state_key;
      widgetContent.id = widgetId;

      const avatarUrlString = widgetContent.avatar_url;
      if (avatarUrlString) {
        const avatarUrl = StringUtil.asUrl(avatarUrlString);
        if (avatarUrl) {
          if (avatarUrl.protocol !== 'mxc:') {
            widgetContent.avatar_url = undefined; // ignore avatar path
            this.logger.warn(
              `only 'mxc:' protocol can be used in avatar url, widget ${widgetId} has '${avatarUrl.protocol}' in url ${avatarUrlString}, avatar url is ignored`
            );
          }
        } else {
          // not a valid URL then it should be a path to avatar relative to default_events.json
          // use default_events.json path to create avatar path relative to working directory or absolute path
          const newAvatarPath = path.join(
            path.dirname(this.defaultEventsPath),
            avatarUrlString
          );
          if (fs.existsSync(newAvatarPath)) {
            widgetContent.avatar_url = newAvatarPath; // override avatar path
          } else {
            widgetContent.avatar_url = undefined; // ignore avatar path
            const avatarPathAbsolute = path.resolve(newAvatarPath);
            this.logger.warn(
              `cannot find avatar ${avatarUrlString} for ${widgetId} widget, icon doesn't exists: ${avatarPathAbsolute}`
            );
          }
        }
      }

      return widgetContent;
    });

    const allWidgetIds = allWidgetEvents.map((o) => o.state_key);
    const defaultWidgetIds = allWidgetEvents
      .filter((o) => !('optional' in o && o.optional))
      .map((o) => o.state_key);

    return {
      stateEvents,
      roomEvents,
      widgetContents,
      allWidgetIds,
      defaultWidgetIds,
    };
  }
}
