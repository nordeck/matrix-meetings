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

import { Inject, Injectable } from '@nestjs/common';
import fs from 'fs';
import * as _ from 'lodash';
import { MatrixClient } from 'matrix-bot-sdk';
import mime from 'mime-types';
import path from 'path';
import { v4 as uuiv4 } from 'uuid';
import { DeepReadonly } from '../DeepReadOnly';
import { EventContentRenderer } from '../EventContentRenderer';
import { IAppConfiguration } from '../IAppConfiguration';
import {
  eventContentParams,
  IEventContentParams,
} from '../IEventContentParams';
import { IRoomMatrixEvents } from '../model/IRoomMatrixEvents';
import { IWidgetContent } from '../model/IWidgetContent';
import { StateEventName } from '../model/StateEventName';
import { WidgetType } from '../model/WidgetType';
import { ModuleProviderToken } from '../ModuleProviderToken';
import { StringUtil } from '../StringUtil';

@Injectable()
export class WidgetClient {
  private avatarPathToUrlMap = new Map<string, string>();

  constructor(
    private readonly client: MatrixClient,
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private readonly appConfig: IAppConfiguration,
    private readonly eventContentRenderer: EventContentRenderer,
    @Inject(ModuleProviderToken.ROOM_MATRIX_EVENTS)
    private readonly roomMatrixEvents: DeepReadonly<IRoomMatrixEvents>
  ) {}

  public static createUUID(): string {
    return uuiv4().replace(/-/g, '');
  }

  public async createOrUpdateMeetingCockpitWidget(
    roomId: string
  ): Promise<string> {
    const event_content = {
      id: `${WidgetType.COCKPIT}-${WidgetClient.createUUID()}`,
      type: WidgetType.COCKPIT,
      url: this.appConfig.meetingwidget_cockpit_url,
      name: this.appConfig.meetingwidget_cockpit_name,
      avatar_url: await this.uploadCalendarSettingsAvatar(),
    };
    return this.client.sendStateEvent(
      roomId,
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      event_content.id,
      event_content
    );
  }

  public async createBreakoutSessionWidgetAsync(
    roomId: string
  ): Promise<string> {
    const event_content = {
      id: `${WidgetType.BREAKOUT_SESSIONS}-${WidgetClient.createUUID()}`,
      type: WidgetType.BREAKOUT_SESSIONS,
      url: this.appConfig.breakout_session_widget_url,
      name: this.appConfig.breakout_session_widget_name,
      avatar_url: await this.uploadCalendarAvatar(),
    };
    const stateKey = event_content.id;
    return this.client.sendStateEvent(
      roomId,
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      stateKey,
      event_content
    );
  }

  public async getMeetingWidgetEventContentAsync(
    id?: string
  ): Promise<IWidgetContent> {
    return {
      id: id || `${WidgetType.MEETINGS}-${WidgetClient.createUUID()}`,
      type: WidgetType.MEETINGS,
      url: this.appConfig.meetingwidget_url,
      name: this.appConfig.meetingwidget_name,
      avatar_url: await this.uploadCalendarAvatar(),
    };
  }

  private async uploadAvatar(avatarPath: string): Promise<string> {
    const url = this.avatarPathToUrlMap.get(avatarPath);
    if (url) {
      return Promise.resolve(url);
    } else {
      const mimeContentType: string | false = mime.contentType(
        path.basename(avatarPath)
      );
      const avatarContentType: string | undefined = mimeContentType
        ? mimeContentType
        : undefined;
      const newUrl = await this.client.uploadContent(
        fs.readFileSync(avatarPath),
        avatarContentType
      );
      this.avatarPathToUrlMap.set(avatarPath, newUrl);
      return Promise.resolve(newUrl);
    }
  }

  public getCustomConfiguredWidgetIds() {
    return new Set(this.roomMatrixEvents.allWidgetIds);
  }

  public isCustomConfiguredWidget(widgetId: string): boolean {
    return this.getCustomConfiguredWidgetIds().has(widgetId);
  }

  public async createOrUpdateCustomConfiguredWidget(
    roomId: string,
    roomTitle: string | undefined,
    widgetId: string,
    eventContent: IWidgetContent | undefined
  ): Promise<void> {
    if (!this.isCustomConfiguredWidget(widgetId)) return;

    const params: IEventContentParams = eventContentParams.newInstance(
      roomId,
      roomTitle
    );

    let widgetContent = this.roomMatrixEvents.widgetContents.find(
      (w) => w.id === widgetId
    );
    if (!widgetContent) {
      throw new Error(`Cannot find template for widget id: ${widgetId}`);
    }

    if (
      widgetContent.avatar_url &&
      !StringUtil.asUrl(widgetContent.avatar_url)
    ) {
      widgetContent = {
        ...widgetContent,
        avatar_url: await this.uploadAvatar(widgetContent.avatar_url),
      };
    }

    const newEventContent = this.eventContentRenderer.renderEventContent(
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      widgetContent,
      params
    );

    if (!_.isEqual(eventContent, newEventContent)) {
      await this.client.sendStateEvent(
        roomId,
        StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
        widgetId,
        newEventContent
      );
    }
  }

  private async uploadCalendarAvatar(): Promise<string> {
    return await this.uploadAvatar(
      path.join(__dirname, '../static/images/calendar.png')
    );
  }

  private async uploadCalendarSettingsAvatar(): Promise<string> {
    return await this.uploadAvatar(
      path.join(__dirname, '../static/images/calendar_settings.png')
    );
  }
}
