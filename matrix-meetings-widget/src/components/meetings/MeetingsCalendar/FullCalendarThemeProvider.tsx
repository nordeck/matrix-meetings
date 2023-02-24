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

import { styled } from '@mui/material';

export const FullCalendarThemeProvider = styled('div')(({ theme }) => ({
  // fill the outer container
  height: '100%',

  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),

  // Adjust theming of full calendar
  '--fc-page-bg-color': theme.palette.background.default,
  '--fc-border-color': theme.palette.divider,
  '--fc-small-font-size': theme.typography.body2.fontSize,
  '--fc-event-bg-color': theme.palette.primary.main,
  '--fc-event-border-color': theme.palette.primary.dark,
  '--fc-event-text-color': theme.palette.primary.contrastText,
  '--fc-event-selected-overlay-color': theme.palette.action.hover,

  // Color for dates of the previous month has not the right contrast
  '& .fc .fc-day-other .fc-daygrid-day-top': {
    opacity: 1,
    '& .fc-daygrid-day-number': {
      color: theme.palette.text.secondary,
    },
  },

  // Make events visually clickable
  '& .fc a.fc-event': {
    cursor: 'pointer',
  },

  // Make all events have the same height in the month view
  '& .fc .fc-dayGridMonth-view td.fc-day': {
    height: 110,
  },

  '& .fc .fc-timegrid-event .fc-event-main': {
    padding: '0px',

    '& > div': {
      padding: '1px 1px 0',
    },
  },
}));
