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

import { Box } from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import { CockpitPanel } from './components/cockpit/CockpitPanel';
import { MeetingsPanel } from './components/meetings/MeetingsPanel';
import {
  ScheduleMeetingModal,
  SCHEDULE_MEETING_MODAL_ROUTE,
} from './components/meetings/ScheduleMeetingModal';
import {
  SetupBreakoutSessionsModal,
  SETUP_BREAKOUT_SESSIONS_MODAL_ROUTE,
} from './components/meetings/SetupBreakoutSessionsModal';

function App() {
  return (
    <Box height="100vh">
      <Routes>
        <Route element={<MeetingsPanel />} index path="/" />
        <Route
          element={<ScheduleMeetingModal />}
          path={SCHEDULE_MEETING_MODAL_ROUTE}
        />
        <Route
          element={<SetupBreakoutSessionsModal />}
          path={SETUP_BREAKOUT_SESSIONS_MODAL_ROUTE}
        />
        <Route element={<CockpitPanel />} path="/cockpit" />
      </Routes>
    </Box>
  );
}

export default App;
