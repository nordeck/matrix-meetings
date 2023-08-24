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

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Chip, keyframes, SxProps, Theme, Typography } from '@mui/material';
import { AriaAttributes, useCallback, useEffect, useState } from 'react';
import { useInterval } from 'react-use';
import {
  getTimeDistanceState,
  TimeDistanceState,
} from './getTimeDistanceState';

const flash = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const rotation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(359deg); }
`;

type TimeDistanceProps = {
  startDate: string;
  endDate: string;
  sx?: SxProps<Theme>;
};

export const TimeDistance = ({
  startDate: date,
  endDate,
  sx,
}: TimeDistanceProps) => {
  const update = useCallback(
    () =>
      getTimeDistanceState({
        now: new Date().toISOString(),
        startDate: date,
        endDate,
      }),
    [date, endDate],
  );

  const [timeDistance, setTimeDistance] = useState(update);

  useEffect(() => {
    setTimeDistance(update);
  }, [update]);

  useInterval(() => {
    setTimeDistance(update);
  }, timeDistance.updateInterval);

  return (
    <>
      {timeDistance.renderLabel && (
        <>
          <TimeDistanceComponent
            // this component renders the actual label
            state={timeDistance}
            sx={sx}
          />
        </>
      )}
    </>
  );
};

function TimeDistanceComponent({
  state,
  sx,
  ...ariaAttributes
}: AriaAttributes & {
  state: Extract<TimeDistanceState, { renderLabel: true }>;
  sx?: SxProps<Theme>;
}) {
  return (
    <Chip
      {...ariaAttributes}
      avatar={<AccessTimeIcon />}
      label={
        <Typography
          component="span"
          fontSize="inherit"
          sx={{
            display: 'block',
            fontWeight: 'bold',
            animation: state.animated
              ? `${flash} 1s ease-in-out infinite`
              : undefined,
            animationFillMode: 'both',
            fontVariantNumeric: 'tabular-nums',
          }}
          variant="body2"
        >
          {state.labelText}
        </Typography>
      }
      size="small"
      sx={{
        '& .MuiChip-avatar': {
          color: 'inherit',
          height: 12,
          width: 12,
        },

        '& .MuiSvgIcon-root': {
          animation: state.rotateIcon
            ? `${rotation} 2s infinite linear`
            : undefined,
        },

        '& .MuiChip-label': {
          px: 2,
        },

        bgcolor: `${state.labelColor}.main`,
        color: `${state.labelColor}.contrastText`,
        borderRadius: 0.5,
        borderEndEndRadius: 0,
        borderStartEndRadius: 0,
        height: 18,

        position: 'absolute',
        right: '-1.2em',
        fontSize: '0.6rem',

        '&:after': {
          content: '""',
          borderColor: 'transparent',
          borderStyle: 'solid',
          borderTopColor: `${state.labelColor}.dark`,
          borderWidth: '1.2em 1.2em 0 0',
          position: 'absolute',
          top: '100%',
          right: 0,
          transition: (theme) => theme.transitions.create(['border-color']),
        },

        ...sx,
      }}
      variant="filled"
    />
  );
}
