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
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { isRecurringCalendarSourceEntry } from '@nordeck/matrix-meetings-calendar';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarViewType,
  isMeetingSpanningMultipleDays,
} from '../../../lib/utils';
import {
  fullLongDateFormat,
  timeOnlyDateFormat,
} from '../../common/DateTimePickers';
import {
  WithMeetingProps,
  withRoomIdMeeting,
} from '../../common/withRoomMeeting';

type MeetingsCalendarEventProps = WithMeetingProps & {
  view: CalendarViewType;

  /** The id of the label that is used by the enclosing button component */
  buttonLabelId: string;
};

export const MeetingsCalendarEvent = withRoomIdMeeting(
  ({
    view,
    meeting,
    buttonLabelId,
  }: MeetingsCalendarEventProps): ReactElement => {
    const widgetApi = useWidgetApi();
    const { t } = useTranslation();

    const showCreator = widgetApi.widgetParameters.userId !== meeting.creator;
    const creatorName =
      meeting.participants.find((p) => p.userId === meeting.creator)
        ?.displayName ?? meeting.creator;

    const tooltipLabel = isRecurringCalendarSourceEntry(meeting.calendarEntries)
      ? t(
          'meetingsCalendar.event.summary',
          '{{startTime, datetime}}–{{endTime, datetime}}: “{{title}}” by {{creator}}, recurring meeting',
          {
            startTime: new Date(meeting.startTime),
            endTime: new Date(meeting.endTime),
            title: meeting.title,
            creator: creatorName,
            formatParams: {
              startTime: fullLongDateFormat,
              endTime: isMeetingSpanningMultipleDays(meeting)
                ? fullLongDateFormat
                : timeOnlyDateFormat,
            },
            context: 'recurring',
          },
        )
      : t(
          'meetingsCalendar.event.summary',
          '{{startTime, datetime}}–{{endTime, datetime}}: “{{title}}” by {{creator}}',
          {
            startTime: new Date(meeting.startTime),
            endTime: new Date(meeting.endTime),
            title: meeting.title,
            creator: creatorName,
            formatParams: {
              startTime: fullLongDateFormat,
              endTime: isMeetingSpanningMultipleDays(meeting)
                ? fullLongDateFormat
                : timeOnlyDateFormat,
            },
            context: 'default',
          },
        );

    return (
      <>
        <Tooltip
          title={
            // This fragment is intentional, so that the tooltip doesn't
            // apply the description as a title to the box. Instead we want
            // the aria label at the parent link to be the accessible name.
            <>{tooltipLabel}</>
          }
        >
          {/* You can not apply the tooltip to a flex container, it has to be a
              block */}
          <Box height="100%">
            <Stack flexDirection="row" height="100%">
              <Stack
                alignContent="flex-start"
                flex="1"
                flexDirection="column"
                flexWrap="wrap"
                gap={0.5}
                height="100%"
                maxWidth="100%"
                overflow="hidden"
              >
                <Box
                  maxWidth="100%"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {view === 'month' ? (
                    <Typography
                      component="span"
                      sx={{
                        // Make sure times are properly aligned
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      variant="body2"
                    >
                      {t(
                        'meetingsCalendar.event.startTime',
                        '{{startTime, datetime}}',
                        {
                          startTime: new Date(meeting.startTime),
                          formatParams: {
                            startTime: {
                              minute: 'numeric',
                              hour: 'numeric',
                            },
                          },
                        },
                      )}{' '}
                    </Typography>
                  ) : null}

                  <Typography
                    component="span"
                    fontWeight="bold"
                    variant="body2"
                  >
                    {meeting.title}
                  </Typography>
                </Box>

                {view !== 'month' && showCreator && creatorName && (
                  <Box
                    maxWidth="100%"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    <Typography component="span" variant="body2">
                      {creatorName}
                    </Typography>
                  </Box>
                )}
              </Stack>
              {isRecurringCalendarSourceEntry(meeting.calendarEntries) && (
                <Box display="flex" marginLeft="auto">
                  <EventRepeatIcon
                    fontSize="inherit"
                    sx={{
                      marginTop: 'auto',
                      marginBottom: '3px',
                      marginRight: '2px',
                    }}
                  />
                </Box>
              )}
            </Stack>
          </Box>
        </Tooltip>

        {/* Hidden text to provide a full aria label for the button as screen
          reader users can't see the visual relation to the grid */}
        <Box display="none" id={buttonLabelId}>
          {tooltipLabel}
        </Box>
      </>
    );
  },
);
