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

import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LocalizationProvider } from './components/common/LocalizationProvider';
import { MockedWidgetApi, mockWidgetApi } from './lib/mockWidgetApi';
import { StoreProvider } from './store';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('App', () => {
  it('renders without exploding', () => {
    render(
      <LocalizationProvider>
        <WidgetApiMockProvider value={widgetApi}>
          <StoreProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </StoreProvider>
        </WidgetApiMockProvider>
      </LocalizationProvider>,
    );
  });
});
