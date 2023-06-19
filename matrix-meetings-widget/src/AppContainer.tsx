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

import { WidgetApi } from '@matrix-widget-toolkit/api';
import {
  MuiThemeProvider,
  MuiWidgetApiProvider,
} from '@matrix-widget-toolkit/mui';
import { Suspense } from 'react';
import App from './App';
import { LocalizationProvider } from './components/common/LocalizationProvider';
import { PageLoader } from './components/common/PageLoader';
import { StoreProvider } from './store';

function AppContainer({
  widgetApiPromise,
}: {
  widgetApiPromise: Promise<WidgetApi>;
}) {
  return (
    <MuiThemeProvider>
      <Suspense fallback={<PageLoader />}>
        <LocalizationProvider>
          <MuiWidgetApiProvider
            widgetApiPromise={widgetApiPromise}
            widgetRegistration={{
              name: 'NeoDateFix',
              // "calendar" suffix to get a custom icon
              type: 'net.nordeck.neodatefix:calendar',
            }}
          >
            <StoreProvider>
              <App />
            </StoreProvider>
          </MuiWidgetApiProvider>
        </LocalizationProvider>
      </Suspense>
    </MuiThemeProvider>
  );
}

export default AppContainer;
