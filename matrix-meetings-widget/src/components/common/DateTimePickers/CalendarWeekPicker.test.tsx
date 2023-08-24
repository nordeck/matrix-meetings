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

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren } from 'react';
import { LocalizationProvider } from '../LocalizationProvider';
import { CalendarWeekPicker } from './CalendarWeekPicker';

describe('<CalendarWeekPicker>', () => {
  const onRangeChange = jest.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should render without exploding', () => {
    render(
      <CalendarWeekPicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', {
        name: 'Choose week, selected week is February 1 – 7, 2022',
      }),
    ).toHaveTextContent('Feb 1 – 7, 2022');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <CalendarWeekPicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if date picker is open', async () => {
    const { container } = render(
      <CalendarWeekPicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Choose week, selected week is February 1 – 7, 2022',
      }),
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should react to input changes', async () => {
    render(
      <CalendarWeekPicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Choose week, selected week is February 1 – 7, 2022',
      }),
    );

    const dialog = screen.getByRole('dialog');

    await userEvent.click(
      within(dialog).getByRole('button', {
        name: 'calendar view is open, switch to year view',
      }),
    );

    await userEvent.click(within(dialog).getByRole('button', { name: '2023' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Jan' }));
    await userEvent.click(within(dialog).getByRole('gridcell', { name: '13' }));

    expect(onRangeChange).toBeCalledTimes(1);
    expect(onRangeChange).toHaveBeenLastCalledWith(
      '2023-01-08T00:00:00.000+00:00',
      '2023-01-14T23:59:59.999+00:00',
    );

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
  }, 10000);

  it('should render with week range spanning multiple years', () => {
    render(
      <CalendarWeekPicker
        endDate="2025-01-05T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2024-12-30T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', {
        name: 'Choose week, selected week is December 30, 2024 – January 5, 2025',
      }),
    ).toHaveTextContent('Dec 30, 2024 – Jan 5, 2025');
  });
});
