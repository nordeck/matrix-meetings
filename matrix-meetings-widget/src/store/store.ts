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
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { meetingBotApi } from '../reducer/meetingBotApi';
import { initializeMeetingsApi, meetingsApi } from '../reducer/meetingsApi';

type CreateStoreOpts = {
  widgetApi: WidgetApi;
};

export function initializeStore(store: StoreType): Promise<() => void> {
  const { dispatch } = store;

  return initializeMeetingsApi(dispatch);
}

export function createStore(opts: CreateStoreOpts) {
  const { widgetApi } = opts;

  const store = configureStore({
    reducer: {
      [meetingBotApi.reducerPath]: meetingBotApi.reducer,
      [meetingsApi.reducerPath]: meetingsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            widgetApi,
          } as ThunkExtraArgument,
        },
      })
        .concat(meetingBotApi.middleware)
        .concat(meetingsApi.middleware),
  });

  return store;
}

/**
 * Extra arguments that are provided to `createAsyncThunk`
 */
export type ThunkExtraArgument = {
  widgetApi: WidgetApi;
};

type StoreType = ReturnType<typeof createStore>;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<StoreType['getState']>;
export type AppDispatch = StoreType['dispatch'];

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * The specific type of the `ThunkApiConfig` that can be used with `createAsyncThunk`
 */
export type StateThunkConfig = {
  /** return type for `thunkApi.getState` */
  state: RootState;
  /** type of the `extra` argument for the thunk middleware, which will be passed in as `thunkApi.extra` */
  extra: ThunkExtraArgument;
};
