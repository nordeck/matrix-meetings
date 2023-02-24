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

/**
 * Ignore warnings raised by the source-map-loader due to a bug in the rrule module.
 * See: https://github.com/jakubroztocil/rrule/issues/522
 */
function overrideWebpackConfig({ webpackConfig }) {
  webpackConfig.ignoreWarnings = [
    ...(webpackConfig.ignoreWarnings ?? []),
    function ignoreSourceMapsLoaderWarnings(warning) {
      return (
        warning.module &&
        (warning.module.resource.includes('node_modules/rrule') ||
          warning.module.resource.includes('node_modules\\rrule')) &&
        warning.details &&
        warning.details.includes('source-map-loader')
      );
    },
  ];

  return webpackConfig;
}

module.exports = { overrideWebpackConfig };
