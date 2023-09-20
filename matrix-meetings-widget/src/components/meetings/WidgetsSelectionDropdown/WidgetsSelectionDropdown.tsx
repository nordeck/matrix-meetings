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

import {
  Autocomplete,
  AutocompleteRenderGetTagProps,
  Chip,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { isDefined } from '../../../lib/utils';
import { useGetAvailableWidgetsQuery } from '../../../reducer/meetingBotApi';
import { AvailableWidget } from '../../../reducer/meetingBotApi/types';

type WidgetsSelectionDropdownProps = {
  selectedWidgets: string[];
  autoSelectAllWidgets?: boolean;
  onChange: (widgetIds: string[]) => void;
  disabled?: boolean;
};

export function WidgetsSelectionDropdown({
  selectedWidgets,
  onChange,
  autoSelectAllWidgets,
  disabled,
}: WidgetsSelectionDropdownProps): ReactElement {
  const { t } = useTranslation();
  const instructionId = useId();
  const tagInstructionId = useId();
  const [isDirty, setDirty] = useState(false);
  const { isLoading, availableWidgets, isError } = useGetAvailableWidgetsQuery(
    undefined,
    {
      selectFromResult: ({ isLoading, data = [], isError }) => {
        return {
          isLoading,
          isError,
          availableWidgets: data,
        };
      },
    },
  );

  useEffect(() => {
    if (autoSelectAllWidgets && !isDirty && availableWidgets.length > 0) {
      onChange(
        availableWidgets
          .filter(({ optional }) => !optional)
          .map(({ id }) => id),
      );
      setDirty(true);
    }
  }, [
    autoSelectAllWidgets,
    availableWidgets,
    isDirty,
    onChange,
    selectedWidgets,
  ]);

  const handleOnChange = useCallback(
    (_: React.SyntheticEvent<Element, Event>, value: AvailableWidget[]) => {
      setDirty(true);
      onChange(value.map((w) => w.id));
    },
    [onChange],
  );

  const noResultsMessage = useMemo(() => {
    if (isError) {
      return t(
        'widgetSelectionDropdown.loadingError',
        'Error while loading available Widgets.',
      );
    }

    if (availableWidgets.length > 0) {
      return t(
        'widgetSelectionDropdown.allActive',
        'All available widgets are already active.',
      );
    }

    return t('widgetSelectionDropdown.noWidgets', 'No Widgets.');
  }, [availableWidgets.length, isError, t]);

  const renderInput = useCallback(
    (props) => {
      return (
        <TextField
          {...props}
          InputProps={{
            ...props.InputProps,
            margin: 'dense',
            'aria-describedby': instructionId,
            endAdornment: (
              <>
                {isLoading && (
                  <InputAdornment position="end">
                    <CircularProgress
                      aria-label={t(
                        'widgetSelectionDropdown.loading',
                        'Loading widgets…',
                      )}
                      color="inherit"
                      size={20}
                    />
                  </InputAdornment>
                )}
                {props.InputProps.endAdornment}
              </>
            ),
          }}
          label={t('widgetSelectionDropdown.label', 'Widgets')}
          size="medium"
        />
      );
    },
    [instructionId, isLoading, t],
  );

  const renderTags = useCallback(
    (value: AvailableWidget[], getTagProps: AutocompleteRenderGetTagProps) =>
      value.map((option, index) => {
        const { key, ...chipProps } = getTagProps({ index });

        return (
          <Chip
            aria-describedby={tagInstructionId}
            key={key}
            label={option.name}
            {...chipProps}
          />
        );
      }),
    [tagInstructionId],
  );

  const getOptionLabel = useCallback((o: AvailableWidget) => o.name, []);

  const id = useId();
  const availableSelectedWidgets = selectedWidgets
    .map((w) => availableWidgets.find((a) => w === a.id))
    .filter(isDefined);

  return (
    <>
      <Typography aria-hidden id={instructionId} sx={visuallyHidden}>
        {t(
          'widgetSelectionDropdown.instructions',
          '{{selectedCount}} of {{count}} entries selected. Use the left and right arrow keys to navigate between them. Use the up and down arrow key to navigate through the available options.',
          {
            selectedCount: availableSelectedWidgets.length,
            count: availableWidgets.length,
          },
        )}
      </Typography>

      <Typography aria-hidden id={tagInstructionId} sx={visuallyHidden}>
        {t(
          'widgetSelectionDropdown.tagInstructions',
          'Use the backspace key to delete the entry.',
        )}
      </Typography>

      <Autocomplete
        disableCloseOnSelect
        disablePortal
        filterSelectedOptions
        fullWidth
        getOptionLabel={getOptionLabel}
        id={id}
        multiple
        noOptionsText={noResultsMessage}
        onChange={handleOnChange}
        options={availableWidgets}
        renderInput={renderInput}
        renderTags={renderTags}
        sx={{ mt: 1, mb: 0.5 }}
        value={availableSelectedWidgets}
        disabled={disabled}
      />
    </>
  );
}
