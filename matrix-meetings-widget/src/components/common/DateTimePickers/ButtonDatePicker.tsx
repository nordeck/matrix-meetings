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

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button } from '@mui/material';
import {
  BaseSingleInputFieldProps,
  DatePicker,
  DatePickerProps,
  FieldSection,
} from '@mui/x-date-pickers';
import moment from 'moment';
import { DispatchWithoutAction } from 'react';

type ButtonFieldProps = BaseSingleInputFieldProps<
  moment.Moment | null,
  moment.Moment,
  FieldSection,
  unknown
> & {
  open?: boolean;
  onOpen?: DispatchWithoutAction;
  onClose?: DispatchWithoutAction;
};

function ButtonField(props: ButtonFieldProps) {
  const {
    id,
    open,
    onOpen,
    onClose,
    label,
    disabled,
    InputProps: { ref } = {},
    inputProps: { 'aria-label': ariaLabel } = {},
  } = props;

  return (
    <Button
      id={`${id}-label`}
      disabled={disabled}
      ref={ref}
      aria-label={ariaLabel}
      endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      onClick={() => (open ? onClose?.() : onOpen?.())}
    >
      {label}
    </Button>
  );
}

export function ButtonDatePicker(props: DatePickerProps<moment.Moment>) {
  const { open, onClose, onOpen } = props;
  return (
    <DatePicker
      {...props}
      slots={{ field: ButtonField, ...props.slots }}
      slotProps={{
        ...props.slotProps,
        field: {
          ...props.slotProps?.field,
          open,
          onOpen,
          onClose,
        } as ButtonFieldProps,
      }}
    />
  );
}
