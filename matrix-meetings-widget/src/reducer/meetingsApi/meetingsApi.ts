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
  PowerLevelsStateEvent,
  RoomMemberStateEventContent,
  STATE_EVENT_CREATE,
  STATE_EVENT_POWER_LEVELS,
  STATE_EVENT_ROOM_MEMBER,
  StateEvent,
  StateEventCreateContent,
  isValidCreateEventSchema,
  isValidPowerLevelStateEvent,
  isValidRoomMemberStateEvent,
} from '@matrix-widget-toolkit/api';
import {
  EntityState,
  createEntityAdapter,
  createSelector,
} from '@reduxjs/toolkit';
import { QueryActionCreatorResult } from '@reduxjs/toolkit/dist/query/core/buildInitiate';
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { xor } from 'lodash';
import { Symbols } from 'matrix-widget-api';
import { bufferTime, filter } from 'rxjs/operators';
import {
  NordeckMeetingMetadataEvent,
  RoomNameEvent,
  RoomTombstoneEvent,
  RoomTopicEvent,
  STATE_EVENT_NORDECK_MEETING_METADATA,
  STATE_EVENT_ROOM_NAME,
  STATE_EVENT_ROOM_TOMBSTONE,
  STATE_EVENT_ROOM_TOPIC,
  STATE_EVENT_SPACE_CHILD,
  STATE_EVENT_SPACE_PARENT,
  STATE_EVENT_WIDGETS,
  SpaceChildEvent,
  SpaceParentEvent,
  WidgetsEvent,
  isValidNordeckMeetingMetadataEvent,
  isValidRoomNameEvent,
  isValidRoomTombstoneEvent,
  isValidRoomTopicEvent,
  isValidSpaceChildEvent,
  isValidSpaceParentEvent,
  isValidWidgetsEvent,
  migrateNordeckMeetingMetadataEventSchema,
} from '../../lib/matrix';
import { isBotUser, isDefined } from '../../lib/utils';
import { AppDispatch, RootState, ThunkExtraArgument } from '../../store';
import { RoomEvents } from './RoomEvents';
import { awaitAcknowledgement, withEventContext } from './helpers';
import {
  CreateBreakoutSessionsOptions,
  CreateMeetingOptions,
  MutationArrayResponse,
  MutationResponse,
  UpdateMeetingDetailsOptions,
  UpdateMeetingPermissionsOptions,
} from './types';

const roomChildEventEntityAdapter = createEntityAdapter<
  StateEvent<SpaceChildEvent>
>({
  selectId: (event) => `${event.room_id}_${event.state_key}`,
});

const roomParentEventEntityAdapter = createEntityAdapter<
  StateEvent<SpaceParentEvent>
>({
  selectId: (event) => event.room_id,
});

const roomCreateEventEntityAdapter = createEntityAdapter<
  StateEvent<StateEventCreateContent>
>({
  selectId: (event) => event.room_id,
});

const roomTombstoneEventEntityAdapter = createEntityAdapter<
  StateEvent<RoomTombstoneEvent>
>({
  selectId: (event) => event.room_id,
});

const roomNameEventEntityAdapter = createEntityAdapter<
  StateEvent<RoomNameEvent>
>({
  selectId: (event) => event.room_id,
});

const roomPowerLevelsEventEntityAdapter = createEntityAdapter<
  StateEvent<PowerLevelsStateEvent>
>({
  selectId: (event) => event.room_id,
});

const roomTopicEventEntityAdapter = createEntityAdapter<
  StateEvent<RoomTopicEvent>
>({
  selectId: (event) => event.room_id,
});

const nordeckMeetingMetadataEventEntityAdapter = createEntityAdapter<
  StateEvent<NordeckMeetingMetadataEvent>
>({
  selectId: (event) => event.room_id,
});

const roomMemberEventEntityAdapter = createEntityAdapter<
  StateEvent<RoomMemberStateEventContent>
>({
  selectId: (event) => `${event.room_id}_${event.state_key}`,
});

const widgetEventEntityAdapter = createEntityAdapter<StateEvent<WidgetsEvent>>({
  selectId: (event) => `${event.room_id}_${event.state_key}`,
});

/**
 * Create an API to observe or manipulate meetings.
 *
 * It provides endpoints to read Matrix State events, as well as
 * to create or update existing meetings.
 *
 * @remarks the reducer of this state expects extra arguments from
 * the thunk middleware with the {@link ThunkExtraArgument} type.
 */
export const meetingsApi = createApi({
  reducerPath: 'meetingsApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    createMeeting: builder.mutation<MutationResponse, CreateMeetingOptions>({
      queryFn: async ({ meeting }, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const event = await widgetApi.sendRoomEvent(
            RoomEvents.NET_NORDECK_MEETINGS_MEETING_CREATE,
            withEventContext(widgetApi, {
              title: meeting.title,
              description: meeting.description,
              calendar: meeting.calendar,
              widget_ids: meeting.widgetIds,
              participants: meeting.participants.map((user_id) => ({
                user_id,
              })),
              messaging_power_level: meeting.powerLevels?.messaging,
            }),
          );

          const [acknowledgement] = await awaitAcknowledgement(
            widgetApi,
            event.event_id,
          );

          return {
            data: {
              acknowledgement,
              event,
            },
          };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
    }),

    createBreakoutSessions: builder.mutation<
      MutationResponse,
      CreateBreakoutSessionsOptions
    >({
      queryFn: async ({ breakoutSessions }, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const event = await widgetApi.sendRoomEvent(
            RoomEvents.NET_NORDECK_MEETINGS_BREAKOUTSESSIONS_CREATE,
            withEventContext(widgetApi, {
              // the roomId is read from the room_id of the event.
              groups: breakoutSessions.groups.map(
                ({ title, participants }) => ({
                  title,
                  participants: participants.map((user_id) => ({ user_id })),
                }),
              ),
              description: breakoutSessions.description,
              start_time: breakoutSessions.startTime,
              end_time: breakoutSessions.endTime,
              widget_ids: breakoutSessions.widgetIds,
            }),
          );

          const [acknowledgement] = await awaitAcknowledgement(
            widgetApi,
            event.event_id,
          );

          return {
            data: {
              acknowledgement,
              event,
            },
          };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
    }),

    closeMeeting: builder.mutation<MutationResponse, { roomId: string }>({
      queryFn: async ({ roomId }, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const event = await widgetApi.sendRoomEvent(
            RoomEvents.NET_NORDECK_MEETINGS_MEETING_CLOSE,
            withEventContext(widgetApi, {
              target_room_id: roomId,
            }),
          );

          const [acknowledgement] = await awaitAcknowledgement(
            widgetApi,
            event.event_id,
          );

          return {
            data: {
              acknowledgement,
              event,
            },
          };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
    }),

    sendMessageToBreakoutSessions: builder.mutation<
      MutationResponse,
      {
        parentRoomId: string;
        message: string;
      }
    >({
      queryFn: async ({ parentRoomId, message }, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const event = await widgetApi.sendRoomEvent(
            RoomEvents.NET_NORDECK_MEETINGS_SUB_MEETINGS_SEND_MESSAGE,
            withEventContext(widgetApi, {
              target_room_id: parentRoomId,
              message,
            }),
          );

          const [acknowledgement] = await awaitAcknowledgement(
            widgetApi,
            event.event_id,
          );

          return {
            data: {
              acknowledgement,
              event,
            },
          };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
    }),

    updateMeetingWidgets: builder.mutation<
      MutationArrayResponse,
      {
        roomId: string;
        addWidgets?: string[];
        removeWidgets?: string[];
      }
    >({
      queryFn: async (
        { roomId, addWidgets = [], removeWidgets = [] },
        { extra },
      ) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const events = [];

          if (addWidgets.length > 0) {
            events.push(
              await widgetApi.sendRoomEvent(
                RoomEvents.NET_NORDECK_MEETINGS_MEETING_WIDGETS_HANDLE,
                withEventContext(widgetApi, {
                  target_room_id: roomId,
                  add: true,
                  widget_ids: addWidgets,
                }),
              ),
            );
          }

          if (removeWidgets.length > 0) {
            events.push(
              await widgetApi.sendRoomEvent(
                RoomEvents.NET_NORDECK_MEETINGS_MEETING_WIDGETS_HANDLE,
                withEventContext(widgetApi, {
                  target_room_id: roomId,
                  add: false,
                  widget_ids: removeWidgets,
                }),
              ),
            );
          }

          const acknowledgements = await awaitAcknowledgement(
            widgetApi,
            ...events.map((e) => e.event_id),
          );

          return {
            data: {
              acknowledgements,
              events,
            },
          };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
    }),

    updateMeetingParticipants: builder.mutation<
      MutationArrayResponse,
      {
        roomId: string;
        addUserIds?: string[];
        removeUserIds?: string[];
      }
    >({
      queryFn: async (
        { roomId, addUserIds = [], removeUserIds = [] },
        { extra },
      ) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const events = [];

          if (addUserIds.length > 0) {
            events.push(
              await widgetApi.sendRoomEvent(
                RoomEvents.NET_NORDECK_MEETINGS_MEETING_PARTICIPANTS_HANDLE,
                withEventContext(widgetApi, {
                  target_room_id: roomId,
                  invite: true,
                  userIds: addUserIds,
                }),
              ),
            );
          }

          if (removeUserIds.length > 0) {
            events.push(
              await widgetApi.sendRoomEvent(
                RoomEvents.NET_NORDECK_MEETINGS_MEETING_PARTICIPANTS_HANDLE,
                withEventContext(widgetApi, {
                  target_room_id: roomId,
                  invite: false,
                  userIds: removeUserIds,
                }),
              ),
            );
          }

          const acknowledgements = await awaitAcknowledgement(
            widgetApi,
            ...events.map((e) => e.event_id),
          );

          return {
            data: {
              acknowledgements,
              events,
            },
          };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
    }),

    updateMeetingDetails: builder.mutation<
      MutationResponse,
      UpdateMeetingDetailsOptions
    >({
      queryFn: async ({ roomId, updates }, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const event = await widgetApi.sendRoomEvent(
            RoomEvents.NET_NORDECK_MEETINGS_MEETING_UPDATE,
            withEventContext(widgetApi, {
              target_room_id: roomId,
              title: updates.title,
              description: updates.description,
              calendar: updates.calendar,
            }),
          );

          const [acknowledgement] = await awaitAcknowledgement(
            widgetApi,
            event.event_id,
          );

          return {
            data: {
              acknowledgement,
              event,
            },
          };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
    }),

    updateMeetingPermissions: builder.mutation<
      MutationResponse,
      UpdateMeetingPermissionsOptions
    >({
      queryFn: async ({ roomId, powerLevels }, { extra }) => {
        try {
          const { widgetApi } = extra as ThunkExtraArgument;

          const event = await widgetApi.sendRoomEvent(
            RoomEvents.NET_NORDECK_MEETINGS_MEETING_CHANGE_MESSAGE_PERMISSIONS,
            withEventContext(widgetApi, {
              target_room_id: roomId,
              messaging_power_level: powerLevels.messaging,
            }),
          );

          const [acknowledgement] = await awaitAcknowledgement(
            widgetApi,
            event.event_id,
          );

          return {
            data: {
              acknowledgement,
              event,
            },
          };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
    }),

    getRoomChildEvents: builder.query<
      EntityState<StateEvent<SpaceChildEvent>>,
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(
          STATE_EVENT_SPACE_CHILD,
          { roomIds: Symbols.AnyRoom },
        );

        return {
          data: roomChildEventEntityAdapter.upsertMany(
            roomChildEventEntityAdapter.getInitialState(),
            events
              .filter(isValidSpaceChildEvent)
              .filter((e) => e.content.via && e.content.via.length > 0),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_SPACE_CHILD, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidSpaceChildEvent),
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              // events with `via` are proper children
              const toAdd = events.filter(
                (event) => (event.content.via ?? []).length > 0,
              );

              // events without, are invalid
              const toRemove = xor(
                events.map((event) =>
                  roomChildEventEntityAdapter.selectId(event),
                ),
                toAdd.map((event) =>
                  roomChildEventEntityAdapter.selectId(event),
                ),
              );

              roomChildEventEntityAdapter.upsertMany(state, toAdd);
              roomChildEventEntityAdapter.removeMany(state, toRemove);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    getRoomParentEvents: builder.query<
      EntityState<StateEvent<SpaceParentEvent>>,
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(
          STATE_EVENT_SPACE_PARENT,
          { roomIds: Symbols.AnyRoom },
        );

        return {
          data: roomParentEventEntityAdapter.upsertMany(
            roomParentEventEntityAdapter.getInitialState(),
            events
              .filter(isValidSpaceParentEvent)
              .filter((e) => e.content.via && e.content.via.length > 0),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_SPACE_PARENT, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidSpaceParentEvent),
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              // events with `via` are proper children
              const toAdd = events.filter(
                (event) => (event.content.via ?? []).length > 0,
              );

              // events without, are invalid
              const toRemove = xor(
                events.map((event) =>
                  roomParentEventEntityAdapter.selectId(event),
                ),
                toAdd.map((event) =>
                  roomParentEventEntityAdapter.selectId(event),
                ),
              );

              roomParentEventEntityAdapter.upsertMany(state, toAdd);
              roomParentEventEntityAdapter.removeMany(state, toRemove);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    getRoomCreateEvents: builder.query<
      EntityState<StateEvent<StateEventCreateContent>>,
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(STATE_EVENT_CREATE, {
          roomIds: Symbols.AnyRoom,
        });

        return {
          data: roomCreateEventEntityAdapter.upsertMany(
            roomCreateEventEntityAdapter.getInitialState(),
            events.filter(isValidCreateEventSchema),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_CREATE, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidCreateEventSchema),
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              roomCreateEventEntityAdapter.upsertMany(state, events);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    getRoomTombstoneEvents: builder.query<
      EntityState<StateEvent<RoomTombstoneEvent>>,
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(
          STATE_EVENT_ROOM_TOMBSTONE,
          { roomIds: Symbols.AnyRoom },
        );

        return {
          data: roomTombstoneEventEntityAdapter.upsertMany(
            roomTombstoneEventEntityAdapter.getInitialState(),
            events.filter(isValidRoomTombstoneEvent),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_TOMBSTONE, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidRoomTombstoneEvent),
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              roomTombstoneEventEntityAdapter.upsertMany(state, events);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    getRoomNameEvents: builder.query<
      EntityState<StateEvent<RoomNameEvent>>,
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(
          STATE_EVENT_ROOM_NAME,
          { roomIds: Symbols.AnyRoom },
        );

        return {
          data: roomNameEventEntityAdapter.upsertMany(
            roomNameEventEntityAdapter.getInitialState(),
            events.filter(isValidRoomNameEvent),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_NAME, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidRoomNameEvent),
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              roomNameEventEntityAdapter.upsertMany(state, events);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    getRoomPowerLevelsEvents: builder.query<
      EntityState<StateEvent<PowerLevelsStateEvent>>,
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(
          STATE_EVENT_POWER_LEVELS,
          { roomIds: Symbols.AnyRoom },
        );

        return {
          data: roomPowerLevelsEventEntityAdapter.upsertMany(
            roomPowerLevelsEventEntityAdapter.getInitialState(),
            events.filter(isValidPowerLevelStateEvent),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_POWER_LEVELS, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidPowerLevelStateEvent),
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              roomPowerLevelsEventEntityAdapter.upsertMany(state, events);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    getRoomTopicEvents: builder.query<
      EntityState<StateEvent<RoomTopicEvent>>,
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(
          STATE_EVENT_ROOM_TOPIC,
          { roomIds: Symbols.AnyRoom },
        );

        return {
          data: roomTopicEventEntityAdapter.upsertMany(
            roomTopicEventEntityAdapter.getInitialState(),
            events.filter(isValidRoomTopicEvent),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_TOPIC, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidRoomTopicEvent),
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              roomTopicEventEntityAdapter.upsertMany(state, events);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    getNordeckMeetingMetadataEvents: builder.query<
      EntityState<StateEvent<NordeckMeetingMetadataEvent>>,
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(
          STATE_EVENT_NORDECK_MEETING_METADATA,
          { roomIds: Symbols.AnyRoom },
        );

        return {
          data: nordeckMeetingMetadataEventEntityAdapter.upsertMany(
            nordeckMeetingMetadataEventEntityAdapter.getInitialState(),
            events
              .filter(isValidNordeckMeetingMetadataEvent)
              .map(migrateNordeckMeetingMetadataEventSchema),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_NORDECK_MEETING_METADATA, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidNordeckMeetingMetadataEvent),
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              nordeckMeetingMetadataEventEntityAdapter.upsertMany(
                state,
                events.map(migrateNordeckMeetingMetadataEventSchema),
              );
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    getRoomMembers: builder.query<
      EntityState<StateEvent<RoomMemberStateEventContent>>,
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(
          STATE_EVENT_ROOM_MEMBER,
          { roomIds: Symbols.AnyRoom },
        );

        return {
          data: roomMemberEventEntityAdapter.upsertMany(
            roomMemberEventEntityAdapter.getInitialState(),
            events
              .filter(isValidRoomMemberStateEvent)
              .filter((event) =>
                ['join', 'invite'].includes(event.content.membership),
              )
              // skip the bot user
              .filter((event) => !isBotUser(event.state_key)),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_MEMBER, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidRoomMemberStateEvent),
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              // the user is a proper member
              const toAdd = events
                .filter((event) =>
                  ['join', 'invite'].includes(event.content.membership),
                )
                // skip the bot user
                .filter((event) => !isBotUser(event.state_key));

              // the user left the room or was banned.
              const toRemove = events
                .filter(
                  (event) =>
                    !['join', 'invite'].includes(event.content.membership),
                )
                .map(roomMemberEventEntityAdapter.selectId);

              roomMemberEventEntityAdapter.upsertMany(state, toAdd);
              roomMemberEventEntityAdapter.removeMany(state, toRemove);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    getRoomWidgets: builder.query<EntityState<StateEvent<WidgetsEvent>>, void>({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        const events = await widgetApi.receiveStateEvents(STATE_EVENT_WIDGETS, {
          roomIds: Symbols.AnyRoom,
        });

        return {
          data: widgetEventEntityAdapter.upsertMany(
            widgetEventEntityAdapter.getInitialState(),
            events.filter(isValidWidgetsEvent),
          ),
        };
      },
      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_WIDGETS, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            bufferTime(100),
            filter((list) => list.length > 0),
          )
          .subscribe((events) => {
            updateCachedData((state) => {
              // valid widgets are active
              const toAdd = events.filter(isValidWidgetsEvent);

              // other widget events are inactive
              const toRemove = xor(
                events.map((event) =>
                  widgetEventEntityAdapter.selectId(
                    event as StateEvent<WidgetsEvent>,
                  ),
                ),
                toAdd.map((event) => widgetEventEntityAdapter.selectId(event)),
              );

              widgetEventEntityAdapter.upsertMany(state, toAdd);
              widgetEventEntityAdapter.removeMany(state, toRemove);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),
  }),
});

export async function initializeMeetingsApi(
  dispatch: AppDispatch,
): Promise<() => void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions: QueryActionCreatorResult<any>[] = [];

  actions.push(dispatch(meetingsApi.endpoints.getRoomCreateEvents.initiate()));
  actions.push(
    dispatch(meetingsApi.endpoints.getRoomTombstoneEvents.initiate()),
  );
  actions.push(
    dispatch(meetingsApi.endpoints.getNordeckMeetingMetadataEvents.initiate()),
  );
  actions.push(dispatch(meetingsApi.endpoints.getRoomMembers.initiate()));
  actions.push(dispatch(meetingsApi.endpoints.getRoomNameEvents.initiate()));
  actions.push(
    dispatch(meetingsApi.endpoints.getRoomPowerLevelsEvents.initiate()),
  );
  actions.push(dispatch(meetingsApi.endpoints.getRoomChildEvents.initiate()));
  actions.push(dispatch(meetingsApi.endpoints.getRoomParentEvents.initiate()));
  actions.push(dispatch(meetingsApi.endpoints.getRoomTopicEvents.initiate()));
  actions.push(dispatch(meetingsApi.endpoints.getRoomWidgets.initiate()));

  // wait for initial load
  await Promise.all(actions.map((a) => a.unwrap()));

  // cancel subscriptions on finish
  return () => {
    actions.forEach((a) => a.unsubscribe());
  };
}

const getRoomChildEventsSelectors =
  meetingsApi.endpoints.getRoomChildEvents.select();
export const { selectAll: selectAllRoomChildEvents } =
  roomChildEventEntityAdapter.getSelectors((rootState: RootState) => {
    return (
      getRoomChildEventsSelectors(rootState).data ??
      roomChildEventEntityAdapter.getInitialState()
    );
  });

const getRoomParentEventsSelectors =
  meetingsApi.endpoints.getRoomParentEvents.select();
export const {
  selectById: selectRoomParentEventByRoomId,
  selectEntities: selectRoomParentEventEntities,
} = roomParentEventEntityAdapter.getSelectors((rootState: RootState) => {
  return (
    getRoomParentEventsSelectors(rootState).data ??
    roomParentEventEntityAdapter.getInitialState()
  );
});

export function filterAllRoomParentEventsByParentRoomId(
  events: ReturnType<typeof selectRoomParentEventEntities>,
  roomId: string,
): StateEvent<SpaceParentEvent>[] {
  return Object.values(events)
    .filter(isDefined)
    .filter((ev) => ev.state_key === roomId);
}

export function makeSelectAllRoomParentEventsByParentRoomId() {
  return createSelector(
    (_: RootState, roomId: string | undefined) => roomId,
    selectRoomParentEventEntities,
    (roomId, events): StateEvent<SpaceParentEvent>[] =>
      roomId ? filterAllRoomParentEventsByParentRoomId(events, roomId) : [],
  );
}

const getRoomCreateEventsSelectors =
  meetingsApi.endpoints.getRoomCreateEvents.select();
export const {
  selectIds: selectAllRoomCreateEventRoomIds,
  selectById: selectRoomCreateEventByRoomId,
  selectEntities: selectRoomCreateEventEntities,
} = roomCreateEventEntityAdapter.getSelectors((rootState: RootState) => {
  return (
    getRoomCreateEventsSelectors(rootState).data ??
    roomCreateEventEntityAdapter.getInitialState()
  );
});

const getRoomTombstoneEventsSelectors =
  meetingsApi.endpoints.getRoomTombstoneEvents.select();
export const {
  selectById: selectRoomTombstoneEventByRoomId,
  selectEntities: selectRoomTombstoneEventEntities,
} = roomTombstoneEventEntityAdapter.getSelectors((rootState: RootState) => {
  return (
    getRoomTombstoneEventsSelectors(rootState).data ??
    roomTombstoneEventEntityAdapter.getInitialState()
  );
});

const getRoomPowerLevelsEventsSelectors =
  meetingsApi.endpoints.getRoomPowerLevelsEvents.select();
export const { selectById: selectRoomPowerLevelsEventByRoomId } =
  roomPowerLevelsEventEntityAdapter.getSelectors((rootState: RootState) => {
    return (
      getRoomPowerLevelsEventsSelectors(rootState).data ??
      roomPowerLevelsEventEntityAdapter.getInitialState()
    );
  });

const getRoomNameEventsSelectors =
  meetingsApi.endpoints.getRoomNameEvents.select();
export const {
  selectAll: selectAllRoomNameEvents,
  selectById: selectRoomNameEventByRoomId,
  selectEntities: selectRoomNameEventEntities,
} = roomNameEventEntityAdapter.getSelectors((rootState: RootState) => {
  return (
    getRoomNameEventsSelectors(rootState).data ??
    roomNameEventEntityAdapter.getInitialState()
  );
});

const getRoomTopicEventsSelectors =
  meetingsApi.endpoints.getRoomTopicEvents.select();
export const {
  selectById: selectRoomTopicEventByRoomId,
  selectEntities: selectRoomTopicEventEntities,
} = roomTopicEventEntityAdapter.getSelectors((rootState: RootState) => {
  return (
    getRoomTopicEventsSelectors(rootState).data ??
    roomTopicEventEntityAdapter.getInitialState()
  );
});

const getNordeckMeetingMetadataEventsSelectors =
  meetingsApi.endpoints.getNordeckMeetingMetadataEvents.select();
export const {
  selectById: selectNordeckMeetingMetadataEventByRoomId,
  selectEntities: selectNordeckMeetingMetadataEventEntities,
} = nordeckMeetingMetadataEventEntityAdapter.getSelectors(
  (rootState: RootState) => {
    return (
      getNordeckMeetingMetadataEventsSelectors(rootState).data ??
      nordeckMeetingMetadataEventEntityAdapter.getInitialState()
    );
  },
);

const getRoomMembersSelectors = meetingsApi.endpoints.getRoomMembers.select();
export const { selectEntities: selectRoomMemberEventEntities } =
  roomMemberEventEntityAdapter.getSelectors((rootState: RootState) => {
    return (
      getRoomMembersSelectors(rootState).data ??
      roomMemberEventEntityAdapter.getInitialState()
    );
  });

export function filterAllRoomMemberEventsByRoomId(
  events: ReturnType<typeof selectRoomMemberEventEntities>,
  roomId: string,
): StateEvent<RoomMemberStateEventContent>[] {
  return Object.values(events)
    .filter(isDefined)
    .filter((ev) => ev.room_id === roomId);
}

export function makeSelectAllRoomMemberEventsByRoomId() {
  return createSelector(
    (_: RootState, roomId: string | undefined) => roomId,
    selectRoomMemberEventEntities,
    (roomId, events): StateEvent<RoomMemberStateEventContent>[] =>
      roomId ? filterAllRoomMemberEventsByRoomId(events, roomId) : [],
  );
}

const getRoomWidgetsSelectors = meetingsApi.endpoints.getRoomWidgets.select();
export const { selectEntities: selectRoomWidgetEventEntities } =
  widgetEventEntityAdapter.getSelectors((rootState: RootState) => {
    return (
      getRoomWidgetsSelectors(rootState).data ??
      widgetEventEntityAdapter.getInitialState()
    );
  });

export function filterAllRoomWidgetEventsByRoomId(
  events: ReturnType<typeof selectRoomWidgetEventEntities>,
  roomId: string,
): StateEvent<WidgetsEvent>[] {
  return Object.values(events)
    .filter(isDefined)
    .filter((ev) => ev.room_id === roomId);
}

export function makeSelectAllRoomWidgetEventsByRoomId() {
  return createSelector(
    (_: RootState, roomId: string | undefined) => roomId,
    selectRoomWidgetEventEntities,
    (roomId, events): StateEvent<WidgetsEvent>[] =>
      roomId ? filterAllRoomWidgetEventsByRoomId(events, roomId) : [],
  );
}

export const {
  useCloseMeetingMutation,
  useCreateBreakoutSessionsMutation,
  useCreateMeetingMutation,
  useUpdateMeetingDetailsMutation,
  useUpdateMeetingParticipantsMutation,
  useUpdateMeetingPermissionsMutation,
  useUpdateMeetingWidgetsMutation,
  useSendMessageToBreakoutSessionsMutation,
} = meetingsApi;
