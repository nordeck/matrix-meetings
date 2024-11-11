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
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { mockConfigEndpoint } from '../../../../../lib/testUtils';
import { createStore } from '../../../../../store';
import { initializeStore } from '../../../../../store/store';
import { OpenXchangeButton } from './OpenXchangeButton';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<OpenXchangeButton/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockConfigEndpoint(server);

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });

      return (
        <Provider store={store}>
          <WidgetApiMockProvider value={widgetApi}>
            {children}
          </WidgetApiMockProvider>
        </Provider>
      );
    };
  });

  it('should have no accessibility violations, if button is active', async () => {
    mockConfigEndpoint(server, {
      jitsiDialInEnabled: true,
      openXchangeMeetingUrlTemplate:
        'https://ox.io/appsuite/#app=io.ox/calendar&id={{id}}&folder={{folder}}',
    });

    const { container } = render(
      <OpenXchangeButton
        reference={{ folder: 'cal://0/31', id: 'cal://0/31.1.0' }}
      >
        Edit
      </OpenXchangeButton>,
      { wrapper: Wrapper },
    );

    const linkEl = await screen.findByRole('button', { name: 'Edit' });

    await waitFor(() =>
      expect(linkEl).toHaveAttribute(
        'href',
        'https://ox.io/appsuite/#app=io.ox/calendar&id=cal://0/31.1.0&folder=cal://0/31',
      ),
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if button is disabled', async () => {
    const { container } = render(
      <OpenXchangeButton
        reference={{ folder: 'cal://0/31', id: 'cal://0/31.1.0' }}
      >
        Edit
      </OpenXchangeButton>,
      { wrapper: Wrapper },
    );

    await expect(
      screen.findByRole('button', { name: /edit/i }),
    ).resolves.toBeInTheDocument();

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should render button if external reference is present', async () => {
    mockConfigEndpoint(server, {
      jitsiDialInEnabled: true,
      openXchangeMeetingUrlTemplate:
        'https://ox.io/appsuite/#app=io.ox/calendar&id={{id}}&folder={{folder}}',
    });

    render(
      <OpenXchangeButton
        reference={{ folder: 'cal://0/31', id: 'cal://0/31.1.0' }}
      >
        Edit
      </OpenXchangeButton>,
      { wrapper: Wrapper },
    );

    const linkEl = await screen.findByRole('button', { name: 'Edit' });

    await waitFor(() =>
      expect(linkEl).toHaveAttribute(
        'href',
        'https://ox.io/appsuite/#app=io.ox/calendar&id=cal://0/31.1.0&folder=cal://0/31',
      ),
    );
    expect(linkEl).not.toBeDisabled();
  });

  it('should skip if missing url template', async () => {
    render(
      <OpenXchangeButton
        reference={{
          folder: 'cal://0/31',
          id: 'cal://0/31.1.0',
        }}
      >
        Edit
      </OpenXchangeButton>,
      { wrapper: Wrapper },
    );

    const linkEl = await screen.findByRole('button', { name: 'Edit' });

    expect(linkEl).toHaveAttribute('aria-disabled', 'true');
  });
});
