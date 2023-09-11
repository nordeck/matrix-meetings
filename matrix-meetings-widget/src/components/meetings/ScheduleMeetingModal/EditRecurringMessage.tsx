/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { Alert, AlertTitle, FormControl, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Props for the {@link EditRecurringMessage} component.
 */
type EditRecurringMessageProps = {
  isEditOne: boolean;
  setIsEditOne: (_: unknown, checked: boolean) => void;
};

/**
 * Show an info message when edit a recurring meeting.
 *
 * @remarks the message include switch to change the edit between one occurrence or all series.
 *
 * @param param0 - {@link EditRecurringMessageProps}
 */
export function EditRecurringMessage({
  isEditOne,
  setIsEditOne,
}: EditRecurringMessageProps) {
  const { t } = useTranslation();

  const title = t(
    'editRecurringMessage.titleOne',
    'Edit the recurring meeting series',
  );

  return (
    <Alert
      role="status"
      icon={false}
      sx={{
        my: 1,
        alignItems: 'center',
        background: (theme) => theme.palette.background.paper,
      }}
      action={
        <FormControl size="small">
          <Switch
            checked={isEditOne}
            onChange={setIsEditOne}
            sx={{ ml: 2 }}
            inputProps={{
              'aria-label': title,
            }}
          />
        </FormControl>
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {t(
        'editRecurringMessage.message',
        'All instances of the recurring meeting are editable',
      )}
    </Alert>
  );
}
