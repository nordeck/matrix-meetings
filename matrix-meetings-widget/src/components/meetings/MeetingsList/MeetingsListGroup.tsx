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

import { Box, Stack } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeadingDivider } from './SectionHeadingDivider';

type MeetingsListGroupProps = PropsWithChildren<{
  date: string;
}>;

export function MeetingsListGroup({ date, children }: MeetingsListGroupProps) {
  const titleId = useId();
  const { t } = useTranslation();

  return (
    <Box
      aria-labelledby={titleId}
      component="li"
      m={0}
      p={0}
      sx={{ listStyleType: 'none' }}
    >
      <SectionHeadingDivider
        id={titleId}
        title={t('meetingList.groupTitle', '{{date, datetime}}', {
          date: new Date(date),
          formatParams: {
            date: {
              weekday: 'long',
              month: '2-digit',
              year: 'numeric',
              day: '2-digit',
            },
          },
        })}
      />

      <Stack
        aria-labelledby={titleId}
        component="ul"
        maxWidth={327}
        mb={2}
        mt={1}
        mx="auto"
        px={2}
        py={0}
        spacing={1}
      >
        {children}
      </Stack>
    </Box>
  );
}
