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

import { useMediaQuery } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren } from 'react';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { MeetingsNavigation } from './MeetingsNavigation';

jest.mock('@mui/material/useMediaQuery');

describe('<MeetingsNavigation/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    localStorage.clear();
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should render without exploding', async () => {
    jest.mocked(useMediaQuery).mockReturnValue(true);

    render(<MeetingsNavigation onViewChange={jest.fn()} view="list" />, {
      wrapper: Wrapper,
    });

    expect(
      screen.getByRole('combobox', { name: 'View', description: '' }),
    ).toHaveTextContent('List');
    await userEvent.click(
      screen.getByRole('combobox', { name: 'View', description: '' }),
    );

    const listbox = screen.getByRole('listbox', { name: 'View' });
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveAccessibleName('List');
    expect(options[1]).toHaveAccessibleName('Day');
    expect(options[2]).toHaveAccessibleName('Work Week');
    expect(options[3]).toHaveAccessibleName('Week');
    expect(options[4]).toHaveAccessibleName('Month');
  });

  it('should have no accessibility violations', async () => {
    jest.mocked(useMediaQuery).mockReturnValue(true);

    const { container } = render(
      <MeetingsNavigation onViewChange={jest.fn()} view="list" />,
      { wrapper: Wrapper },
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations with disabled views', async () => {
    jest.mocked(useMediaQuery).mockReturnValue(false);

    const { container } = render(
      <MeetingsNavigation onViewChange={jest.fn()} view="list" />,
      { wrapper: Wrapper },
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should select a different view', async () => {
    const onViewChange = jest.fn();

    jest.mocked(useMediaQuery).mockReturnValue(true);

    render(<MeetingsNavigation onViewChange={onViewChange} view="week" />, {
      wrapper: Wrapper,
    });

    expect(screen.getByRole('combobox', { name: 'View' })).toHaveTextContent(
      'Week',
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'View' }));
    await userEvent.click(screen.getByRole('option', { name: 'Month' }));

    expect(onViewChange).toHaveBeenLastCalledWith('month');
  });

  it('should disable some calendar views on a small screen', async () => {
    jest.mocked(useMediaQuery).mockReturnValue(false);

    render(<MeetingsNavigation onViewChange={jest.fn()} view="list" />, {
      wrapper: Wrapper,
    });

    await userEvent.click(
      screen.getByRole('combobox', {
        name: 'View',
        description: 'Increase widget width to enable more views.',
      }),
    );

    const listbox = screen.getByRole('listbox', { name: 'View' });

    expect(
      within(listbox).getByRole('option', { name: 'List' }),
    ).not.toHaveAttribute('aria-disabled');
    expect(
      within(listbox).getByRole('option', { name: 'Day' }),
    ).not.toHaveAttribute('aria-disabled');
    expect(
      within(listbox).getByRole('option', {
        name: 'Work Week Increase widget width',
      }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      within(listbox).getByRole('option', {
        name: 'Week Increase widget width',
      }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      within(listbox).getByRole('option', {
        name: 'Month Increase widget width',
      }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('should switch to the day view if the screen becomes to small', () => {
    const onViewChange = jest.fn();

    jest.mocked(useMediaQuery).mockReturnValue(false);

    render(<MeetingsNavigation onViewChange={onViewChange} view="week" />, {
      wrapper: Wrapper,
    });

    expect(useMediaQuery).toBeCalledWith('(min-width:800px)', { noSsr: true });
    expect(onViewChange).toHaveBeenLastCalledWith('day');
  });
});
