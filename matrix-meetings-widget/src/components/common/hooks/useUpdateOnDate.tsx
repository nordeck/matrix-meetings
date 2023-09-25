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

import { DateTime } from 'luxon';
import { useEffect } from 'react';
import { useUpdate } from 'react-use';

/**
 * Triggers to update a component after date.
 * @param date
 */
export function useUpdateOnDate(date: string | undefined): void {
  const update = useUpdate();

  // trigger an update when the meeting ends
  useEffect(() => {
    let timeoutRef: ReturnType<typeof setTimeout>;

    function schedule(target: number) {
      const now = Date.now();

      if (target > now) {
        // Rerender the component when the target date is reached. If a value
        // larger than MAX_INT32=(2^31-1) is provided to setTimeout, it triggers
        // instantly. So we cap the value to allow a proper behavior for targets
        // >24 days in the future and reschedule a timer.
        timeoutRef = setTimeout(
          () => {
            update();
            schedule(target);
          },
          (target - now) % 0x7fffffff,
        );
      }
    }

    if (!date) {
      return () => {};
    }

    schedule(+DateTime.fromISO(date));

    return () => {
      clearTimeout(timeoutRef);
    };
  }, [date, update]);
}
