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
import GroupsIcon from '@mui/icons-material/Groups';
import ShareIcon from '@mui/icons-material/Share';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Divider,
  Stack,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import React, { ReactNode, useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ellipsis } from '../../../lib/ellipsis';
import {
  isMeetingSpanningMultipleDays,
  isMeetingSpanningMultipleYears,
  isRecurringCalendarSourceEntry,
} from '../../../lib/utils';
import {
  fullDateFormat,
  timeOnlyDateFormat,
  withoutYearDateFormat,
} from '../../common/DateTimePickers';
import { TimeDistance } from '../../common/TimeDistance';
import {
  WithMeetingProps,
  withRoomIdMeeting,
} from '../../common/withRoomMeeting';
import { MeetingCardEditParticipantsContent } from '../MeetingCardEditParticipantsContent';
import { MeetingCardShareMeetingContent } from '../MeetingCardShareMeetingContent/MeetingCardShareMeetingContent';
import { OpenMeetingRoomButton } from '../OpenMeetingRoomButton';
import { formatRRuleText } from '../RecurrenceEditor/utils';
import { MeetingCardMenu } from './MeetingCardMenu';
import { TooltipToggleButton } from './TooltipToggleButton';

enum Actions {
  None = 'none',
  ShowParticipants = 'show_participants',
  ShareMeeting = 'share_meeting',
}

type MeetingCardProps = WithMeetingProps & {
  /** The id for the title element */
  titleId?: string;

  /** The id of the meeting time element */
  meetingTimeId?: string;

  /** Additional buttons to show in the header of the card */
  cardHeaderButtons?: ReactNode;

  /** The component to use for the heading. Defaults to `h5` */
  headingComponent?: React.ElementType;

  /** If true the card includes a button to go to the room */
  showOpenMeetingRoomButton?: boolean;

  /** If true, only the time is shown for the start time. */
  shortDateFormat?: boolean;
};

export const MeetingCard = withRoomIdMeeting(
  ({
    meeting,
    titleId,
    meetingTimeId,
    cardHeaderButtons,
    headingComponent,
    showOpenMeetingRoomButton,
    shortDateFormat,
  }: MeetingCardProps) => {
    const { t } = useTranslation();
    const widgetApi = useWidgetApi();

    const [action, setAction] = useState(Actions.None);

    const closeAction = useCallback(() => setAction(Actions.None), []);
    const handleChangeAction = useCallback(
      async (_, value: Actions) => {
        if (Object.values(Actions).includes(value)) {
          setAction(value);
        } else {
          closeAction();
        }
      },
      [closeAction]
    );

    const isMeetingInvitation = meeting.participants.some(
      (p) =>
        p.userId === widgetApi.widgetParameters.userId &&
        p.membership === 'invite'
    );

    const spansMultipleDays = isMeetingSpanningMultipleDays(meeting);
    const spansMultipleYears = isMeetingSpanningMultipleYears(meeting);

    const onEntered = useCallback((node: HTMLElement) => {
      node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, []);

    const sectionShowParticipantsId = useId();
    const sectionShareMeetingId = useId();

    const subheaderOpts = {
      startDate: new Date(meeting.startTime),
      endDate: new Date(meeting.endTime),
      recurrence:
        isRecurringCalendarSourceEntry(meeting.calendarEntries) &&
        formatRRuleText(meeting.calendarEntries[0].rrule, t),
      formatParams: {
        startDate: shortDateFormat ? timeOnlyDateFormat : fullDateFormat,
        endDate: spansMultipleYears
          ? fullDateFormat
          : spansMultipleDays
          ? withoutYearDateFormat
          : timeOnlyDateFormat,
      },
    };

    const subheader = isRecurringCalendarSourceEntry(
      meeting.calendarEntries
    ) ? (
      <Trans
        components={[
          <Typography component="span" key="0" sx={visuallyHidden} />,
        ]}
        context="recurring"
        defaults="$t(meetingCard.durationSubheader_default)<0>. Recurrence: {{recurrence}}</0>"
        i18nKey="meetingCard.durationSubheader"
        t={t}
        tOptions={subheaderOpts}
      />
    ) : (
      t(
        'meetingCard.durationSubheader',
        '{{startDate, datetime}} – {{endDate, datetime}}',
        {
          ...subheaderOpts,
          context: 'default',
        }
      )
    );

    return (
      <Card variant="outlined">
        <CardHeader
          action={
            <>
              {showOpenMeetingRoomButton && (
                <OpenMeetingRoomButton
                  aria-describedby={titleId}
                  meetingType={meeting.type}
                  roomId={meeting.meetingId}
                />
              )}

              {!isMeetingInvitation && (
                <MeetingCardMenu aria-describedby={titleId} meeting={meeting} />
              )}

              {cardHeaderButtons}
            </>
          }
          subheader={
            <>
              {isRecurringCalendarSourceEntry(meeting.calendarEntries) && (
                <>
                  <Tooltip
                    // use a fragment so no aria-label is added to the icon
                    title={
                      <>
                        {t(
                          'meetingCard.recurrenceTooltip',
                          'Recurrence: {{recurrence}}',
                          {
                            recurrence: formatRRuleText(
                              meeting.calendarEntries[0].rrule,
                              t
                            ),
                          }
                        )}
                      </>
                    }
                  >
                    <EventRepeatIcon fontSize="inherit" />
                  </Tooltip>{' '}
                </>
              )}
              {subheader}
            </>
          }
          subheaderTypographyProps={{ id: meetingTimeId }}
          title={meeting.title}
          titleTypographyProps={{
            id: titleId,
            sx: ellipsis,
            component: headingComponent ?? 'h5',
          }}
        />

        <TimeDistance
          endDate={meeting.endTime}
          startDate={meeting.startTime}
          sx={{
            marginTop: '-20px',
          }}
        />

        <Divider />

        <CardContent>
          {meeting.description && (
            <Typography paragraph>{meeting.description}</Typography>
          )}
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <ToggleButtonGroup
              aria-label={t('meetingCard.actions', 'Actions')}
              exclusive
              onChange={handleChangeAction}
              size="small"
              value={action}
            >
              <TooltipToggleButton
                TooltipProps={{
                  title: t(
                    'meetingCard.editParticipants.buttonTitle',
                    'Show participants'
                  ),
                }}
                aria-describedby={titleId}
                expandedId={sectionShowParticipantsId}
                value={Actions.ShowParticipants}
              >
                <GroupsIcon />
              </TooltipToggleButton>

              <TooltipToggleButton
                TooltipProps={{
                  title: t('meetingCard.share.buttonTitle', 'Share meeting'),
                }}
                aria-describedby={titleId}
                expandedId={sectionShareMeetingId}
                value={Actions.ShareMeeting}
              >
                <ShareIcon />
              </TooltipToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Collapse
            id={sectionShowParticipantsId}
            in={action === Actions.ShowParticipants}
            mountOnEnter
            onEntered={onEntered}
            unmountOnExit
          >
            <Box mt={2}>
              <MeetingCardEditParticipantsContent
                aria-describedby={titleId}
                meeting={meeting}
              />
            </Box>
          </Collapse>

          <Collapse
            id={sectionShareMeetingId}
            in={action === Actions.ShareMeeting}
            mountOnEnter
            onEntered={onEntered}
            unmountOnExit
          >
            <Box mt={2}>
              <MeetingCardShareMeetingContent
                aria-describedby={titleId}
                meeting={meeting}
              />
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  }
);
