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

export enum StateEventName {
  M_ROOM_AVATAR = 'm.room.avatar',
  M_ROOM_NAME_EVENT = 'm.room.name',
  M_ROOM_CREATION_EVENT = 'm.room.create',
  M_ROOM_TOPIC_EVENT = 'm.room.topic',
  M_ROOM_MEMBER_EVENT = 'm.room.member',
  M_ROOM_POWER_LEVELS_EVENT = 'm.room.power_levels',
  M_ROOM_JOIN_RULES_EVENT = 'm.room.join_rules',
  M_ROOM_GUEST_ACCESS_EVENT = 'm.room.guest_access',
  M_ROOM_HISTORY_VISIBILITY_EVENT = 'm.room.history_visibility',
  IO_ELEMENT_WIDGETS_LAYOUT_EVENT = 'io.element.widgets.layout',
  IM_VECTOR_MODULAR_WIDGETS_EVENT = 'im.vector.modular.widgets',
  M_ROOM_TOMBSTONE_EVENT = 'm.room.tombstone',
  M_SPACE_PARENT_EVENT = 'm.space.parent',
  M_SPACE_CHILD_EVENT = 'm.space.child',
  M_ROOM_ENCRYPTION = 'm.room.encryption',
  M_ROOM_GUEST_ACCESS = 'm.room.guest_access',

  NIC_MEETINGS_METADATA_EVENT = 'net.nordeck.meetings.metadata',
  NIC_MEETINGS_WELCOME_ROOM = 'net.nordeck.meetings.private_welcome_room',
  NIC_MEETINGS_PRIVATE_BOT_MESSAGES_ROOM_TYPE = 'net.nordeck.meetings.private_bot_message_room',

  NIC_CONTROLROOM_MIGRATION_VERSION = 'net.nordeck.meetings.control_room',
}
