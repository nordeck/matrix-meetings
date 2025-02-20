/*
 * Copyright 2025 Nordeck IT + Consulting GmbH
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

import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react-swc';
import { PluginOption, defineConfig } from 'vite';

const plugins: [PluginOption] = [react() as PluginOption];

if (process.env.VITE_DEV_SSL === 'true') {
  plugins.push(basicSsl() as PluginOption);
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    commonjsOptions: {
      strictRequires: true,
    },
  },
  resolve: {
    dedupe: [
      '@matrix-widget-toolkit/mui',
      '@matrix-widget-toolkit/react',
      '@mui/material',
      'i18next',
      'i18next-browser-languagedetector',
      'react',
      'react-18next',
      'react-dom',
      'react-redux',
    ],
  },
  plugins,
  // Use the env prefix from CRA for backward compatibility.
  envPrefix: 'REACT_APP_',
});
