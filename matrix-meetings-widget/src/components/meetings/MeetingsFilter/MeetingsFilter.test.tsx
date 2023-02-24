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
import { last } from 'lodash';
import { ComponentType, PropsWithChildren } from 'react';
import { Filters } from '../../../reducer/meetingsApi';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { MeetingsFilter } from './MeetingsFilter';

describe('<MeetingsFilter/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let filters: Filters;

  beforeEach(() => {
    filters = {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2020-01-08T23:59:59Z',
      filterText: '',
    };

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should render without exploding', () => {
    render(<MeetingsFilter filters={filters} onFiltersChange={jest.fn()} />, {
      wrapper: Wrapper,
    });
    expect(
      screen.getByRole('button', {
        name: /Choose date range, selected range is January 1 – 8, 2020/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingsFilter filters={filters} onFiltersChange={jest.fn()} />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should update the date', () => {
    const onFiltersChange = jest.fn();

    render(
      <MeetingsFilter filters={filters} onFiltersChange={onFiltersChange} />,
      { wrapper: Wrapper }
    );

    userEvent.click(
      screen.getByRole('button', {
        name: /Choose date range, selected range is January 1 – 8, 2020/i,
      })
    );

    userEvent.click(
      screen.getByRole('button', {
        name: 'calendar view is open, switch to year view',
      })
    );

    userEvent.click(screen.getByRole('button', { name: '2022' }));
    userEvent.click(screen.getByRole('button', { name: 'Jan' }));
    userEvent.click(screen.getByRole('gridcell', { name: '13' }));

    userEvent.click(screen.getByRole('gridcell', { name: '20' }));

    expect(last(onFiltersChange.mock.calls)?.[0](filters)).toEqual({
      startDate: '2022-01-13T00:00:00.000Z',
      endDate: '2022-01-20T23:59:59.999Z',
      filterText: '',
    });
  });

  it('should update the text', () => {
    const onFiltersChange = jest.fn();

    render(
      <MeetingsFilter filters={filters} onFiltersChange={onFiltersChange} />,
      { wrapper: Wrapper }
    );

    const textbox = screen.getByRole('textbox', { name: 'Search' });

    userEvent.type(textbox, 'New Filter');

    expect(last(onFiltersChange.mock.calls)?.[0](filters)).toEqual({
      startDate: '2020-01-01T00:00:00.000Z',
      endDate: '2020-01-08T23:59:59.000Z',
      filterText: 'New Filter',
    });
  });

  it('should clear the text', () => {
    const onFiltersChange = jest.fn();

    filters = {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2020-01-08T23:59:59Z',
      filterText: 'Filter',
    };

    render(
      <MeetingsFilter filters={filters} onFiltersChange={onFiltersChange} />,
      { wrapper: Wrapper }
    );

    const textbox = screen.getByRole('textbox', { name: 'Search' });

    expect(textbox).toHaveValue('Filter');

    userEvent.clear(textbox);

    expect(last(onFiltersChange.mock.calls)?.[0](filters)).toEqual({
      startDate: '2020-01-01T00:00:00.000Z',
      endDate: '2020-01-08T23:59:59.000Z',
      filterText: '',
    });
  });

  it('should update external filter updates', () => {
    const onFiltersChange = jest.fn();
    const filters1 = {
      startDate: '2021-01-01T00:00:00.000Z',
      endDate: '2021-01-08T23:59:59.000Z',
      filterText: 'A filter',
    };

    const { rerender } = render(
      <MeetingsFilter filters={filters} onFiltersChange={onFiltersChange} />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByRole('button', {
        name: /Choose date range, selected range is January 1 – 8, 2020/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('');

    rerender(
      <MeetingsFilter filters={filters1} onFiltersChange={onFiltersChange} />
    );

    expect(
      screen.getByRole('button', {
        name: /Choose date range, selected range is January 1 – 8, 2021/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue(
      'A filter'
    );

    // should return the same filters instance to not run into infinite loops
    expect(last(onFiltersChange.mock.calls)?.[0](filters1)).toBe(filters1);
  });
});
