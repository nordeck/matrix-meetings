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

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ErrorIcon from '@mui/icons-material/Error';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import {
  Alert,
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { useTranslation } from 'react-i18next';
import { isRecurringCalendarSourceEntry } from '../../../../../lib/utils';
import { Meeting } from '../../../../../reducer/meetingsApi';
import { CopyableText } from '../../../MeetingCardShareMeetingContent/CopyableText';
import { useDownloadIcsFile } from '../../../MeetingCardShareMeetingContent/useDownloadIcsFile';
import { useMeetingEmail } from '../../../MeetingCardShareMeetingContent/useMeetingEmail';
import { ShareDialog, useShareDialog } from './ShareDialog';

export function MeetingDetailsShare({ meeting }: { meeting: Meeting }) {
  const { t } = useTranslation();
  const {
    href: icsUrl,
    filename: icsFilename,
    error: icsError,
  } = useDownloadIcsFile(meeting);

  const { message } = useMeetingEmail(meeting);

  const emailDialog = useShareDialog();
  const icsDialog = useShareDialog();
  const titleId = useId();

  return (
    <>
      <Box mb={2}>
        <Typography
          component="h4"
          fontSize="inherit"
          fontWeight="bold"
          display="block"
          id={titleId}
          mb={1}
        >
          {t('meetingDetails.content.shareMeeting.title', 'Share meeting')}
        </Typography>
        <List aria-labelledby={titleId}>
          <ListItem disablePadding>
            <ListItemButton disableGutters onClick={emailDialog.onOpen}>
              <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                <EmailOutlinedIcon />
              </ListItemIcon>
              <ListItemText>
                {t(
                  'meetingDetails.content.shareMeeting.shareByMail',
                  'Share by email',
                )}
              </ListItemText>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              disableGutters
              onClick={icsDialog.onOpen}
              sx={{ color: icsError ? 'error.main' : undefined }}
            >
              <ListItemIcon
                sx={{
                  color: icsError ? 'error.main' : undefined,
                  minWidth: 'auto',
                  mr: 1,
                }}
              >
                {icsError ? <ErrorIcon /> : <FileDownloadOutlinedIcon />}
              </ListItemIcon>
              <ListItemText
                primary={t(
                  'meetingDetails.content.shareMeeting.downloadIcsFile',
                  'Download ICS File',
                )}
                secondary={icsError}
                secondaryTypographyProps={{ color: 'inherit' }}
              ></ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      <ShareDialog
        description={t(
          'meetingDetails.content.shareMeeting.emailDescription',
          'Use the following information to forward the conference for example by email:',
        )}
        onClose={emailDialog.onClose}
        open={emailDialog.open}
        title={t(
          'meetingDetails.content.shareMeeting.emailTitle',
          'Share the meeting invitation',
        )}
      >
        {isRecurringCalendarSourceEntry(meeting.calendarEntries) && (
          <Alert role="status" severity="warning" sx={{ my: 1 }}>
            {t(
              'meetingDetails.content.shareMeeting.warningRecurringMeetingEmail',
              'This is an email invitation to a meeting series. Sharing this email invitation invites users to all meetings in the series.',
            )}
          </Alert>
        )}
        <CopyableText
          label={t(
            'meetingDetails.content.shareMeeting.emailCopyMessage',
            'Message',
          )}
          multiline
          text={message}
        />
      </ShareDialog>

      <ShareDialog
        description={t(
          'meetingDetails.content.shareMeeting.icsDescription',
          'Download the meeting in the iCalendar format to add it to a calendar application:',
        )}
        onClose={icsDialog.onClose}
        open={icsDialog.open}
        title={t(
          'meetingDetails.content.shareMeeting.icsTitle',
          'Download a calendar file',
        )}
      >
        {isRecurringCalendarSourceEntry(meeting.calendarEntries) && (
          <Alert role="status" severity="warning" sx={{ my: 1 }}>
            {t(
              'meetingDetails.content.shareMeeting.warningRecurringMeetingICalFile',
              'This is an iCal file of a meeting series. Sharing this iCal file invites users to all meetings in the series.',
            )}
          </Alert>
        )}
        <Button
          component="a"
          download={icsFilename}
          fullWidth
          href={icsUrl}
          startIcon={<FileDownloadIcon />}
          sx={{ my: 1 }}
          variant="outlined"
        >
          {t('meetingDetails.content.shareMeeting.download', 'Download')}
        </Button>
      </ShareDialog>
    </>
  );
}
