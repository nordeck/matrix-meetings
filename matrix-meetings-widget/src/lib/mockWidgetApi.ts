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
  ROOM_EVENT_REDACTION,
  RedactionRoomEvent,
  RoomEvent,
  StateEvent,
  ToDeviceMessageEvent,
  WidgetApi,
  compareOriginServerTS,
  isValidEventWithRelatesTo,
} from '@matrix-widget-toolkit/api';
import { Symbols } from 'matrix-widget-api';
import { NEVER, Subject, concat, filter, from, map, of, takeUntil } from 'rxjs';
import { Mocked, vi } from 'vitest';

// This entire file will be gone after the Vite migration

// These 2 functions originally were using lodash. These are replacements for them.
export const uniqueId = (
  (counter) =>
  (str = '') =>
    `${str}${++counter}`
)(0);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a generic deepEqual function therefore it can accept any type.
export function deepEqual(x: any, y: any): boolean {
  const ok = Object.keys,
    tx = typeof x,
    ty = typeof y;
  return x && y && tx === 'object' && tx === ty
    ? ok(x).length === ok(y).length &&
        ok(x).every((key) => deepEqual(x[key], y[key]))
    : x === y;
}

/**
 * A mock of `WidgetApi` with some additional methods.
 */
export type MockedWidgetApi = {
  /**
   * Shutdown the WidgetApi and cancel all subscriptions.
   */
  stop: () => void;

  /**
   * Add a room event that can be returned by the widget API.
   * This will also be delivered to subscriptions to the
   * `observeRoomEvents` endpoint.
   *
   * @param event - the event to store
   * @returns a copy of the event for convenient assertions or manipulations.
   * @remarks Events added using this method are ignored when verifying calls to
   *          `sendRoomEvent`.
   */
  mockSendRoomEvent<T = unknown>(event: RoomEvent<T>): RoomEvent<T>;

  /**
   * Add a state event that can be returned by the widget API.
   * This will also be delivered to subscriptions to the
   * `observeStateEvents` endpoint.
   *
   * @param event - the event to store
   * @returns a copy of the event for convenient assertions or manipulations.
   * @remarks Events added using this method are ignored when verifying calls to
   *          `sendStateEvent`.
   */
  mockSendStateEvent<T = unknown>(event: StateEvent<T>): StateEvent<T>;

  /**
   * Add a to device message to be returned by `observeToDeviceMessages`.
   * @param event - the to device message to send
   */
  mockSendToDeviceMessage<T = unknown>(
    event: ToDeviceMessageEvent<T>,
  ): ToDeviceMessageEvent<T>;

  /**
   * Removes all room events from the mock. Future reads of room events will be
   * empty.
   *
   * @param opts - Options for deleting.
   *               Use `type` to restrict which events are deleted.
   */
  clearRoomEvents(opts?: { type?: string }): void;

  /**
   * Removes all state events from the mock. Future reads of state events will be
   * empty.
   *
   * @param opts - Options for deleting.
   *               Use `type` to restrict which events are deleted.
   *
   */
  clearStateEvents(opts?: { type?: string }): void;
} & Mocked<WidgetApi>;

/**
 * Create a `WidgetApi` mock.
 *
 * The mock behaves similar to running the widget
 * inside a host application. You can send state and room events using
 * `sendStateEvent()` and `sendRoomEvent()`, as well as receive them using
 * `receiveSingleStateEvent()`, `receiveStateEvents()`, `observeStateEvents()`,
 * `receiveRoomEvents()`, and `observeRoomEvents()`.
 * Methods like `sendStateEvent()` or `sendRoomEvent()` are vitest mock functions
 * which you can verify.
 * You can pre-populate state and room events using `mockSendRoomEvent()` and
 * `mockSendStateEvent()`.
 * You can reset the state of the mock using `clearRoomEvents()` and
 * `clearStateEvents()`, but is still advised not to share the mock instance
 * between tests.
 *
 * Other methods are vitest mock functions that either have sensible default, can
 * be verified, or mocked with custom behavior.
 *
 * Always `stop()` the mock once you are done using it.
 *
 * @param opts - Options for creating the widget api.
 *               Use `userId` to specify who uses the widget
 *               (default: '\@user-id').
 *               Use `roomId` to specify the room where the widget is installed
 *               (default: '!room-id').
 *               Use `widgetId` to specify the ID of the widget
 *               (default: 'widget-id').
 *
 * @remarks Only use for tests
 */
export function mockWidgetApi(opts?: {
  userId?: string;
  roomId?: string;
  widgetId?: string;
}): MockedWidgetApi {
  const {
    userId = '@user-id',
    roomId = '!room-id',
    widgetId = 'widget-id',
  } = opts ?? {};
  const roomEventSubject = new Subject<RoomEvent>();
  let roomEvents: RoomEvent[] = [];
  let stateEvents: StateEvent[] = [];
  const stateEventSubject = new Subject<StateEvent>();
  const toDeviceMessageSubject = new Subject<ToDeviceMessageEvent>();
  const stopSubject = new Subject<void>();

  const stop = () => {
    stopSubject.next();
  };

  const mockSendRoomEvent = <T>(event: RoomEvent<T>) => {
    const ev = structuredClone(event);

    roomEvents.push(ev);
    roomEventSubject.next(ev);
    return event;
  };

  const mockSendStateEvent = <T>(event: StateEvent<T>) => {
    const ev = structuredClone(event);

    stateEvents = stateEvents
      .filter(
        (ev) =>
          ev.room_id !== event.room_id ||
          ev.type !== event.type ||
          ev.state_key !== event.state_key,
      )
      .concat(ev);

    stateEventSubject.next(ev);

    return event;
  };

  const clearRoomEvents = (opts?: { type?: string }) => {
    if (typeof opts?.type === 'string') {
      roomEvents = roomEvents.filter((ev) => ev.type !== opts.type);
    } else {
      roomEvents.length = 0;
    }
  };

  const clearStateEvents = (opts?: { type?: string }) => {
    if (typeof opts?.type === 'string') {
      stateEvents = stateEvents.filter((ev) => ev.type !== opts.type);
    } else {
      stateEvents.length = 0;
    }
  };

  const mockSendToDeviceMessage = <T = unknown>(
    message: ToDeviceMessageEvent<T>,
  ) => {
    const m = structuredClone(message);

    toDeviceMessageSubject.next(m);

    return m;
  };

  const widgetApi: Mocked<WidgetApi> = {
    widgetId,
    widgetParameters: {
      roomId,
      userId,
      isOpenedByClient: true,
    },
    openModal: vi.fn().mockResolvedValue(undefined),
    // @ts-expect-error -- Mocks are expected to return no proper T type
    receiveRoomEvents: vi.fn(),
    // @ts-expect-error -- Mocks are expected to return no proper T type
    receiveStateEvents: vi.fn(),
    // @ts-expect-error -- Mocks are expected to return no proper T type
    receiveSingleStateEvent: vi.fn(),
    // @ts-expect-error -- Mocks are expected to return no proper T type
    observeStateEvents: vi.fn(),
    // @ts-expect-error -- Mocks are expected to return no proper T type
    observeRoomEvents: vi.fn(),
    sendStateEvent: vi.fn(),
    // @ts-expect-error -- Mocks are expected to return no proper T type
    sendRoomEvent: vi.fn(),
    closeModal: vi.fn().mockResolvedValue(undefined),
    // @ts-expect-error -- Mocks are expected to return no proper T type
    getWidgetConfig: vi.fn(),
    hasInitialCapabilities: vi.fn().mockReturnValue(true),
    hasCapabilities: vi.fn().mockReturnValue(true),
    navigateTo: vi.fn().mockResolvedValue(undefined),
    observeModalButtons: vi.fn().mockReturnValue(NEVER),
    rerequestInitialCapabilities: vi.fn().mockResolvedValue(undefined),
    requestCapabilities: vi.fn().mockResolvedValue(undefined),
    requestOpenIDConnectToken: vi.fn().mockResolvedValue({}),
    setModalButtonEnabled: vi.fn().mockResolvedValue(undefined),
    readEventRelations: vi.fn(),
    sendToDeviceMessage: vi.fn(),
    // @ts-expect-error -- Mocks are expected to return no proper T type
    observeToDeviceMessages: vi.fn(),
    observeTurnServers: vi.fn().mockReturnValue(
      concat(
        of({
          urls: ['turn:turn.matrix.org'],
          username: 'user',
          credential: 'credential',
        }),
        NEVER,
      ),
    ),
    searchUserDirectory: vi.fn().mockResolvedValue({ results: [] }),
    getMediaConfig: vi.fn().mockResolvedValue({}),
    uploadFile: vi.fn().mockResolvedValue({
      content_uri: 'mxc://example.com/imageACSshaw',
    }),
    downloadFile: vi.fn().mockResolvedValue({
      file: new Blob(['image content'], { type: 'image/png' }),
    }),
  };

  widgetApi.receiveRoomEvents.mockImplementation(async (type, options) => {
    const { messageType, roomIds } = options ?? {};

    return roomEvents
      .filter((ev) => {
        if (ev.type !== type) {
          return false;
        }

        if (messageType) {
          const contentWithMsgType = ev.content as Partial<{ msgtype: string }>;

          if (contentWithMsgType.msgtype !== messageType) {
            return false;
          }
        }

        if (!roomIds) {
          return ev.room_id === roomId;
        } else if (roomIds === Symbols.AnyRoom) {
          return true;
        } else {
          return roomIds.includes(ev.room_id);
        }
      })
      .sort(compareOriginServerTS)
      .map((o) => structuredClone(o));
  });

  widgetApi.receiveStateEvents.mockImplementation(async (type, options) => {
    const { stateKey, roomIds } = options ?? {};

    return stateEvents
      .filter((ev) => {
        if (ev.type !== type) {
          return false;
        }

        if (stateKey !== undefined && ev.state_key !== stateKey) {
          return false;
        }

        if (!roomIds) {
          return ev.room_id === roomId;
        } else if (roomIds === Symbols.AnyRoom) {
          return true;
        } else {
          return roomIds.includes(ev.room_id);
        }
      })
      .map((o) => structuredClone(o));
  });

  widgetApi.receiveSingleStateEvent.mockImplementation(
    async (type, stateKey) => {
      return structuredClone(
        stateEvents.find((ev) => {
          if (ev.type !== type) {
            return false;
          }

          if (stateKey !== undefined && ev.state_key !== stateKey) {
            return false;
          }

          return true;
        }),
      );
    },
  );

  widgetApi.observeRoomEvents.mockImplementation((type, options) => {
    const { messageType, roomIds } = options ?? {};

    return concat(
      from(roomEvents.sort(compareOriginServerTS)),
      roomEventSubject,
    ).pipe(
      filter((ev) => {
        if (ev.type !== type) {
          return false;
        }

        if (messageType) {
          const contentWithMsgType = ev.content as Partial<{ msgtype: string }>;

          if (contentWithMsgType.msgtype !== messageType) {
            return false;
          }
        }

        if (!roomIds) {
          return ev.room_id === roomId;
        } else if (roomIds === Symbols.AnyRoom) {
          return true;
        } else {
          return roomIds.includes(ev.room_id);
        }
      }),
      map((o) => structuredClone(o)),
      takeUntil(stopSubject),
    );
  });

  widgetApi.observeStateEvents.mockImplementation((type, options) => {
    const { stateKey, roomIds } = options ?? {};

    const filterEvents = (ev: StateEvent) => {
      if (ev.type !== type) {
        return false;
      }

      if (stateKey !== undefined && ev.state_key !== stateKey) {
        return false;
      }

      if (!roomIds) {
        return ev.room_id === roomId;
      } else if (roomIds === Symbols.AnyRoom) {
        return true;
      } else {
        return roomIds.includes(ev.room_id);
      }
    };

    return concat(from(stateEvents), stateEventSubject).pipe(
      filter(filterEvents),
      map((o) => structuredClone(o)),
      takeUntil(stopSubject),
    );
  });

  widgetApi.sendRoomEvent.mockImplementation(async (type, content, options) => {
    const ev: RoomEvent = {
      type,
      content,
      event_id: generateEventId(),
      origin_server_ts: Date.now(),
      sender: userId,
      room_id: options?.roomId ?? roomId,
    };

    if (ev.type === ROOM_EVENT_REDACTION) {
      const redactionEv = ev as RedactionRoomEvent;
      redactionEv.redacts = redactionEv.content['redacts'];
      ev.content = {};

      // primitively redact the event. the specification keeps some fields
      // of selected events, but that could be implemented here in the future
      // if needed.
      const redactedEvent = roomEvents
        .concat(stateEvents)
        .find((ev) => ev.event_id === redactionEv.redacts);

      if (redactedEvent) {
        redactedEvent.content = {};
      }
    }

    return mockSendRoomEvent(ev);
  });

  widgetApi.sendStateEvent.mockImplementation(
    async (type, content, options) => {
      const ev = {
        type,
        content,
        state_key: options?.stateKey ?? '',
        event_id: generateEventId(),
        origin_server_ts: Date.now(),
        sender: userId,
        room_id: options?.roomId ?? roomId,
      };

      // Make sure to "hang", if we send the state event that doesn't update the
      // existing state event because it already has the expected state.
      // While this behavior is undesired, it matches how our current widget API
      // implementation works. This allows to catch such problems in tests
      // early.
      // Instead, implementations should make sure that they don't send state
      // events that are equal to the current state.
      if (
        stateEvents.find(
          (e) =>
            ev.room_id === e.room_id &&
            ev.type === e.type &&
            ev.state_key === e.state_key &&
            deepEqual(ev.content, e.content),
        )
      ) {
        return new Promise(() => {
          // Never resolves
        });
      }

      return mockSendStateEvent(ev);
    },
  );

  widgetApi.readEventRelations.mockImplementation(
    async (eventId, opts = {}) => {
      // relation targets must exist
      if (!roomEvents.some((ev) => ev.event_id === eventId)) {
        throw new Error('Unexpected error while reading relations');
      }

      const events = roomEvents
        .concat(stateEvents)
        .filter((ev: RoomEvent) => {
          if (opts.roomId === undefined) {
            return ev.room_id === roomId;
          }

          return ev.room_id === opts.roomId;
        })
        .sort((a, b) => {
          const compare = compareOriginServerTS(a, b);
          return opts.direction === 'f' ? compare : -compare;
        });

      const relatedEvents = events
        .filter(isValidEventWithRelatesTo)
        .filter((ev) => {
          if (
            opts.relationType &&
            ev.content['m.relates_to'].rel_type !== opts.relationType
          ) {
            return false;
          }

          if (opts.eventType && ev.type !== opts.eventType) {
            return false;
          }

          return ev.content['m.relates_to'].event_id === eventId;
        });

      const skip = Math.max(parseInt(opts.from ?? '0'), 0);
      const end = skip + (opts.limit ?? 50);

      return {
        chunk: relatedEvents.slice(skip, end).map((o) => structuredClone(o)),
        nextToken: end < relatedEvents.length ? end.toString() : undefined,
      };
    },
  );

  widgetApi.sendToDeviceMessage.mockImplementation(
    async (type, encrypted, content) => {
      const ownContent = content[userId];

      if (ownContent) {
        // Either use wildcard device, or choose any device as we don't have
        // the concept of devices in the mock right now.
        const wildcardContent =
          ownContent['*'] ?? ownContent[Object.keys(ownContent)[0]];

        if (wildcardContent) {
          mockSendToDeviceMessage({
            sender: userId,
            type,
            encrypted,
            content: wildcardContent,
          });
        }
      }
    },
  );

  widgetApi.observeToDeviceMessages.mockImplementation((type) => {
    return toDeviceMessageSubject.pipe(
      filter((e) => e.type === type),
      takeUntil(stopSubject),
    );
  });

  return {
    ...widgetApi,
    mockSendRoomEvent,
    mockSendStateEvent,
    mockSendToDeviceMessage,
    clearRoomEvents,
    clearStateEvents,
    stop,
  };
}

function generateEventId(): string {
  return uniqueId('$event-');
}
