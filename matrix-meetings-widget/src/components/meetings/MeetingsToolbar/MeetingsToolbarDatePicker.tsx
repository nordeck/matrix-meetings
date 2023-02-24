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

import { SxProps } from '@mui/material';
import {
  CalendarDayPicker,
  CalendarMonthPicker,
  CalendarWeekPicker,
  CalendarWorkWeekPicker,
  DateRangePicker,
} from '../../common/DateTimePickers';
import { ViewType } from '../MeetingsNavigation';

type MeetingsToolbarDatePickerProps = {
  view: ViewType;
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
  sx?: SxProps;
};

export const MeetingsToolbarDatePicker = ({
  view,
  startDate,
  endDate,
  onRangeChange,
  sx,
}: MeetingsToolbarDatePickerProps) => {
  return (
    <>
      {view === 'list' && (
        <DateRangePicker
          endDate={endDate}
          onRangeChange={onRangeChange}
          startDate={startDate}
          sx={sx}
        />
      )}
      {view === 'day' && (
        <CalendarDayPicker
          endDate={endDate}
          onRangeChange={onRangeChange}
          startDate={startDate}
          sx={sx}
        />
      )}
      {view === 'workWeek' && (
        <CalendarWorkWeekPicker
          endDate={endDate}
          onRangeChange={onRangeChange}
          startDate={startDate}
          sx={sx}
        />
      )}
      {view === 'week' && (
        <CalendarWeekPicker
          endDate={endDate}
          onRangeChange={onRangeChange}
          startDate={startDate}
          sx={sx}
        />
      )}
      {view === 'month' && (
        <CalendarMonthPicker
          endDate={endDate}
          onRangeChange={onRangeChange}
          startDate={startDate}
          sx={sx}
        />
      )}
    </>
  );
};
