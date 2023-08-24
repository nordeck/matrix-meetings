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

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Button, IconButton, Tooltip } from '@mui/material';
import { TFunction } from 'i18next';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ViewType } from '../MeetingsNavigation';
import { moveFilterRange } from './moveFilterRange';

type MeetingsToolbarButtonsProps = {
  view: ViewType;
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
};

export const MeetingsToolbarButtons = ({
  view,
  startDate,
  endDate,
  onRangeChange,
}: MeetingsToolbarButtonsProps) => {
  const { t } = useTranslation();

  const goToPrevDates = useCallback(() => {
    const range = moveFilterRange(startDate, endDate, view, 'minus');
    onRangeChange(range.startDate, range.endDate);
  }, [endDate, onRangeChange, startDate, view]);

  const goToNextDates = useCallback(() => {
    const range = moveFilterRange(startDate, endDate, view, 'plus');
    onRangeChange(range.startDate, range.endDate);
  }, [endDate, onRangeChange, startDate, view]);

  const showToday = useCallback(() => {
    const range = moveFilterRange(startDate, endDate, view, 'today');
    onRangeChange(range.startDate, range.endDate);
  }, [endDate, onRangeChange, startDate, view]);

  return (
    <>
      <Button onClick={showToday}>{t('meetingsToolbar.today', 'Today')}</Button>
      <Tooltip title={getTitle(view, t).previous}>
        <IconButton onClick={goToPrevDates}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={getTitle(view, t).next}>
        <IconButton onClick={goToNextDates}>
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
};

function getTitle(
  view: ViewType,
  t: TFunction,
): { previous: string; next: string } {
  switch (view) {
    case 'day':
      return {
        previous: t('meetingsToolbar.previous.day', 'Previous day'),
        next: t('meetingsToolbar.next.day', 'Next day'),
      };

    case 'workWeek':
      return {
        previous: t('meetingsToolbar.previous.workweek', 'Previous work week'),
        next: t('meetingsToolbar.next.workweek', 'Next work week'),
      };

    case 'week':
      return {
        previous: t('meetingsToolbar.previous.week', 'Previous week'),
        next: t('meetingsToolbar.next.week', 'Next week'),
      };

    case 'month':
      return {
        previous: t('meetingsToolbar.previous.month', 'Previous month'),
        next: t('meetingsToolbar.next.month', 'Next month'),
      };

    default:
      return {
        previous: t('meetingsToolbar.previous.period', 'Previous period'),
        next: t('meetingsToolbar.next.period', 'Next period'),
      };
  }
}
