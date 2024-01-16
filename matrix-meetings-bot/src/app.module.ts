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

import {
  FactoryProvider,
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';
import {
  ICryptoStorageProvider,
  IStorageProvider,
  MatrixClient,
  RustSdkCryptoStorageProvider,
  SimpleFsStorageProvider,
  UserID,
} from 'matrix-bot-sdk';
import { LoggerModule } from 'nestjs-pino';
import path from 'path';
import { v4 as uuiv4 } from 'uuid';
import { AppRuntimeContext } from './AppRuntimeContext';
import { EventContentRenderer } from './EventContentRenderer';
import { IAppConfiguration } from './IAppConfiguration';
import { ModuleProviderToken } from './ModuleProviderToken';
import { JitsiClient } from './client/JitsiClient';
import { MeetingClient } from './client/MeetingClient';
import { ReactionClient } from './client/ReactionClient';
import { WidgetClient } from './client/WidgetClient';
import configuration, { ValidationSchema } from './configuration';
import { CommandController } from './controller/CommandController';
import { ConfigurationController } from './controller/ConfigurationController';
import { GuestMemberController } from './controller/GuestMemberController';
import { HealthCheckController } from './controller/HealthCheckController';
import { MeetingController } from './controller/MeetingController';
import { WelcomeWorkflowController } from './controller/WelcomeWorkflowController';
import { WidgetController } from './controller/WidgetController';
import { registerDateRangeFormatter } from './dateRangeFormatter';
import { RoomMatrixEventsReader } from './io/RoomMatrixEventsReader';
import { WidgetLayoutConfigReader } from './io/WidgetLayoutConfigReader';
import { MatrixClientProxyHandler } from './matrix/MatrixClientProxyHandler';
import {
  AutojoinRoomsMixin,
  AutojoinUpgradedRoomsMixin,
} from './matrix/mixins';
import { MatrixAuthMiddleware } from './middleware/MatrixAuthMiddleware';
import { IRoomMatrixEvents } from './model/IRoomMatrixEvents';
import { MatrixServer } from './rpc/MatrixServer';
import { CommandService } from './service/CommandService';
import { ControlRoomMigrationService } from './service/ControlRoomMigrationService';
import { GuestMemberService } from './service/GuestMemberService';
import { MeetingService } from './service/MeetingService';
import { RoomMessageService } from './service/RoomMessageService';
import { WelcomeWorkflowService } from './service/WelcomeWorkflowService';
import { WidgetLayoutService } from './service/WidgetLayoutService';
import { DoesWidgetWithIdExistConstraint } from './validator/DoesWidgetWithIdExist';

const logger = new Logger('app.module');

const appConfigurationFactory: FactoryProvider<IAppConfiguration> = {
  provide: ModuleProviderToken.APP_CONFIGURATION,
  useFactory: (configService: ConfigService) => {
    const appConfiguration = configService.get<IAppConfiguration>('config');
    if (appConfiguration) {
      return appConfiguration;
    } else {
      throw new Error('Cannot load configuration');
    }
  },
  inject: [ConfigService],
};

const roomMatrixEventsFactory: FactoryProvider<IRoomMatrixEvents> = {
  provide: ModuleProviderToken.ROOM_MATRIX_EVENTS,
  useFactory: (appConfiguration: IAppConfiguration) => {
    return new RoomMatrixEventsReader(
      appConfiguration.default_events_config,
    ).read();
  },
  inject: [ModuleProviderToken.APP_CONFIGURATION],
};

const widgetLayoutConfigFactory: FactoryProvider = {
  provide: ModuleProviderToken.WIDGET_LAYOUTS,
  useFactory: (appConfiguration: IAppConfiguration) => {
    return new WidgetLayoutConfigReader(
      appConfiguration.default_widget_layouts_config,
    ).read();
  },
  inject: [ModuleProviderToken.APP_CONFIGURATION],
};

const matrixClientFactoryHelper = {
  createStorageProvider: async (
    appConfig: IAppConfiguration,
  ): Promise<IStorageProvider> => {
    const storage = new SimpleFsStorageProvider(
      path.join(appConfig.data_path, appConfig.data_filename),
    );

    logger.log(
      `createStorageProvider.filepath: ${appConfig.data_path}/${appConfig.data_filename}`,
    );

    return storage;
  },

  createCryptoStorageProvider: async (
    appConfig: IAppConfiguration,
  ): Promise<ICryptoStorageProvider> => {
    const cryptoStorage = new RustSdkCryptoStorageProvider(
      path.join(appConfig.data_path, appConfig.crypto_data_path),
    );

    logger.log(
      `createCryptoStorageProvider.filepath: ${appConfig.data_path}/${appConfig.crypto_data_path}`,
    );

    return cryptoStorage;
  },

  getServer: (appConfig: IAppConfiguration) => ({
    accessToken: appConfig.access_token,
    url: appConfig.homeserver_url,
  }),
};

const matrixClientFactory: FactoryProvider<Promise<MatrixClient>> = {
  provide: MatrixClient,
  useFactory: async (appConfig: IAppConfiguration): Promise<MatrixClient> => {
    const storage: IStorageProvider =
      await matrixClientFactoryHelper.createStorageProvider(appConfig);

    let cryptoStorage: ICryptoStorageProvider | undefined = undefined;

    if (appConfig.enable_crypto) {
      cryptoStorage =
        await matrixClientFactoryHelper.createCryptoStorageProvider(appConfig);
    }

    // create server object
    const server = matrixClientFactoryHelper.getServer(appConfig);
    // create matrix client
    const client = new MatrixClient(
      server.url,
      server.accessToken,
      storage,
      cryptoStorage,
    );

    // the 'room.archived' event listeners
    AutojoinUpgradedRoomsMixin.setupOnClient(client);

    // if we don't use the welcome service, then setup the autojoin mixin from the bot SDK
    if (!appConfig.enable_welcome_workflow) {
      AutojoinRoomsMixin.setupOnClient(client);
      logger.log('Welcome Workflow is disabled ');
    }

    return new Proxy<MatrixClient>(client, new MatrixClientProxyHandler());
  },
  inject: [ModuleProviderToken.APP_CONFIGURATION],
};

const appRuntimeContextFactory: FactoryProvider<Promise<AppRuntimeContext>> = {
  provide: AppRuntimeContext,
  useFactory: async (client: MatrixClient): Promise<AppRuntimeContext> => {
    const userId = await client.getUserId();
    const localpart = new UserID(userId).localpart;

    let displayName;
    try {
      const profile = await client.getUserProfile(userId);
      if (profile?.membershipEventContent.displayname) {
        displayName = profile.membershipEventContent.displayname;
      } else {
        displayName = localpart; // for sanity
      }
    } catch (_err) {
      displayName = localpart;
    }
    return new AppRuntimeContext(userId, displayName, localpart, ['en', 'de']);
  },
  inject: [MatrixClient],
};

const i18nFactory: FactoryProvider<void> = {
  provide: ModuleProviderToken.I18N,
  useFactory: (appRuntimeContext: AppRuntimeContext): void => {
    i18next
      .use(i18nextFsBackend)
      .use(i18nextMiddleware.LanguageDetector)
      .init({
        fallbackLng: 'en',
        backend: {
          loadPath: `${__dirname}/static/locales/{{lng}}/{{ns}}.json`,
        },
        debug: false,
        saveMissing: true,
        detection: {
          order: ['header', 'querystring', 'cookie'],
          caches: ['cookie'],
        },
        preload: appRuntimeContext.supportedLngs,
      });
    registerDateRangeFormatter(i18next);
  },
  inject: [AppRuntimeContext],
};

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: ValidationSchema,
      envFilePath: ['.env.local', '.env.dev', '.env'],
      load: [configuration],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'error',
        genReqId(_req) {
          return uuiv4();
        },
        redact: ['req.headers.authorization', 'matrix_event.content'],
      },
    }),
  ],
  controllers: [
    CommandController,
    ConfigurationController,
    HealthCheckController,
    MeetingController,
    WelcomeWorkflowController,
    WidgetController,
    GuestMemberController,
  ],

  providers: [
    appConfigurationFactory,
    roomMatrixEventsFactory,
    widgetLayoutConfigFactory,
    matrixClientFactory,
    appRuntimeContextFactory,
    i18nFactory,
    EventContentRenderer,
    JitsiClient,
    MeetingClient,
    ReactionClient,
    WidgetClient,
    CommandService,
    MeetingService,
    RoomMessageService,
    WelcomeWorkflowService,
    ControlRoomMigrationService,
    WidgetLayoutService,
    MatrixServer,
    DoesWidgetWithIdExistConstraint,
    GuestMemberService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MatrixAuthMiddleware).forRoutes('*');
  }
}
