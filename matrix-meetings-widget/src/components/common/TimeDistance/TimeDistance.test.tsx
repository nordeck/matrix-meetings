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
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { TimeDistance } from './TimeDistance';

afterEach(() => {
  vi.useRealTimers();
});

describe('<TimeDistance/>', () => {
  it('should render without exploding', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T00:01:00Z'));

    render(
      <TimeDistance
        endDate="2020-01-01T00:02:00"
        startDate="2020-01-01T00:00:00Z"
      />,
    );

    expect(screen.getByText(/ends in 01:00/i)).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <TimeDistance
        endDate="3999-01-01T00:00:00"
        startDate="2020-01-01T00:00:00Z"
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should count down', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));

    const { container } = render(
      <TimeDistance
        endDate="2020-01-01T00:02:00"
        startDate="2020-01-01T00:00:00Z"
      />,
    );

    expect(screen.getByText(/ends in 2 minutes/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.getByText(/ends in 1 minute/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(66000);
    });

    expect(screen.getByText(/ends in 24/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(24000);
    });

    expect(container).toBeEmptyDOMElement();
  });
});
