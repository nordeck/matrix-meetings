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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  isRecurringCalendarSourceEntry,
  parseICalDate,
  toISOString,
} from '@nordeck/matrix-meetings-calendar';
import { useEffect, useMemo, useState } from 'react';
import { Meeting } from '../../../reducer/meetingsApi';
import { EditRecurringMessage } from './EditRecurringMessage';
import { ScheduleMeeting } from './ScheduleMeeting';
import {
  CancelScheduleMeetingModal,
  CreateMeeting,
  ScheduleMeetingModalRequest,
  ScheduleMeetingModalResult,
  SubmitScheduleMeetingModal,
} from './types';

export const ScheduleMeetingModal = () => {
  const widgetApi = useWidgetApi();
  const initialMeeting =
    widgetApi.getWidgetConfig<ScheduleMeetingModalRequest>()?.data.meeting;
  const isMessagingEnabled =
    widgetApi.getWidgetConfig<ScheduleMeetingModalRequest>()?.data
      .isMessagingEnabled;
  const [meeting, setMeeting] = useState<CreateMeeting | undefined>();
  const isValid = meeting !== undefined;

  useEffect(() => {
    widgetApi.setModalButtonEnabled(SubmitScheduleMeetingModal, isValid);
  }, [isValid, widgetApi]);

  useEffect(() => {
    const subscription = widgetApi
      .observeModalButtons()
      .subscribe(async (buttonId) => {
        switch (buttonId) {
          case CancelScheduleMeetingModal:
            await widgetApi.closeModal();
            break;

          case SubmitScheduleMeetingModal:
            if (meeting) {
              await widgetApi.closeModal<ScheduleMeetingModalResult>({
                meeting,
                type: SubmitScheduleMeetingModal,
              });
            }
            break;
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [meeting, widgetApi]);

  const [isEditRecurringSeries, setEditRecurringSeries] = useState(false);

  const isEditingRecurringMeeting =
    initialMeeting &&
    isRecurringCalendarSourceEntry(initialMeeting.calendarEntries);

  const { key, editableInitialMeeting } = useMemo(
    () => getEditableInitialMeeting(initialMeeting, isEditRecurringSeries),
    [initialMeeting, isEditRecurringSeries],
  );

  return (
    <>
      {isEditingRecurringMeeting && (
        <EditRecurringMessage
          editRecurringSeries={isEditRecurringSeries}
          onChange={setEditRecurringSeries}
        />
      )}

      <ScheduleMeeting
        key={key}
        initialMeeting={editableInitialMeeting}
        initialIsMessagingEnabled={isMessagingEnabled}
        onMeetingChange={setMeeting}
      />
    </>
  );
};

/**
 * Returns the {@link Meeting} instance that should be edited in the form. This is a no-op for all
 * non-recurring meetings. For recurring meetings, the user can switch between editing the selected
 * recurrence entry (i.e. the single meeting in the series) or editing the complete series.
 */
export function getEditableInitialMeeting(
  initialMeeting: Meeting | undefined,
  editRecurringSeries: boolean,
): {
  /**
   * The `key` to provide to the rendering component. The key defines whether the component should
   * be reused or whether the internal state should be reset to the defaults.
   */
  key: string;

  /** The Meeting to edit (or undefined if a new meeting should be created). */
  editableInitialMeeting: Meeting | undefined;
} {
  if (
    initialMeeting &&
    editRecurringSeries &&
    isRecurringCalendarSourceEntry(initialMeeting.calendarEntries)
  ) {
    return {
      key: 'edit-series',
      editableInitialMeeting: {
        ...initialMeeting,
        startTime: toISOString(
          parseICalDate(initialMeeting.calendarEntries[0].dtstart),
        ),
        endTime: toISOString(
          parseICalDate(initialMeeting.calendarEntries[0].dtend),
        ),
        recurrenceId: undefined,
      },
    };
  }

  return { key: 'edit-normal', editableInitialMeeting: initialMeeting };
}
