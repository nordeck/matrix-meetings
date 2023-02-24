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

import EmailIcon from '@mui/icons-material/Email';
import ErrorIcon from '@mui/icons-material/Error';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LinkIcon from '@mui/icons-material/Link';
import PhoneIcon from '@mui/icons-material/Phone';
import {
  Alert,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isRecurringCalendarSourceEntry } from '../../../lib/utils';
import { Meeting } from '../../../reducer/meetingsApi';
import { MeetingInvitationGuard } from '../../common/MeetingInvitationGuard';
import { CopyableText } from './CopyableText';
import { ShareDialog, useShareDialog } from './ShareDialog';
import { useDownloadIcsFile } from './useDownloadIcsFile';
import { useJitsiDialInInformation } from './useJitsiDialInInformation';
import { useMeetingEmail } from './useMeetingEmail';
import { useMeetingUrl } from './useMeetingUrl';

type MeetingCardShareMeetingContentProps = {
  meeting: Meeting;
  'aria-describedby'?: string;
};

export function MeetingCardShareMeetingContent({
  meeting,
  'aria-describedby': ariaDescribedBy,
}: MeetingCardShareMeetingContentProps) {
  const { t } = useTranslation();

  const { url: meetingUrl } = useMeetingUrl(meeting);
  const {
    href: icsUrl,
    filename: icsFilename,
    error: icsError,
  } = useDownloadIcsFile(meeting);

  const { message } = useMeetingEmail(meeting);
  const {
    data: dialInInformation,
    isError: dialInInformationError,
    isLoading: dialInInformationLoading,
  } = useJitsiDialInInformation(meeting.meetingId);

  const shareDialInSecondary = useMemo(() => {
    if (dialInInformationError) {
      return t(
        'meetingCard.share.shareDialInNumberError',
        'Error while requesting the dial-in information.'
      );
    } else if (!dialInInformationLoading && !dialInInformation?.dialInNumber) {
      return t(
        'meetingCard.share.shareDialInNumberNotPresent',
        'No dial-in information available'
      );
    }

    return undefined;
  }, [
    dialInInformation?.dialInNumber,
    dialInInformationError,
    dialInInformationLoading,
    t,
  ]);

  const linkDialog = useShareDialog();
  const dialInDialog = useShareDialog();
  const emailDialog = useShareDialog();
  const icsDialog = useShareDialog();

  const titleId = useId();

  return (
    <MeetingInvitationGuard meeting={meeting}>
      <List
        aria-labelledby={titleId}
        subheader={
          <ListSubheader
            aria-hidden="true"
            disableGutters
            disableSticky
            id={titleId}
          >
            {t('meetingCard.share.menuTitle', 'Share meeting')}
          </ListSubheader>
        }
      >
        <li>
          <ListItemButton
            aria-describedby={ariaDescribedBy}
            disableGutters
            onClick={linkDialog.onOpen}
          >
            <ListItemIcon>
              <LinkIcon />
            </ListItemIcon>
            <ListItemText>
              {t('meetingCard.share.shareLink', 'Share meeting link')}
            </ListItemText>
          </ListItemButton>
        </li>

        <li>
          <ListItemButton
            aria-describedby={ariaDescribedBy}
            disableGutters
            disabled={dialInInformation?.dialInNumber === undefined}
            onClick={dialInDialog.onOpen}
          >
            <ListItemIcon>
              <PhoneIcon />
            </ListItemIcon>
            <ListItemText
              primary={t(
                'meetingCard.share.shareDialInNumber',
                'Share dial-in number'
              )}
              secondary={shareDialInSecondary}
            ></ListItemText>
          </ListItemButton>
        </li>

        <li>
          <ListItemButton
            aria-describedby={ariaDescribedBy}
            disableGutters
            onClick={emailDialog.onOpen}
          >
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText>
              {t('meetingCard.share.shareByMail', 'Share by email')}
            </ListItemText>
          </ListItemButton>
        </li>

        <li>
          <ListItemButton
            aria-describedby={ariaDescribedBy}
            disableGutters
            onClick={icsDialog.onOpen}
            sx={{ color: icsError ? 'error.main' : undefined }}
          >
            <ListItemIcon sx={{ color: icsError ? 'error.main' : undefined }}>
              {icsError ? <ErrorIcon /> : <FileDownloadIcon />}
            </ListItemIcon>
            <ListItemText
              primary={t(
                'meetingCard.share.downloadIcsFile',
                'Download ICS File'
              )}
              secondary={icsError}
              secondaryTypographyProps={{ color: 'inherit' }}
            ></ListItemText>
          </ListItemButton>
        </li>
      </List>

      <ShareDialog
        description={t(
          'meetingCard.share.linkDescription',
          'Use the following link to join the meeting:'
        )}
        onClose={linkDialog.onClose}
        open={linkDialog.open}
        title={t(
          'meetingCard.share.linkTitle',
          'Share the link to the meeting room'
        )}
      >
        {isRecurringCalendarSourceEntry(meeting.calendarEntries) && (
          <Alert role="status" severity="warning" sx={{ my: 1 }}>
            {t(
              'meetingCard.share.warningRecurringMeetingLink',
              'This is a link to a meeting series. Sharing this link invites users to all meetings in the series.'
            )}
          </Alert>
        )}
        <CopyableText
          label={t('meetingCard.share.linkCopyMeetingLink', 'Meeting link')}
          text={meetingUrl}
        />
      </ShareDialog>

      <ShareDialog
        description={t(
          'meetingCard.share.emailDescription',
          'Use the following information to forward the conference for example by email:'
        )}
        onClose={emailDialog.onClose}
        open={emailDialog.open}
        title={t(
          'meetingCard.share.emailTitle',
          'Share the meeting invitation'
        )}
      >
        {isRecurringCalendarSourceEntry(meeting.calendarEntries) && (
          <Alert role="status" severity="warning" sx={{ my: 1 }}>
            {t(
              'meetingCard.share.warningRecurringMeetingEmail',
              'This is an email invitation to a meeting series. Sharing this email invitation invites users to all meetings in the series.'
            )}
          </Alert>
        )}
        <CopyableText
          label={t('meetingCard.share.emailCopyMessage', 'Message')}
          multiline
          text={message}
        />
      </ShareDialog>

      {dialInInformation?.dialInNumber && (
        <ShareDialog
          description={t(
            'meetingCard.share.dialInDescription',
            'Use the following information to dial into the conference by phone:'
          )}
          onClose={dialInDialog.onClose}
          open={dialInDialog.open}
          title={t(
            'meetingCard.share.dialInTitle',
            'Share the dial in information'
          )}
        >
          {isRecurringCalendarSourceEntry(meeting.calendarEntries) && (
            <Alert role="status" severity="warning" sx={{ my: 1 }}>
              {t(
                'meetingCard.share.warningRecurringMeetingDialInNumber',
                'This is a dial-in number to a meeting series. Sharing this dail-in number invites users to all meetings in the series.'
              )}
            </Alert>
          )}
          <CopyableText
            label={t('meetingCard.share.dialInCopyNumber', 'Dial-in number')}
            text={dialInInformation.dialInNumber}
          />
          {dialInInformation.pin && (
            <CopyableText
              label={t('meetingCard.share.dialInCopyPin', 'Dial-in pin')}
              text={dialInInformation.pin.toString()}
            />
          )}
        </ShareDialog>
      )}

      <ShareDialog
        description={t(
          'meetingCard.share.icsDescription',
          'Download the meeting in the iCalendar format to add it to a calendar application:'
        )}
        onClose={icsDialog.onClose}
        open={icsDialog.open}
        title={t('meetingCard.share.icsTitle', 'Download a calendar file')}
      >
        {isRecurringCalendarSourceEntry(meeting.calendarEntries) && (
          <Alert role="status" severity="warning" sx={{ my: 1 }}>
            {t(
              'meetingCard.share.warningRecurringMeetingICalFile',
              'This is an iCal file of a meeting series. Sharing this iCal file invites users to all meetings in the series.'
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
          Download
        </Button>
      </ShareDialog>
    </MeetingInvitationGuard>
  );
}
