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
 * Error with the message that is the key in translation file.
 */
export class TranslatableError extends Error {
  constructor(
    public readonly errorKey: string,
    public readonly translationParams: any = {}
  ) {
    /*
     * IMPORTANT: This comment defines the keys used for this error and is used to extract them via i18next-parser
     *
     * t('commandErrors.noLanguageCode', 'Language code is not provided, use one of these ({{availableLanguageCodes}})')
     * t('commandErrors.badLanguageCode', 'Language code is not supported')
     *
     */
    super(errorKey);
  }
}
