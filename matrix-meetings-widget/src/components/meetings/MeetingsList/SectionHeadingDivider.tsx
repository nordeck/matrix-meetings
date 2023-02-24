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

import { Box, Divider, Typography } from '@mui/material';
import { ellipsis } from '../../../lib/ellipsis';

type SectionHeadingDividerProps = {
  id?: string;
  title: string;
};

export function SectionHeadingDivider({
  id,
  title,
}: SectionHeadingDividerProps) {
  return (
    <Box
      bgcolor="background.default"
      position="sticky"
      pt={1}
      px={1}
      top={-1}
      zIndex={2}
    >
      <Typography
        component="h4"
        id={id}
        mb={1}
        sx={ellipsis}
        textAlign="center"
        variant="h5"
      >
        {title}
      </Typography>

      <Divider />
    </Box>
  );
}
