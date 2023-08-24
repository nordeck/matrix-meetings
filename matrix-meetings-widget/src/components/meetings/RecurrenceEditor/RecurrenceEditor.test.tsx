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

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren } from 'react';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { RecurrenceEditor } from './RecurrenceEditor';

describe('<RecurrenceEditor>', () => {
  const onChange = jest.fn();
  const startDate = new Date('2022-01-02T13:10:00.000Z');
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => +new Date('2022-01-01T13:10:00.000Z'));

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should provide presets', async () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule={undefined}
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Repeat meeting No repetition' }),
    );

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'No repetition',
      'Daily',
      'Weekly',
      'Monday to Friday',
      'Monthly',
      'Yearly',
      'Custom',
    ]);
  });

  it('should render with empty rule', () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule={undefined}
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', { name: 'Repeat meeting No repetition' }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations with empty rule', async () => {
    const { container } = render(
      <RecurrenceEditor
        onChange={onChange}
        rule={undefined}
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render with daily preset', () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=DAILY"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', { name: 'Repeat meeting Every day' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'The meeting is repeated forever' }),
    ).toBeChecked();
  });

  it('should have no accessibility violations with daily preset', async () => {
    const { container } = render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=DAILY"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render with daily preset and repetition count', () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=DAILY"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', { name: 'Repeat meeting Every day' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'The meeting is repeated forever' }),
    ).toBeChecked();
  });

  it('should render with custom rule daily', () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=DAILY;INTERVAL=2"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', { name: 'Repeat meeting Every 2 days' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('spinbutton', {
        name: 'Days until the appointment is repeated',
      }),
    ).toHaveValue(2);
    expect(
      screen.getByRole('button', { name: 'Repeat Days' }),
    ).toBeInTheDocument();
  });

  it('should render with custom rule weekly', () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=WEEKLY;INTERVAL=2"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', {
        name: 'Repeat meeting Every 2 weeks on Sunday',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('spinbutton', {
        name: 'Weeks until the appointment is repeated',
      }),
    ).toHaveValue(2);
    expect(
      screen.getByRole('button', { name: 'Repeat Weeks' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sunday', pressed: true }),
    ).toBeInTheDocument();
  });

  it('should render with custom rule monthly', () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=MONTHLY;INTERVAL=4;BYMONTHDAY=2"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', {
        name: 'Repeat meeting Every 4 months on the 2nd',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('spinbutton', {
        name: 'Months until the appointment is repeated',
      }),
    ).toHaveValue(4);
    expect(
      screen.getByRole('button', { name: 'Repeat Months' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', {
        name: 'The meeting is repeated monthly on the 2',
      }),
    ).toBeChecked();
    const monthdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated monthly on the 2',
    });
    expect(
      within(monthdayGroup).getByRole('spinbutton', { name: 'Day' }),
    ).toHaveValue(2);
  });

  it('should render with custom rule yearly', () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=YEARLY;INTERVAL=1;BYDAY=SU;BYMONTH=1;BYSETPOS=1"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', {
        name: 'Repeat meeting Every January on the first Sunday',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('spinbutton', {
        name: 'Years until the appointment is repeated',
      }),
    ).toHaveValue(1);
    expect(
      screen.getByRole('button', { name: 'Repeat Years' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', {
        name: 'The meeting is repeated yearly at first Sunday of January',
      }),
    ).toBeChecked();

    const weekdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated yearly at first Sunday of January',
    });
    expect(
      within(weekdayGroup).getByRole('button', { name: 'Ordinal first' }),
    ).toBeInTheDocument();
    expect(
      within(weekdayGroup).getByRole('button', { name: 'Weekday Sunday' }),
    ).toBeInTheDocument();
    expect(
      within(weekdayGroup).getByRole('button', { name: 'Month January' }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations with custom rule', async () => {
    const { container } = render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=DAILY;INTERVAL=1"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should change preset to no repetition', async () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=DAILY"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Repeat meeting Every day' }),
    );
    await userEvent.click(
      screen.getByRole('option', { name: 'No repetition' }),
    );

    expect(onChange).toHaveBeenLastCalledWith(undefined, true, true);
  });

  it('should change preset to weekly', async () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule={undefined}
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Repeat meeting No repetition' }),
    );
    await userEvent.click(screen.getByRole('option', { name: 'Weekly' }));

    expect(onChange).toHaveBeenLastCalledWith('FREQ=WEEKLY', true, true);
  });

  it('should change to custom rule', async () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule={undefined}
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Repeat meeting No repetition' }),
    );
    await userEvent.click(screen.getByRole('option', { name: 'Custom' }));

    const customGroup = screen.getByRole('group', {
      name: 'Custom recurring meeting',
    });

    await userEvent.click(
      within(customGroup).getByRole('button', { name: 'Repeat Days' }),
    );
    await userEvent.click(screen.getByRole('option', { name: 'Months' }));

    await userEvent.type(
      within(customGroup).getByRole('spinbutton', {
        name: 'Months until the appointment is repeated',
      }),
      '2',
      { initialSelectionStart: 0, initialSelectionEnd: 1 },
    );

    await userEvent.click(
      within(customGroup).getByRole('radio', {
        name: 'The meeting is repeated monthly on first Sunday',
      }),
    );

    await userEvent.click(
      within(customGroup).getByRole('button', {
        name: 'Ordinal first',
      }),
    );
    await userEvent.click(screen.getByRole('option', { name: 'last' }));

    expect(onChange).toHaveBeenLastCalledWith(
      'FREQ=MONTHLY;INTERVAL=2;BYSETPOS=-1;BYDAY=SU',
      true,
      true,
    );
  });

  it('should change recurrence end', async () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=DAILY"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('radio', { name: 'Ends after 30 meetings' }),
    );

    expect(onChange).toHaveBeenLastCalledWith(
      'FREQ=DAILY;COUNT=30',
      true,
      true,
    );
  });

  it('should handle invalid input', async () => {
    render(
      <RecurrenceEditor
        onChange={onChange}
        rule="FREQ=DAILY"
        startDate={startDate}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      screen.getByRole('radio', { name: 'Ends after 30 meetings' }),
    );
    // Get the spinbutton into an invalid state
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Count of meetings' }),
      { target: { value: '' } },
    );

    expect(onChange).toHaveBeenLastCalledWith('FREQ=DAILY', false, true);
  });
});
