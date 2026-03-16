/*
 * Copyright 2026 Nordeck IT + Consulting GmbH
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

import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import notice from 'eslint-plugin-notice';
import pluginPromise from 'eslint-plugin-promise';
import react from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import path from 'path';
import ts from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default ts.config(
  {
    ignores: ['coverage/', 'dist/'],
  },
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  pluginPromise.configs['flat/recommended'],
  {
    plugins: {
      notice,
    },
    rules: {
      'notice/notice': [
        'error',
        {
          templateFile: path.resolve(
            __dirname,
            '../scripts/license-header.txt',
          ),
          onNonMatchingHeader: 'replace',
          templateVars: { NAME: 'Nordeck IT + Consulting GmbH' },
          varRegexps: { NAME: /.+/ },
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      // Allow unused vars starting with _
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'object-shorthand': 'error',
    },
  },
  {
    ...react.configs.flat.recommended,
    plugins: {
      ...react.configs.flat.recommended.plugins,
      'react-hooks': hooksPlugin,
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      'react/display-name': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: ['**/*.test.*'],
    plugins: {
      vitest,
      'testing-library': testingLibrary,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      ...testingLibrary.configs['flat/react'].rules,
      '@typescript-eslint/ban-ts-comment': 'off',
      'vitest/expect-expect': 'off',
    },
  },
);
