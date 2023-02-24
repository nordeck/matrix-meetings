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

export enum MeetingCloseMethod {
  /**
   * Sends 'm.room.tombstone' event to the room with replacement room set to the parent room.
   */
  TOMBSTONE = 'tombstone',

  /**
   * Kicks all participants from the room, room is archived by home server.
   */
  KICK_ALL_PARTICIPANTS = 'kick_all_participants',
}
