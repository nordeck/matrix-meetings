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

import { TextField } from '@mui/material';
import { ReactElement } from 'react';
import { CopyableTextButton } from '../../common/CopyableTextButton';

export function CopyableText({
  text,
  label,
  multiline,
}: {
  text: string;
  label: string;
  multiline?: boolean;
}): ReactElement {
  return (
    <TextField
      InputProps={{
        readOnly: true,
        endAdornment: <CopyableTextButton text={text} />,
      }}
      fullWidth
      label={label}
      margin="normal"
      multiline={multiline}
      size="medium"
      value={text}
    />
  );
}
