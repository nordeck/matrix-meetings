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

import { Button } from '@mui/material';
import { DispatchWithoutAction, PropsWithChildren } from 'react';
import { useGetConfigurationQuery } from '../../../../../reducer/meetingBotApi';
import {
  OpenXChangeExternalReference,
  buildOpenXChangeLink,
} from './openXchange';

type OpenXchangeButtonProps = {
  color?: string;
  reference: OpenXChangeExternalReference;
  onClick?: DispatchWithoutAction;
};

export function OpenXchangeButton({
  children,
  color,
  reference,
  onClick,
}: PropsWithChildren<OpenXchangeButtonProps>) {
  const {
    data: config,
    isLoading: isLoadingConfiguration,
    isError: isErrorConfiguration,
  } = useGetConfigurationQuery();

  const urlTemplate = config?.openXChange?.meetingUrlTemplate;

  return (
    <Button
      component="a"
      disabled={!urlTemplate || isLoadingConfiguration || isErrorConfiguration}
      href={urlTemplate && buildOpenXChangeLink(reference, urlTemplate)}
      onClick={onClick}
      rel="noreferrer"
      sx={{ color }}
      target="_blank"
    >
      {children}
    </Button>
  );
}
