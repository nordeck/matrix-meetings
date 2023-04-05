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

import { extractRawWidgetParameters } from '@matrix-widget-toolkit/api';
import { getEnvironment } from '@matrix-widget-toolkit/mui';
import {
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import Joi from 'joi';
import { ThunkExtraArgument } from '../../store';
import {
  AvailableWidget,
  MeetingsBotConfiguration,
  MeetingSharingInformation,
} from './types';

type ConfigurationResponse = {
  jitsiDialInEnabled?: boolean;
  openXchangeMeetingUrlTemplate?: string;
};

const configurationResponseSchema = Joi.object<ConfigurationResponse, true>({
  jitsiDialInEnabled: Joi.boolean().strict().optional(),
  openXchangeMeetingUrlTemplate: Joi.string().optional(),
}).unknown();

type AvailableWidgetsReponse = { id: string; name: string }[];

const availableWidgetsReponseSchema =
  Joi.array<AvailableWidgetsReponse>().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      optional: Joi.boolean(),
    }).unknown()
  );

type MeetingSharingInformationResponse = {
  jitsi_dial_in_number?: string;
  jitsi_pin?: number;
};

const meetingSharingInformationResponseSchema = Joi.object<
  MeetingSharingInformationResponse,
  true
>({
  jitsi_dial_in_number: Joi.string().optional(),
  jitsi_pin: Joi.number().strict().optional(),
}).unknown();

export const meetingBotApi = createApi({
  reducerPath: 'meetingBotApi',
  baseQuery: fetchBaseQuery({
    baseUrl:
      // also support reading the url from the parameters as provided by the e2e test
      extractRawWidgetParameters()['meetings_bot_base_url'] ??
      getEnvironment('REACT_APP_API_BASE_URL'),
    prepareHeaders: async (headers, { extra }) => {
      const { widgetApi } = extra as ThunkExtraArgument;

      const credentials = await widgetApi.requestOpenIDConnectToken();

      if (credentials) {
        const { matrix_server_name, access_token } = credentials;

        const t = {
          matrix_server_name,
          access_token,
        };

        headers.set('authorization', `MX-Identity ${btoa(JSON.stringify(t))}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    getConfiguration: builder.query<MeetingsBotConfiguration, void>({
      queryFn: async (_, __, ___, fetch) => {
        const response = await fetch({ url: '/v1/config' });

        if (response.data) {
          try {
            const data = await configurationResponseSchema.validateAsync(
              response.data
            );

            return {
              data: {
                jitsi: {
                  dialInEnabled: data.jitsiDialInEnabled ?? false,
                },
                openXChange: data.openXchangeMeetingUrlTemplate
                  ? {
                      meetingUrlTemplate: data.openXchangeMeetingUrlTemplate,
                    }
                  : undefined,
              },
            };
          } catch (e) {
            return {
              error: {
                error: e.message,
                status: 'PARSING_ERROR',
                originalStatus: response.meta?.response?.status ?? 0,
                data: response.data,
              } as FetchBaseQueryError,
            };
          }
        }

        return { error: response.error as FetchBaseQueryError };
      },
    }),

    getAvailableWidgets: builder.query<AvailableWidget[], void>({
      queryFn: async (_, __, ___, fetch) => {
        const response = await fetch({ url: '/v1/widget/list' });

        if (response.data) {
          try {
            const data = await availableWidgetsReponseSchema.validateAsync(
              response.data
            );

            return { data };
          } catch (e) {
            return {
              error: {
                error: e.message,
                status: 'PARSING_ERROR',
                originalStatus: response.meta?.response?.status ?? 0,
                data: response.data,
              } as FetchBaseQueryError,
            };
          }
        }

        return { error: response.error as FetchBaseQueryError };
      },
    }),

    getMeetingSharingInformation: builder.query<
      MeetingSharingInformation,
      { roomId: string }
    >({
      queryFn: async ({ roomId }, _, __, fetch) => {
        const response = await fetch({
          url: `/v1/meeting/${encodeURIComponent(roomId)}/sharingInformation`,
        });

        if (response.data) {
          try {
            const data =
              await meetingSharingInformationResponseSchema.validateAsync(
                response.data
              );

            return {
              data: {
                jitsi: {
                  dialInNumber: data.jitsi_dial_in_number,
                  pin: data.jitsi_pin,
                },
              },
            };
          } catch (e) {
            return {
              error: {
                error: e.message,
                status: 'PARSING_ERROR',
                originalStatus: response.meta?.response?.status ?? 0,
                data: response.data,
              } as FetchBaseQueryError,
            };
          }
        }

        return { error: response.error as FetchBaseQueryError };
      },
    }),
  }),
});

export const {
  useGetAvailableWidgetsQuery,
  useGetConfigurationQuery,
  useGetMeetingSharingInformationQuery,
} = meetingBotApi;
