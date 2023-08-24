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

import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { LogService } from 'matrix-bot-sdk';
import { Logger } from 'nestjs-pino';
import { IAppConfiguration } from './IAppConfiguration';
import { StubMatrixBotLogger } from './StubMatrixBotLogger';
import { AppModule } from './app.module';
import { MatrixServer } from './rpc/MatrixServer';

// disables any logging in matrix bot sdk
LogService.setLogger(new StubMatrixBotLogger());

(async function () {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: true,
  });

  app.enableShutdownHooks();
  useContainer(app.select(AppModule), { fallbackOnErrors: true }); // enables injection in validators

  const logger = app.get(Logger);
  app.useLogger(logger);

  logger.log(
    `Bot starting...with level ${
      process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'error'
    }`,
  );

  const matrixServer: MatrixServer = app.get(MatrixServer);
  const microApp = await app.connectMicroservice<MicroserviceOptions>({
    strategy: matrixServer,
  });
  await microApp.listen();

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const config = new DocumentBuilder()
    .setTitle('@nordeck/matrix-meetings-bot')
    .setDescription('Rest endpoints of matrix-meetings-bot')
    .setVersion('0.0.1')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const appConfig = app
    .get(ConfigService)
    .getOrThrow<IAppConfiguration>('config');

  const port = appConfig.port ?? 3000;

  logger.log(`Bot starting on port ${port}`);

  await app.listen(port);
})();
