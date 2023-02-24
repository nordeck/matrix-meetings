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
import { Frequency } from 'rrule';
import { CustomRecurringMeeting } from '.';
import { LocalizationProvider } from '../../../common/LocalizationProvider';
import { CustomRuleMode } from '../state';

describe('<CustomRecurringMeeting>', () => {
  const onCustomFrequencyChange = jest.fn();
  const onCustomIntervalChange = jest.fn();
  const onCustomByWeekdayChange = jest.fn();
  const onCustomRuleModeChange = jest.fn();
  const onCustomMonthChange = jest.fn();
  const onCustomNthMonthdayChange = jest.fn();
  const onCustomWeekdayChange = jest.fn();
  const onCustomNthChange = jest.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => +new Date('2022-01-02T13:10:00.000Z'));

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should render with daily frequency', () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.DAILY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const group = screen.getByRole('group', {
      name: 'Custom recurring meeting',
    });

    expect(
      within(group).getByRole('spinbutton', {
        name: 'Days until the appointment is repeated',
      })
    ).toHaveValue(2);
    expect(
      within(group).getByRole('button', { name: 'Repeat Days' })
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations with daily frequency', async () => {
    const { container } = render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.DAILY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render with weekly frequency', () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.WEEKLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const group = screen.getByRole('group', {
      name: 'Custom recurring meeting',
    });

    expect(
      within(group).getByRole('spinbutton', {
        name: 'Weeks until the appointment is repeated',
      })
    ).toHaveValue(2);
    expect(
      within(group).getByRole('button', { name: 'Repeat Weeks' })
    ).toBeInTheDocument();

    const weekdaysGroup = within(group).getByRole('group', {
      name: 'Repeat on weekday',
    });

    expect(
      within(weekdaysGroup)
        .getAllByRole('button', { pressed: true })
        .map((b) => b.textContent)
    ).toEqual(['Monday']);
  });

  it('should have no accessibility violations with weekly frequency', async () => {
    const { container } = render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.WEEKLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render with monthly frequency in monthday mode', () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.MONTHLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByMonthday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const group = screen.getByRole('group', {
      name: 'Custom recurring meeting',
    });

    expect(
      within(group).getByRole('spinbutton', {
        name: 'Months until the appointment is repeated',
      })
    ).toHaveValue(2);
    expect(
      within(group).getByRole('button', { name: 'Repeat Months' })
    ).toBeInTheDocument();

    expect(
      within(group).getByRole('radio', {
        name: 'The meeting is repeated monthly on the 19',
      })
    ).toBeChecked();

    const monthdayGroup = within(group).getByRole('group', {
      name: 'The meeting is repeated monthly on the 19',
    });
    const daySpinButton = within(monthdayGroup).getByRole('spinbutton', {
      name: 'Day',
    });
    expect(daySpinButton).toBeEnabled();
    expect(daySpinButton).toHaveValue(19);
  });

  it('should render with monthly frequency in weekday mode', () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.MONTHLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const group = screen.getByRole('group', {
      name: 'Custom recurring meeting',
    });

    expect(
      within(group).getByRole('spinbutton', {
        name: 'Months until the appointment is repeated',
      })
    ).toHaveValue(2);
    expect(
      within(group).getByRole('button', { name: 'Repeat Months' })
    ).toBeInTheDocument();

    expect(
      within(group).getByRole('radio', {
        name: 'The meeting is repeated monthly on third Tuesday',
      })
    ).toBeChecked();

    const weekdayGroup = within(group).getByRole('group', {
      name: 'The meeting is repeated monthly on third Tuesday',
    });
    expect(
      within(weekdayGroup).getByRole('button', {
        name: 'Ordinal third',
      })
    ).toBeEnabled();
    expect(
      within(weekdayGroup).getByRole('button', { name: 'Weekday Tuesday' })
    ).toBeEnabled();
  });

  it('should have no accessibility violations with monthly frequency in monthday mode', async () => {
    const { container } = render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.MONTHLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByMonthday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations with monthly frequency in weekday mode', async () => {
    const { container } = render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.MONTHLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render with yearly frequency in monthday mode', () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.YEARLY}
        customInterval="1"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByMonthday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const group = screen.getByRole('group', {
      name: 'Custom recurring meeting',
    });

    expect(
      within(group).getByRole('spinbutton', {
        name: 'Years until the appointment is repeated',
      })
    ).toHaveValue(1);
    expect(
      within(group).getByRole('button', { name: 'Repeat Years' })
    ).toBeInTheDocument();

    expect(
      within(group).getByRole('radio', {
        name: 'The meeting is repeated yearly on 19 October',
      })
    ).toBeChecked();

    const monthdayGroup = within(group).getByRole('group', {
      name: 'The meeting is repeated yearly on 19 October',
    });
    const daySpinButton = within(monthdayGroup).getByRole('spinbutton', {
      name: 'Day',
    });
    expect(daySpinButton).toBeEnabled();
    expect(daySpinButton).toHaveValue(19);
    expect(
      within(monthdayGroup).getByRole('button', { name: 'Month October' })
    ).toBeEnabled();
  });

  it('should render with yearly frequency in weekday mode', () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.YEARLY}
        customInterval="1"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const group = screen.getByRole('group', {
      name: 'Custom recurring meeting',
    });

    expect(
      within(group).getByRole('spinbutton', {
        name: 'Years until the appointment is repeated',
      })
    ).toHaveValue(1);
    expect(
      within(group).getByRole('button', { name: 'Repeat Years' })
    ).toBeInTheDocument();

    expect(
      within(group).getByRole('radio', {
        name: 'The meeting is repeated yearly at third Tuesday of December',
      })
    ).toBeChecked();

    const weekdayGroup = within(group).getByRole('group', {
      name: 'The meeting is repeated yearly at third Tuesday of December',
    });
    expect(
      within(weekdayGroup).getByRole('button', { name: 'Ordinal third' })
    ).toBeEnabled();
    expect(
      within(weekdayGroup).getByRole('button', { name: 'Weekday Tuesday' })
    ).toBeEnabled();
    expect(
      within(weekdayGroup).getByRole('button', { name: 'Month October' })
    ).toBeEnabled();
  });

  it('should have no accessibility violations with yearly frequency in monthday mode', async () => {
    const { container } = render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.YEARLY}
        customInterval="1"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByMonthday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations with yearly frequency in weekday mode', async () => {
    const { container } = render(
      <CustomRecurringMeeting
        customByWeekday={[0]}
        customFrequency={Frequency.YEARLY}
        customInterval="1"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should change interval', () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.DAILY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: 'Days until the appointment is repeated',
      }),
      { target: { value: '7' } }
    );

    expect(onCustomIntervalChange).toHaveBeenLastCalledWith('7');
  });

  it('should change frequency', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.DAILY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Repeat Days' }));

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Days',
      'Weeks',
      'Months',
      'Years',
    ]);

    await userEvent.click(screen.getByRole('option', { name: 'Months' }));

    expect(onCustomFrequencyChange).toHaveBeenLastCalledWith(Frequency.MONTHLY);
  });

  it('should change by weekday', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[5]}
        customFrequency={Frequency.WEEKLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const weekdaysGroup = screen.getByRole('group', {
      name: 'Repeat on weekday',
    });

    expect(
      within(weekdaysGroup)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);

    await userEvent.click(
      within(weekdaysGroup).getByRole('button', { name: 'Tuesday' })
    );

    expect(onCustomByWeekdayChange).toHaveBeenLastCalledWith([1, 5]);
  });

  it('should change rule mode for montly recurrence to by weekday', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.MONTHLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByMonthday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'The meeting is repeated monthly on third Tuesday',
      })
    );

    expect(onCustomRuleModeChange).toHaveBeenLastCalledWith(
      CustomRuleMode.ByWeekday
    );
  });

  it('should change monthday for monthly recurrence (rule mode by monthday)', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.MONTHLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByMonthday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const monthdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated monthly on the 19',
    });

    fireEvent.change(
      within(monthdayGroup).getByRole('spinbutton', { name: 'Day' }),
      { target: { value: '10' } }
    );

    expect(onCustomNthMonthdayChange).toHaveBeenLastCalledWith('10');
  });

  it('should change n-th for monthly recurrence (rule mode by weekday)', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.MONTHLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const weekdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated monthly on third Tuesday',
    });

    await userEvent.click(
      within(weekdayGroup).getByRole('button', {
        name: 'Ordinal third',
      })
    );
    expect(screen.getAllByRole('option').map((r) => r.textContent)).toEqual([
      'first',
      'second',
      'third',
      'fourth',
      'last',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'last' }));

    expect(onCustomNthChange).toHaveBeenLastCalledWith(-1);
  });

  it('should change weekday for monthly recurrence (rule mode by weekday)', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.MONTHLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const weekdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated monthly on third Tuesday',
    });

    await userEvent.click(
      within(weekdayGroup).getByRole('button', { name: 'Weekday Tuesday' })
    );
    expect(screen.getAllByRole('option').map((r) => r.textContent)).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'Thursday' }));

    expect(onCustomWeekdayChange).toHaveBeenLastCalledWith(3);
  });

  it('should change rule mode for yearly recurrence to by weekday', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.YEARLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByMonthday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'The meeting is repeated yearly at third Tuesday of December',
      })
    );

    expect(onCustomRuleModeChange).toHaveBeenLastCalledWith(
      CustomRuleMode.ByWeekday
    );
  });

  it('should change monthday for yearly recurrence (rule mode by monthday)', () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.YEARLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByMonthday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const monthdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated yearly on 19 October',
    });

    fireEvent.change(
      within(monthdayGroup).getByRole('spinbutton', { name: 'Day' }),
      { target: { value: '10' } }
    );

    expect(onCustomNthMonthdayChange).toHaveBeenLastCalledWith('10');
  });

  it('should change month for yearly recurrence (rule mode by monthday)', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.YEARLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByMonthday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const monthdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated yearly on 19 October',
    });

    await userEvent.click(
      within(monthdayGroup).getByRole('button', { name: 'Month October' })
    );
    expect(screen.getAllByRole('option').map((r) => r.textContent)).toEqual([
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'April' }));

    expect(onCustomMonthChange).toHaveBeenLastCalledWith(4);
  });

  it('should change n-th for yearly recurrence (rule mode by weekday)', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.YEARLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const weekdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated yearly at third Tuesday of December',
    });

    await userEvent.click(
      within(weekdayGroup).getByRole('button', {
        name: 'Ordinal third',
      })
    );
    expect(screen.getAllByRole('option').map((r) => r.textContent)).toEqual([
      'first',
      'second',
      'third',
      'fourth',
      'last',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'last' }));

    expect(onCustomNthChange).toHaveBeenLastCalledWith(-1);
  });

  it('should change weekday for yearly recurrence (rule mode by weekday)', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.YEARLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const weekdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated yearly at third Tuesday of December',
    });

    await userEvent.click(
      within(weekdayGroup).getByRole('button', { name: 'Weekday Tuesday' })
    );
    expect(screen.getAllByRole('option').map((r) => r.textContent)).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'Thursday' }));

    expect(onCustomWeekdayChange).toHaveBeenLastCalledWith(3);
  });

  it('should change month for yearly recurrence (rule mode by weekday)', async () => {
    render(
      <CustomRecurringMeeting
        customByWeekday={[]}
        customFrequency={Frequency.YEARLY}
        customInterval="2"
        customMonth={10}
        customNth={3}
        customNthMonthday="19"
        customRuleMode={CustomRuleMode.ByWeekday}
        customWeekday={1}
        onCustomByWeekdayChange={onCustomByWeekdayChange}
        onCustomFrequencyChange={onCustomFrequencyChange}
        onCustomIntervalChange={onCustomIntervalChange}
        onCustomMonthChange={onCustomMonthChange}
        onCustomNthChange={onCustomNthChange}
        onCustomNthMonthdayChange={onCustomNthMonthdayChange}
        onCustomRuleModeChange={onCustomRuleModeChange}
        onCustomWeekdayChange={onCustomWeekdayChange}
      />,
      { wrapper: Wrapper }
    );

    const weekdayGroup = screen.getByRole('group', {
      name: 'The meeting is repeated yearly at third Tuesday of December',
    });

    await userEvent.click(
      within(weekdayGroup).getByRole('button', { name: 'Month October' })
    );
    expect(screen.getAllByRole('option').map((r) => r.textContent)).toEqual([
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'April' }));

    expect(onCustomMonthChange).toHaveBeenLastCalledWith(4);
  });

  it.each(['', '0'])(
    'should handle invalid interval ("%s")',
    async (interval) => {
      render(
        <CustomRecurringMeeting
          customByWeekday={[0]}
          customFrequency={Frequency.DAILY}
          customInterval={interval}
          customMonth={10}
          customNth={3}
          customNthMonthday="10"
          customRuleMode={CustomRuleMode.ByMonthday}
          customWeekday={1}
          onCustomByWeekdayChange={onCustomByWeekdayChange}
          onCustomFrequencyChange={onCustomFrequencyChange}
          onCustomIntervalChange={onCustomIntervalChange}
          onCustomMonthChange={onCustomMonthChange}
          onCustomNthChange={onCustomNthChange}
          onCustomNthMonthdayChange={onCustomNthMonthdayChange}
          onCustomRuleModeChange={onCustomRuleModeChange}
          onCustomWeekdayChange={onCustomWeekdayChange}
        />,
        { wrapper: Wrapper }
      );

      expect(
        screen.getByRole('spinbutton', {
          name: 'Days until the appointment is repeated',
          description: 'Invalid input',
        })
      ).toBeInvalid();
    }
  );

  it.each(['', '0', '32'])(
    'should handle invalid monthday in monthly frequency ("%s")',
    async (customNthMonthday) => {
      render(
        <CustomRecurringMeeting
          customByWeekday={[0]}
          customFrequency={Frequency.MONTHLY}
          customInterval="2"
          customMonth={10}
          customNth={3}
          customNthMonthday={customNthMonthday}
          customRuleMode={CustomRuleMode.ByMonthday}
          customWeekday={1}
          onCustomByWeekdayChange={onCustomByWeekdayChange}
          onCustomFrequencyChange={onCustomFrequencyChange}
          onCustomIntervalChange={onCustomIntervalChange}
          onCustomMonthChange={onCustomMonthChange}
          onCustomNthChange={onCustomNthChange}
          onCustomNthMonthdayChange={onCustomNthMonthdayChange}
          onCustomRuleModeChange={onCustomRuleModeChange}
          onCustomWeekdayChange={onCustomWeekdayChange}
        />,
        { wrapper: Wrapper }
      );

      expect(
        screen.getByRole('spinbutton', {
          name: 'Day',
          description: 'Invalid input',
        })
      ).toBeInvalid();
    }
  );

  it.each(['', '0', '32'])(
    'should handle invalid monthday in yearly frequency ("%s")',
    async (customNthMonthday) => {
      render(
        <CustomRecurringMeeting
          customByWeekday={[0]}
          customFrequency={Frequency.YEARLY}
          customInterval="2"
          customMonth={10}
          customNth={3}
          customNthMonthday={customNthMonthday}
          customRuleMode={CustomRuleMode.ByMonthday}
          customWeekday={1}
          onCustomByWeekdayChange={onCustomByWeekdayChange}
          onCustomFrequencyChange={onCustomFrequencyChange}
          onCustomIntervalChange={onCustomIntervalChange}
          onCustomMonthChange={onCustomMonthChange}
          onCustomNthChange={onCustomNthChange}
          onCustomNthMonthdayChange={onCustomNthMonthdayChange}
          onCustomRuleModeChange={onCustomRuleModeChange}
          onCustomWeekdayChange={onCustomWeekdayChange}
        />,
        { wrapper: Wrapper }
      );

      expect(
        screen.getByRole('spinbutton', {
          name: 'Day',
          description: 'Invalid input',
        })
      ).toBeInvalid();
    }
  );
});
