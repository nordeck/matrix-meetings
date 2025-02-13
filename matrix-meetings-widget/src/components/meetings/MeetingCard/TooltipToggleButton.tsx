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

import ToggleButton, { ToggleButtonProps } from '@mui/material/ToggleButton';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import { forwardRef } from 'react';

type TooltipToggleButtonProps = ToggleButtonProps & {
  TooltipProps: Omit<TooltipProps, 'children'>;

  /**
   * The id of the section that is enabled/disabled by this toggle button.
   * If present, the toggle button will set the `aria-expanded` and
   * `aria-controls` attributes.
   */
  expandedId?: string;
};

// Catch props and forward to ToggleButton
export const TooltipToggleButton = forwardRef<
  HTMLButtonElement,
  TooltipToggleButtonProps
>(({ TooltipProps, expandedId, ...props }, ref) => {
  const { selected } = props;
  return (
    <Tooltip {...TooltipProps}>
      <ToggleButton
        aria-controls={selected ? expandedId : undefined}
        aria-expanded={expandedId ? selected : undefined}
        ref={ref}
        {...props}
      />
    </Tooltip>
  );
});
