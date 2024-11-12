/*
 * Copyright 2024 Nordeck IT + Consulting GmbH
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

/// <reference types="vitest" />

import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    alias: {
      // solve "You are loading @emotion/react when it is already loaded…" issue
      '@emotion/react': path.resolve(
        '../node_modules/@emotion/react/dist/emotion-react.cjs.mjs',
      ),
    },
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    exclude: ['build', 'lib'],
    server: {
      deps: {
        inline: [
          '@matrix-widget-toolkit/api',
          '@matrix-widget-toolkit/react',
          '@matrix-widget-toolkit/mui',
          '@nordeck/matrix-meetings-calendar',
        ],
      },
    },
  },
});
