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

import ViewDayIcon from '@mui/icons-material/CalendarViewDay';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import ListIcon from '@mui/icons-material/List';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import {
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  SxProps,
  useMediaQuery,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { TFunction } from 'i18next';
import { Dispatch, ReactElement, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarViewType } from '../../../lib/utils';

export type ViewType = 'list' | CalendarViewType;

const smallDeviceViews: ViewType[] = ['list', 'day'];

type MeetingsNavigationProps = {
  view: ViewType;
  onViewChange: Dispatch<ViewType>;
  sx?: SxProps;
};

export const MeetingsNavigation = ({
  view,
  onViewChange,
  sx,
}: MeetingsNavigationProps) => {
  const { t } = useTranslation();
  const isBigDevice = useMediaQuery('(min-width:800px)', { noSsr: true });

  // switch to the day view if the viewport is too narrow
  useEffect(() => {
    if (!smallDeviceViews.includes(view) && !isBigDevice) {
      onViewChange('day');
    }
  }, [isBigDevice, onViewChange, view]);

  const handleOnChangeChangeView = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value as ViewType;
      if (smallDeviceViews.includes(value) || isBigDevice) {
        onViewChange(value);
      }
    },
    [isBigDevice, onViewChange],
  );

  const selectInputLabelId = useId();
  const selectInputDescriptionId = useId();
  const selectViewId = useId();

  return (
    <FormControl sx={sx}>
      <InputLabel id={selectInputLabelId} sx={visuallyHidden}>
        {t('meetingsNavigation.label', 'View')}
      </InputLabel>

      {!isBigDevice && (
        <InputLabel
          aria-hidden
          id={selectInputDescriptionId}
          sx={visuallyHidden}
        >
          {t(
            'meetingsNavigation.increaseWidthToShowMore',
            'Increase widget width to enable more views.',
          )}
        </InputLabel>
      )}

      <Select
        aria-describedby={!isBigDevice ? selectInputDescriptionId : undefined}
        id={selectViewId}
        labelId={selectInputLabelId}
        onChange={handleOnChangeChangeView}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            minWidth: 50,
            paddingY: 0.5,
          },

          '& .MuiListItemIcon-root': {
            minWidth: 25,
          },
        }}
        value={view}
      >
        {renderMenuItem('list', isBigDevice, t)}
        {renderMenuItem('day', isBigDevice, t)}
        {renderMenuItem('workWeek', isBigDevice, t)}
        {renderMenuItem('week', isBigDevice, t)}
        {renderMenuItem('month', isBigDevice, t)}
      </Select>
    </FormControl>
  );
};

const renderMenuItem = (view: ViewType, isBigDevice: boolean, t: TFunction) => {
  const disabled = !smallDeviceViews.includes(view) && !isBigDevice;
  return (
    <MenuItem disabled={disabled} key={view} value={view}>
      <ListItemIcon>{itemIcon(view)}</ListItemIcon>
      <ListItemText
        primary={itemText(view, t)}
        secondary={
          disabled &&
          t('meetingsNavigation.increaseWidth', 'Increase widget width')
        }
        secondaryTypographyProps={{ noWrap: true }}
      />
    </MenuItem>
  );
};

function itemIcon(meetingsView: ViewType): ReactElement {
  switch (meetingsView) {
    case 'list':
      return <ListIcon fontSize="small" />;
    case 'day':
      return <ViewDayIcon fontSize="small" />;
    case 'workWeek':
      return <ViewWeekIcon fontSize="small" />;
    case 'week':
      return <CalendarViewWeekIcon fontSize="small" />;
    case 'month':
      return <CalendarViewMonthIcon fontSize="small" />;
  }
}

function itemText(meetingsView: ViewType, t: TFunction): string {
  switch (meetingsView) {
    case 'list':
      return t('meetingsNavigation.views.list', 'List');
    case 'day':
      return t('meetingsNavigation.views.day', 'Day');
    case 'workWeek':
      return t('meetingsNavigation.views.workWeek', 'Work Week');
    case 'week':
      return t('meetingsNavigation.views.week', 'Week');
    case 'month':
      return t('meetingsNavigation.views.month', 'Month');
  }
}
