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
import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { configureStore, createReducer } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { StoreProvider } from './StoreProvider';
import {
  createStore as createStoreMocked,
  initializeStore as initializeStoreMocked,
} from './store';

vi.mock('./store');

const createStore = createStoreMocked as MockedFunction<
  typeof createStoreMocked
>;

const initializeStore = initializeStoreMocked as MockedFunction<
  typeof initializeStoreMocked
>;

describe('StoreProvider', () => {
  const unsubscribe = vi.fn();

  const widgetApi = {} as WidgetApi;
  const store = configureStore({
    reducer: {
      example: createReducer({ title: 'Example' }, () => {}),
    },
  });

  const useAppSelector: TypedUseSelectorHook<
    ReturnType<typeof store.getState>
  > = useSelector;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createStore.mockReturnValue(store as any);
    initializeStore.mockResolvedValue(unsubscribe);
  });

  it('should work', () => {
    const ExampleWidget = () => {
      const value = useAppSelector((state) => state.example.title);
      return <p>{value}</p>;
    };

    render(
      <WidgetApiMockProvider value={{} as WidgetApi}>
        <StoreProvider>
          <ExampleWidget />
        </StoreProvider>
      </WidgetApiMockProvider>,
    );

    expect(screen.getByText(/example/i)).toBeInTheDocument();
    expect(createStore).toBeCalledWith({ widgetApi });
    expect(initializeStore).toBeCalledWith(store);
  });

  it('should unsubscribe on unmount', async () => {
    const { unmount } = render(
      <WidgetApiMockProvider value={{} as WidgetApi}>
        <StoreProvider />
      </WidgetApiMockProvider>,
    );

    // flush promises
    await new Promise(process.nextTick);

    unmount();

    expect(unsubscribe).toBeCalled();
  });
});
