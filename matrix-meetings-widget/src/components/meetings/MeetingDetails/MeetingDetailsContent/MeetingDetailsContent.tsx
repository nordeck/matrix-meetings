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

import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import LinkIcon from '@mui/icons-material/Link';
import TodayIcon from '@mui/icons-material/Today';
import { Box, DialogContent, Grid, Link, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { isRecurringCalendarSourceEntry } from '../../../../lib/utils';
import { Meeting } from '../../../../reducer/meetingsApi';
import { CopyableTextButton } from '../../../common/CopyableTextButton';
import { fullLongDateFormat } from '../../../common/DateTimePickers';
import { useMeetingUrl } from '../../MeetingCardShareMeetingContent/useMeetingUrl';
import { formatRRuleText } from '../../RecurrenceEditor/utils';
import { MeetingDetailsParticipants } from './MeetingDetailsParticipants';
import { MeetingDetailsShare } from './MeetingDetailsShare/MeetingDetailsShare';

export function MeetingDetailsContent({
  meeting,
  meetingTimeId,
}: {
  meeting: Meeting;
  meetingTimeId?: string;
}) {
  const { t } = useTranslation();
  const { url: meetingUrl } = useMeetingUrl(meeting);

  const recurrence = isRecurringCalendarSourceEntry(meeting.calendarEntries)
    ? formatRRuleText(meeting.calendarEntries[0].rrule, t)
    : '';

  return (
    <DialogContent sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box mb={2}>
            <Typography
              component="h4"
              fontSize="inherit"
              fontWeight="bold"
              display="block"
              mb={1}
            >
              {t('meetingDetails.content.details', 'Details')}
            </Typography>
            <Box display="flex" alignItems="flex-end" mb={1}>
              {isRecurringCalendarSourceEntry(meeting.calendarEntries) ? (
                <EventRepeatIcon
                  fontSize="medium"
                  sx={{ mr: 1 }}
                  color="action"
                />
              ) : (
                <TodayIcon fontSize="medium" sx={{ mr: 1 }} color="action" />
              )}
              <Typography
                component="span"
                fontSize="inherit"
                data-testid="date"
                id={meetingTimeId}
              >
                {t(
                  'meetingDetails.content.dateAndTime',
                  '{{range, daterange}}',
                  {
                    range: [
                      new Date(meeting.startTime),
                      new Date(meeting.endTime),
                    ],
                    formatParams: {
                      range: fullLongDateFormat,
                    },
                  }
                )}
              </Typography>
            </Box>

            {recurrence && (
              <Box mb={1} ml={4}>
                <Typography
                  component="span"
                  fontSize="inherit"
                  data-testid="recurrenceRole"
                >
                  {recurrence}
                </Typography>
              </Box>
            )}

            <Box
              display="flex"
              alignItems="center"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              <LinkIcon fontSize="medium" sx={{ mr: 1 }} color="action" />

              <Box
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                <Link
                  href={meetingUrl}
                  underline="hover"
                  rel="noopener"
                  target="_blank"
                  color="inherit"
                >
                  {meetingUrl}
                </Link>
              </Box>
              <CopyableTextButton text={meetingUrl} />
            </Box>
          </Box>

          {meeting.description && (
            <Box mb={2}>
              <Typography
                component="h4"
                fontSize="inherit"
                fontWeight="bold"
                display="block"
                mb={1}
              >
                {t('meetingDetails.content.description', 'Description')}
              </Typography>
              <Typography paragraph fontSize="inherit">
                {meeting.description}
              </Typography>
            </Box>
          )}

          <MeetingDetailsShare meeting={meeting} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <MeetingDetailsParticipants
            participants={meeting.participants}
            creator={meeting.creator}
          />
        </Grid>
      </Grid>
    </DialogContent>
  );
}
