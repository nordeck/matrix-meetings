/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import path from 'path';

const __dirname = path.dirname(__filename);

export default {
  plugins: ['promise', 'notice'],
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:promise/recommended',
    'eslint:recommended',
    'prettier',
  ],
  rules: {
    'notice/notice': [
      'error',
      {
        templateFile: path.resolve(__dirname, './scripts/license-header.txt'),
        onNonMatchingHeader: 'replace',
        templateVars: { NAME: 'Nordeck IT + Consulting GmbH' },
        varRegexps: { NAME: /.+/ },
      },
    ],
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'object-shorthand': 'error',

    // prefer the typescript-variant of no-redeclare
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': 'error',
  },
  globals: {
    __webpack_nonce__: true,
  },
};
