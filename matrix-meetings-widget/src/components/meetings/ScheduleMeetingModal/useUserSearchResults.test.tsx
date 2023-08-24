/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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
import { renderHook } from '@testing-library/react-hooks';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { useUserSearchResults } from './useUserSearchResults';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('useUserSearchResults', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(async () => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should return search results', async () => {
    widgetApi.searchUserDirectory.mockResolvedValue({
      results: [
        {
          userId: '@user-1',
          displayName: undefined,
          avatarUrl: undefined,
        },
      ],
    });

    const { result, waitForValueToChange } = renderHook(
      () => useUserSearchResults('user', 10),
      { wrapper: Wrapper },
    );

    expect(result.current).toEqual({
      loading: true,
      results: [],
      error: undefined,
    });

    await waitForValueToChange(() => result.current.loading);

    expect(result.current).toEqual({
      loading: false,
      results: [
        {
          userId: '@user-1',
          displayName: undefined,
          avatarUrl: undefined,
        },
      ],
      error: undefined,
    });
  });

  it.each(['', '  '])(
    'should not search for empty input: "%s"',
    async (input) => {
      const { result } = renderHook(() => useUserSearchResults(input, 10), {
        wrapper: Wrapper,
      });

      expect(result.current).toEqual({
        loading: false,
        results: [],
        error: undefined,
      });

      expect(widgetApi.searchUserDirectory).toBeCalledTimes(0);
    },
  );

  it('should return error', async () => {
    widgetApi.searchUserDirectory.mockRejectedValue(new Error('unexpected'));

    const { result, waitForValueToChange } = renderHook(
      () => useUserSearchResults('user', 10),
      { wrapper: Wrapper },
    );

    expect(result.current).toEqual({
      loading: true,
      results: [],
      error: undefined,
    });

    await waitForValueToChange(() => result.current.loading);

    expect(result.current).toEqual({
      loading: false,
      results: [],
      error: expect.objectContaining({ message: 'unexpected' }),
    });
  });
});
