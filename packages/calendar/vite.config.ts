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

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    target: 'es2020',
  },
  build: {
    outDir: 'lib',
    commonjsOptions: {
      strictRequires: true,
    },
  },
  resolve: {
    dedupe: [
      '@matrix-widget-toolkit/react',
      '@mui/material',
      'react',
      'react-dom',
      'react-redux',
    ],
  },
  // Use the env prefix from CRA for backward compatibility.
  envPrefix: 'REACT_APP_',
});
