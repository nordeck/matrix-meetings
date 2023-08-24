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
  EventClickArg,
  EventContentArg,
  EventInput,
  EventMountArg,
  MoreLinkArg,
  MoreLinkMountArg,
  MoreLinkSimpleAction,
} from '@fullcalendar/core';
import deLocale from '@fullcalendar/core/locales/de';
import FullCalendar from '@fullcalendar/react';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { unstable_useId as useId } from '@mui/utils';
import { isEqual } from 'lodash';
import { DateTime } from 'luxon';
import {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarViewType } from '../../../lib/utils';
import { Filters, makeSelectAllMeetingIds } from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { FullCalendarThemeProvider } from './FullCalendarThemeProvider';
import { MeetingsCalendarDetailsDialog } from './MeetingsCalendarDetailsDialog';
import { MeetingsCalendarEvent } from './MeetingsCalendarEvent';
import { dayGridPlugin, interactionPlugin, timeGridPlugin } from './plugins';

function fullcalendarViewType(calendarView: CalendarViewType): string {
  switch (calendarView) {
    case 'day':
      return 'timeGridDay';
    case 'workWeek':
      return 'timeGridWeek';
    case 'week':
      return 'timeGridWeek';
    case 'month':
      return 'dayGridMonth';
  }
}

interface MeetingsCalendarProps {
  /** The view to be opened in calendar */
  view: CalendarViewType;

  filters: Filters;

  /** User clicks on the "more" button of a day in the months view */
  onShowMore: (date: Date) => void;

  displayAllMeetings?: boolean;
}

export const MeetingsCalendar = ({
  view,
  filters,
  onShowMore,
  displayAllMeetings,
}: MeetingsCalendarProps): ReactElement => {
  const { i18n } = useTranslation();
  // use the default en-us locale for all other languages
  const language: string | undefined = i18n.languages?.[0];
  const locale =
    language && new Intl.Locale(language).language === 'de'
      ? deLocale
      : undefined;
  const [detailsMeetingId, setDetailsMeetingId] = useState<
    | { meetingId: string; uid: string; recurrenceId: string | undefined }
    | undefined
  >();

  const widgetApi = useWidgetApi();

  const ref = useRef<FullCalendar>(null);

  useEffect(() => {
    const fullCalendar = ref.current;
    if (fullCalendar) {
      const viewType = fullcalendarViewType(view);
      const calendarApi = fullCalendar.getApi();
      calendarApi.changeView(viewType, filters.startDate);
    }
  }, [ref, view, filters]);

  const selectAllMeetingIds = useMemo(
    () =>
      makeSelectAllMeetingIds({
        includeBreakoutSessions: false,
        skipMeetings: false,
        isChildOfRoomId: !displayAllMeetings
          ? widgetApi.widgetParameters.roomId
          : undefined,
        hasMemberId: widgetApi.widgetParameters.userId,
      }),
    [
      widgetApi.widgetParameters.roomId,
      widgetApi.widgetParameters.userId,
      displayAllMeetings,
    ],
  );

  const buttonsId = useId();
  const events: EventInput[] = useAppSelector((state) => {
    const meetingIds = selectAllMeetingIds(
      state,
      generateFilters(filters, view),
    );

    return meetingIds.flatMap((meetingId) => ({
      id: `${meetingId.id}${meetingId.uid}${meetingId.recurrenceId}`,
      meetingId: meetingId.id,
      uid: meetingId.uid,
      start: meetingId.startTime,
      end: meetingId.endTime,
      recurrenceId: meetingId.recurrenceId,
      buttonLabelId: `${buttonsId}-${normalizeId(
        `${meetingId.id}${meetingId.uid}${meetingId.recurrenceId}`,
      )}`,
    }));
  }, isEqual);

  // amend the `<a>...</a>` that encloses the array with additional properties
  // that can't be set via the fullcalendar api.
  const handleEventDidMount = useCallback((arg: EventMountArg) => {
    const buttonLabelId: string = arg.event.extendedProps['buttonLabelId'];

    // fullcalendar is using no role for the clickable part, use a button
    // instead
    arg.el.setAttribute('role', 'button');
    // The element that contains the label is rendered by the event content
    arg.el.setAttribute('aria-labelledby', buttonLabelId);
  }, []);

  const renderEventContent = useCallback(
    (arg: EventContentArg) => {
      const meetingId: string = arg.event.extendedProps['meetingId'];
      const uid: string = arg.event.extendedProps['uid'];
      const recurrenceId: string | undefined =
        arg.event.extendedProps['recurrenceId'];
      const buttonLabelId: string = arg.event.extendedProps['buttonLabelId'];

      return (
        <MeetingsCalendarEvent
          buttonLabelId={buttonLabelId}
          recurrenceId={recurrenceId}
          roomId={meetingId}
          uid={uid}
          view={view}
        />
      );
    },
    [view],
  );

  const handleEventClick = useCallback((arg: EventClickArg) => {
    setDetailsMeetingId({
      meetingId: arg.event.extendedProps['meetingId'],
      uid: arg.event.extendedProps['uid'],
      recurrenceId: arg.event.extendedProps['recurrenceId'],
    });
  }, []);

  // amend the "more" link with additional properties that can't be set via
  // the fullcalendar api.
  const handleMoreLinkDidMount = useCallback((arg: MoreLinkMountArg) => {
    // Fix role as full calendar is using a link?
    arg.el.setAttribute('role', 'button');
    // We don't need these aria properties:
    arg.el.removeAttribute('aria-controls');
    arg.el.removeAttribute('aria-expanded');
  }, []);

  const handleMoreLinkClick = useCallback(
    (arg: MoreLinkArg): MoreLinkSimpleAction => {
      onShowMore(arg.date);

      // We handled the click, don't show the dialog
      return 'stop';
    },
    [onShowMore],
  );

  const handleOnClose = useCallback(() => {
    setDetailsMeetingId(undefined);
  }, []);

  return (
    <>
      <FullCalendarThemeProvider>
        <FullCalendar
          allDaySlot={false}
          dayMaxEventRows={3}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          eventDidMount={handleEventDidMount}
          eventDisplay="block"
          eventInteractive
          eventMinHeight={2 + 2 + 18 /* 2x Padding + font size */}
          events={events}
          fixedWeekCount={false}
          headerToolbar={false}
          height="100%"
          locale={locale}
          moreLinkClick={handleMoreLinkClick}
          moreLinkDidMount={handleMoreLinkDidMount}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          ref={ref}
          scrollTime="08:00:00"
          slotEventOverlap={false}
          weekends={view !== 'workWeek'}
        />
      </FullCalendarThemeProvider>

      <MeetingsCalendarDetailsDialog
        meetingId={detailsMeetingId}
        onClose={handleOnClose}
      />
    </>
  );
};

function normalizeId(input: string): string {
  return input.replace(/[^A-Z0-9_-]/gi, '');
}

function generateFilters(filters: Filters, view: CalendarViewType): Filters {
  if (view === 'month') {
    return {
      ...filters,
      startDate: DateTime.fromISO(filters.startDate)
        .minus({ weeks: 1 })
        .toISO(),
      endDate: DateTime.fromISO(filters.endDate).plus({ weeks: 1 }).toISO(),
    };
  }

  return filters;
}
