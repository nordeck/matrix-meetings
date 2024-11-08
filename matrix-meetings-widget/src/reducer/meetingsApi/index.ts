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

export {
  isMeetingBreakOutRoom,
  isMeetingRoom,
  isMeetingRoomOrBreakOutRoom,
} from './helpers';
export {
  initializeMeetingsApi,
  makeSelectAllRoomMemberEventsByRoomId,
  meetingsApi,
  selectNordeckMeetingMetadataEventByRoomId,
  selectNordeckMeetingMetadataEventEntities,
  selectRoomPowerLevelsEventByRoomId,
  useCloseMeetingMutation,
  useCreateBreakoutSessionsMutation,
  useCreateMeetingMutation,
  useSendMessageToBreakoutSessionsMutation,
  useUpdateMeetingDetailsMutation,
  useUpdateMeetingParticipantsMutation,
  useUpdateMeetingPermissionsMutation,
  useUpdateMeetingWidgetsMutation,
} from './meetingsApi';
export { RoomEvents } from './RoomEvents';
export * from './selectors';
export type {
  CreateBreakoutSessionsOptions,
  CreateMeetingOptions,
  Meeting,
  MeetingInvitation,
  MeetingParticipant,
  MutationArrayResponse,
  MutationResponse,
  UpdateMeetingDetailsOptions,
} from './types';
