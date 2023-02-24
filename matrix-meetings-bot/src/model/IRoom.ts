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

import {
  MembershipEventContent,
  PowerLevelsEventContent,
  SpaceEntityMap,
} from 'matrix-bot-sdk';
import { EncryptionEventContent } from '../matrix/event/EncryptionEventContent';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { IMeeting } from './IMeeting';
import { IRoomMember } from './IRoomMember';
import { IWidgetContent } from './IWidgetContent';
import { WidgetType } from './WidgetType';

export interface IRoom {
  readonly id: string;
  readonly title: string;
  readonly meeting: IMeeting | undefined;
  roomEventsByName(eventName: string): IStateEvent<unknown>[];
  roomMemberEvents(): IStateEvent<MembershipEventContent>[];
  readonly spaceSubRooms: SpaceEntityMap;
  widgetEvents(removeEmpty: boolean): IStateEvent<IWidgetContent>[];
  readonly encryptionEvent: IStateEvent<EncryptionEventContent> | undefined;
  widgetEventById(widgetId: string): IStateEvent<IWidgetContent> | undefined;
  roomMemberMap(toIgnore: string[]): Map<string, IRoomMember>;
  readonly powerLevelContent: PowerLevelsEventContent;
  widgetEventByType(
    widgetType: WidgetType
  ): IStateEvent<IWidgetContent> | undefined;
}
