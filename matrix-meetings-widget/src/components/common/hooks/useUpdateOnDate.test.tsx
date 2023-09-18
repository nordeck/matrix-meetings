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

import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useUpdateOnDate } from './useUpdateOnDate';

describe('useUpdateOnDate', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should rerender at date', () => {
    function Component({ date }: { date: string }) {
      useUpdateOnDate(date);

      return <div>{new Date(Date.now()).toISOString()}</div>;
    }

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-12-07T20:30:00.000Z'));

    render(<Component date={'2022-12-07T20:31:00.000Z'}></Component>);

    expect(screen.getByText('2022-12-07T20:30:00.000Z')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    expect(screen.getByText('2022-12-07T20:31:00.000Z')).toBeInTheDocument();
  });
});
