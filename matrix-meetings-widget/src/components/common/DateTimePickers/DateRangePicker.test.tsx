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
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren } from 'react';
import { LocalizationProvider } from '../LocalizationProvider';
import { DateRangePicker } from './DateRangePicker';

describe('<DateRangePicker>', () => {
  const onRangeChange = jest.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should render without exploding', () => {
    render(
      <DateRangePicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', {
        name: /Choose date range, selected range is February 1 – 7, 2022/i,
      }),
    ).toHaveTextContent('Feb 1 – 7, 2022');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <DateRangePicker
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
      <DateRangePicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: /Choose date range, selected range is February 1 – 7, 2022/i,
      }),
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should react to input changes', () => {
    const { rerender } = render(
      <DateRangePicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', {
        name: /Choose date range, selected range is February 1 – 7, 2022/i,
      }),
    ).toHaveTextContent('Feb 1 – 7, 2022');

    rerender(
      <DateRangePicker
        endDate="2022-02-08T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-03T00:00:00Z"
      />,
    );

    expect(
      screen.getByRole('button', {
        name: /Choose date range, selected range is February 3 – 8, 2022/i,
      }),
    ).toHaveTextContent('Feb 3 – 8, 2022');
  });

  it('should select start and end date', async () => {
    render(
      <DateRangePicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: /Choose date range, selected range is February 1 – 7, 2022/i,
      }),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: 'calendar view is open, switch to year view',
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: '2022' }));
    await userEvent.click(screen.getByRole('button', { name: 'Jan' }));
    await userEvent.click(screen.getByRole('gridcell', { name: '13' }));

    await userEvent.click(screen.getByRole('gridcell', { name: '20' }));

    expect(onRangeChange).toBeCalledTimes(1);
    expect(onRangeChange).toHaveBeenLastCalledWith(
      '2022-01-13T00:00:00.000Z',
      '2022-01-20T23:59:59.999Z',
    );
  }, 10000);

  it('should not change range if user aborts after selecting a start date', async () => {
    render(
      <DateRangePicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: /Choose date range, selected range is February 1 – 7, 2022/i,
      }),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: 'calendar view is open, switch to year view',
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: '2022' }));
    await userEvent.click(screen.getByRole('button', { name: 'Jan' }));
    await userEvent.click(screen.getByRole('gridcell', { name: '15' }));

    await userEvent.keyboard('{escape}');

    await userEvent.click(
      screen.getByRole('button', {
        name: /Choose date range, selected range is February 1 – 7, 2022/i,
      }),
    );

    expect(
      screen.getByRole('gridcell', { name: '1', selected: true }),
    ).toBeInTheDocument();
    expect(onRangeChange).not.toBeCalled();
  }, 10000);

  it('should set start and end to the same day', async () => {
    render(
      <DateRangePicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: /Choose date range, selected range is February 1 – 7, 2022/i,
      }),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: 'calendar view is open, switch to year view',
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: '2022' }));
    await userEvent.click(screen.getByRole('button', { name: 'Jan' }));
    await userEvent.click(screen.getByRole('gridcell', { name: '15' }));

    await userEvent.click(screen.getByRole('gridcell', { name: '15' }));

    expect(onRangeChange).toBeCalledTimes(1);
    expect(onRangeChange).toHaveBeenLastCalledWith(
      '2022-01-15T00:00:00.000Z',
      '2022-01-15T23:59:59.999Z',
    );
  }, 10000);

  it('should not select end before start date', async () => {
    render(
      <DateRangePicker
        endDate="2022-02-07T23:59:59Z"
        onRangeChange={onRangeChange}
        startDate="2022-02-01T00:00:00Z"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: /Choose date range, selected range is February 1 – 7, 2022/i,
      }),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: 'calendar view is open, switch to year view',
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: '2022' }));
    await userEvent.click(screen.getByRole('button', { name: 'Jan' }));
    await userEvent.click(screen.getByRole('gridcell', { name: '15' }));

    expect(screen.getByRole('gridcell', { name: '14' })).toBeDisabled();
  }, 10000);
});
