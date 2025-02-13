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

import { randomBytes } from 'crypto';
import { readFile } from 'fs/promises';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

let container: StartedTestContainer | undefined;

function randB64Bytes(numBytes: number): string {
  return randomBytes(numBytes).toString('base64').replace(/=*$/, '');
}

export async function startSynapse({
  containerImage = 'matrixdotorg/synapse:v1.123.0',
}: { containerImage?: string } = {}): Promise<{
  synapseUrl: string;
  synapseHostUrl: string;
  registrationSecret: string;
}> {
  console.log(`Starting synapse… (${containerImage})`);

  const registrationSecret = randB64Bytes(16);
  const macaroonSecret = randB64Bytes(16);
  const formSecret = randB64Bytes(16);
  const signingKey = `ed25519 x ${randB64Bytes(32)}`;

  const homeserverConfigTemplate = await readFile(
    require.resolve('./homeserver.yaml'),
    'utf-8',
  );
  const homeserverConfig = homeserverConfigTemplate
    .replace(/{{REGISTRATION_SECRET}}/g, registrationSecret)
    .replace(/{{MACAROON_SECRET_KEY}}/g, macaroonSecret)
    .replace(/{{FORM_SECRET}}/g, formSecret);

  container = await new GenericContainer(containerImage)
    .withCopyFilesToContainer([
      {
        source: require.resolve('./log.config'),
        target: '/data/log.config',
      },
    ])
    .withCopyContentToContainer([
      {
        target: '/data/homeserver.yaml',
        content: homeserverConfig,
      },
      {
        target: '/data/localhost.signing.key',
        content: signingKey,
      },
    ])
    .withTmpFs({ '/data/media_store': 'rw,mode=777' })
    .withExposedPorts(8008)
    .withHealthCheck({
      test: ['CMD-SHELL', 'curl -f http://localhost:8008/health || exit 1'],
      interval: 1000,
      timeout: 3000,
      retries: 20,
      startPeriod: 1000,
    })
    .withWaitStrategy(Wait.forHealthCheck())
    .start();

  const synapseUrl = `http://${container.getHost()}:${container.getMappedPort(
    8008,
  )}`;
  const ipAddress = getIpAddress(container);
  const synapseHostUrl = `http://${ipAddress}:8008`;

  console.log('Synapse running at', synapseUrl);

  return { synapseUrl, synapseHostUrl, registrationSecret };
}

export async function stopSynapse() {
  if (container) {
    await container.stop();

    console.log('Stopped synapse');
  }
}

function getIpAddress(container: StartedTestContainer): string {
  try {
    // First try to return the Docker IP address
    return container.getIpAddress('bridge');
  } catch {
    // Ignore
  }

  // Try the Podman IP address otherwise
  return container.getIpAddress('podman');
}
