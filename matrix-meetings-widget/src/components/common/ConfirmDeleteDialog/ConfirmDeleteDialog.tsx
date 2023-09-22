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

import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import React, {
  DispatchWithoutAction,
  PropsWithChildren,
  ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';

type ConfirmDeleteDialogProps = PropsWithChildren<{
  open: boolean;
  title: string;
  description: string;
  confirmTitle: string;
  loading?: boolean;
  additionalButtons?: ReactElement;
  onCancel: DispatchWithoutAction;
  onConfirm: DispatchWithoutAction;
  onEnter?: DispatchWithoutAction;
}>;

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmTitle,
  loading,
  additionalButtons,
  onCancel,
  onConfirm,
  onEnter,
  children,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  return (
    <Dialog
      aria-describedby={dialogDescriptionId}
      aria-labelledby={dialogTitleId}
      onClose={onCancel}
      open={open}
      onTransitionEnter={onEnter}
    >
      <DialogTitle id={dialogTitleId}>{title}</DialogTitle>

      <DialogContent>
        <DialogContentText
          id={dialogDescriptionId}
          paragraph={React.Children.toArray(children).length > 0}
        >
          {description}
        </DialogContentText>
        {children}
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={onCancel} variant="outlined">
          {t('cancel', 'Cancel')}
        </Button>

        {additionalButtons}

        <LoadingButton
          color="error"
          loading={loading}
          onClick={onConfirm}
          variant="contained"
        >
          {confirmTitle}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
