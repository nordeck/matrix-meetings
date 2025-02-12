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

import { WidgetApi } from '@matrix-widget-toolkit/api';
import { constant, times } from 'lodash-es';
import { Subject, firstValueFrom } from 'rxjs';
import { filter, take, takeUntil, timeout, toArray } from 'rxjs/operators';
import { isValidReactionEvent } from '../../lib/matrix';

export function isMeetingRoom(
  roomType: string | undefined,
): roomType is string {
  return roomType === 'net.nordeck.meetings.meeting';
}

export function isMeetingBreakOutRoom(
  roomType: string | undefined,
): roomType is string {
  return roomType === 'net.nordeck.meetings.breakoutsession';
}

export function isMeetingRoomOrBreakOutRoom(
  roomType: string | undefined,
): roomType is string {
  return isMeetingRoom(roomType) || isMeetingBreakOutRoom(roomType);
}

const timeoutAcknowledgementSubject = new Subject<void>();

/**
 * Eagerly trigger a timeout in any pending `awaitAcknowledgement()` call.
 *
 * @remarks Only use for tests
 */
export function cancelRunningAwaitAcknowledgements() {
  timeoutAcknowledgementSubject.next();
}

/**
 * Response type of {@link awaitAcknowledgement}.
 */
export type AcknowledgementResponse =
  | {
      // message was acknowledged
      success: true;

      error?: undefined;
      timeout?: undefined;
    }
  | {
      // an error occurred
      error: true;
      errorRoomId?: string;

      success?: undefined;
      timeout?: undefined;
    }
  | {
      // the operation timed out
      timeout: true;

      error?: undefined;
      success?: undefined;
    };

/**
 * Wait for an acknowledgement to events.
 *
 * @remarks If one of the provided events times out, it is assumed that _all_ events timed out.
 *
 * @param widgetApi - An instance of the {@link WidgetApi} to make the call.
 * @param eventIds - The ids of the event that should be checked.
 * @returns the status of the acknowledgement as {@link AcknowledgementResponse} for each event.
 *          It can be success, error, or timeout. The response always has the same length as the input.
 */
export async function awaitAcknowledgement(
  widgetApi: WidgetApi,
  ...eventIds: string[]
): Promise<AcknowledgementResponse[]> {
  const eventReceived = widgetApi.observeRoomEvents('m.reaction').pipe(
    filter(isValidReactionEvent),
    filter(
      (event) =>
        event.content['m.relates_to'].rel_type === 'm.annotation' &&
        eventIds.includes(event.content['m.relates_to'].event_id),
    ),
    take(eventIds.length),
    toArray(),

    // timeout after 2 seconds
    timeout(2_000),

    // cancel in tests
    takeUntil(timeoutAcknowledgementSubject),
  );

  try {
    const events = await firstValueFrom(eventReceived);

    // the observable was closed too early. we interpret it as a timeout.
    if (events.length === eventIds.length) {
      return (
        events
          // make sure the order of the input and the output is equal
          .sort(
            (a, b) =>
              eventIds.indexOf(a.content['m.relates_to'].event_id) -
              eventIds.indexOf(b.content['m.relates_to'].event_id),
          )

          .map((event) => {
            if (event.content['m.relates_to'].key === '✅') {
              return {
                success: true,
              };
            }

            return {
              error: true,
              errorRoomId:
                event.content['net.nordeck.meetings.bot.meta']?.room_id,
            };
          })
      );
    }
  } catch (_) {
    // timeout
  }

  return times(
    eventIds.length,
    constant({
      timeout: true,
    }),
  );
}

/**
 * Generate the context that is required in each room event that
 * is targeted at the meetings bot. The context includes information
 * about the language and the timezone.
 *
 * @param widgetApi - the widget api
 * @param data - the data of the event
 * @returns the data that is wrapped with a context
 */
export function withEventContext<T>(widgetApi: WidgetApi, data: T) {
  return {
    data,
    context: {
      locale: widgetApi.widgetParameters.clientLanguage ?? 'en',
      timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };
}
