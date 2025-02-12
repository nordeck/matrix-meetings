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

import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
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
import {
  mockConfigEndpoint,
  mockMeetingSharingInformationEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { useJitsiDialInInformation } from './useJitsiDialInInformation';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('useJitsiDialInInformation', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(async () => {
    mockConfigEndpoint(server, { jitsiDialInEnabled: true });
    mockMeetingSharingInformationEndpoint(server, {
      jitsi_dial_in_number: '0123',
    });

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });
      return <Provider store={store}>{children}</Provider>;
    };

    widgetApi.requestOpenIDConnectToken.mockResolvedValue({
      access_token: 'access_token',
      matrix_server_name: 'matrix_server_name',
    });
  });

  it('should skip jitsi information', async () => {
    mockConfigEndpoint(server);

    const { result } = renderHook(() => useJitsiDialInInformation('!room'), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({
      isLoading: true,
      isError: false,
    });

    const isLoading = result.current.isLoading;
    await waitFor(() => {
      expect(isLoading).not.toBe(result.current.isLoading);
    });

    expect(result.current).toEqual({
      isLoading: false,
      isError: false,
      data: {},
    });
  });

  it('should return jitsi information', async () => {
    const { result } = renderHook(() => useJitsiDialInInformation('!room'), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({
      isLoading: true,
      isError: false,
    });

    const isLoading = result.current.isLoading;
    await waitFor(() => {
      expect(isLoading).not.toBe(result.current.isLoading);
    });

    expect(result.current).toEqual({
      isLoading: false,
      isError: false,
      data: {
        dialInNumber: '0123',
      },
    });
  });

  it('should return error from config', async () => {
    server.use(
      rest.get('http://localhost/v1/config', (_, res, ctx) =>
        res(ctx.status(500)),
      ),
    );

    const { result } = renderHook(() => useJitsiDialInInformation('!room'), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({
      isLoading: true,
      isError: false,
    });

    const isLoading = result.current.isLoading;
    await waitFor(() => {
      expect(isLoading).not.toBe(result.current.isLoading);
    });

    expect(result.current).toEqual({
      isLoading: false,
      isError: true,
    });
  });

  it('should return error from information', async () => {
    server.use(
      rest.get(
        'http://localhost/v1/meeting/:room/sharingInformation',
        (_, res, ctx) => res(ctx.status(500)),
      ),
    );

    const { result } = renderHook(() => useJitsiDialInInformation('!room'), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({
      isLoading: true,
      isError: false,
    });

    await waitFor(() => result.current.isLoading);

    expect(result.current).toEqual({
      isLoading: false,
      isError: true,
    });
  });
});
