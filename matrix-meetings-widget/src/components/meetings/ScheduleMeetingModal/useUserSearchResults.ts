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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { isError } from 'lodash';
import { useEffect, useState } from 'react';

type SearchResults = Array<{
  userId: string;
  displayName?: string;
  avatarUrl?: string;
}>;

export function useUserSearchResults(
  input: string,
  delay: number
): {
  loading: boolean;
  results: SearchResults;
  error?: Error;
} {
  const widgetApi = useWidgetApi();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<undefined | Error>();
  const [results, setResults] = useState<SearchResults>([]);

  useEffect(() => {
    if (input.trim() === '') {
      setResults((old) => (old.length === 0 ? old : []));
      setError(undefined);
      setLoading(false);
      return;
    }

    let ignore = false;

    async function fetchResults() {
      try {
        const { results } = await widgetApi.searchUserDirectory(input);

        if (!ignore) {
          setResults(results);
          setError(undefined);
          setLoading(false);
        }
      } catch (e) {
        if (!ignore && isError(e)) {
          setError(e);
          setLoading(false);
        }
      }
    }

    setLoading(true);
    const timer = setTimeout(fetchResults, delay);

    return () => {
      clearTimeout(timer);
      ignore = true;
    };
  }, [delay, input, widgetApi]);

  return {
    loading,
    results,
    error,
  };
}
