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
import moment from 'moment';
import { ComponentType, PropsWithChildren } from 'react';
import { RecurringMeetingEnd } from '.';
import { LocalizationProvider } from '../../../common/LocalizationProvider';
import { RecurrenceEnd } from '../state';

describe('<RecurringMeetingEnd>', () => {
  const onAfterMeetingCountChange = jest.fn();
  const onRecurrenceEndChange = jest.fn();
  const onUntilDateChange = jest.fn();
  const startDate = new Date('2022-01-01T13:10:00.000Z');

  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should render never ending meeting', () => {
    render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.Never}
        startDate={startDate}
        untilDate={moment('2022-01-02T13:10:00.000Z')}
      />,
      { wrapper: Wrapper }
    );

    const group = screen.getByRole('radiogroup', {
      name: 'End of the recurring meeting',
    });

    expect(
      within(group).getByRole('radio', {
        name: 'The meeting is repeated forever',
      })
    ).toBeChecked();

    expect(
      within(group).getByRole('radio', {
        name: 'The meeting is repeated till January 2, 2022',
      })
    ).not.toBeChecked();
    expect(
      within(group).getByRole('textbox', {
        name: 'Date at which the recurring meetings ends',
      })
    ).toBeDisabled();
    expect(
      within(group).getByRole('button', {
        name: 'Choose date at which the recurring meeting ends, selected date is January 2, 2022',
      })
    ).toBeDisabled();

    expect(
      within(group).getByRole('radio', { name: 'Ends after 10 meetings' })
    ).not.toBeChecked();
    const meetingCountTextbox = within(group).getByRole('spinbutton', {
      name: 'Count of meetings',
    });
    expect(meetingCountTextbox).toBeDisabled();
    expect(meetingCountTextbox).toHaveValue(10);
  });

  it('should render meeting with end date', () => {
    render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.UntilDate}
        startDate={startDate}
        untilDate={moment('2022-01-02T13:10:00.000Z')}
      />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByRole('radio', {
        name: 'The meeting is repeated till January 2, 2022',
      })
    ).toBeChecked();
    expect(
      screen.getByRole('textbox', {
        name: 'Date at which the recurring meetings ends',
      })
    ).toBeEnabled();
    expect(
      screen.getByRole('button', {
        name: 'Choose date at which the recurring meeting ends, selected date is January 2, 2022',
      })
    ).toBeEnabled();
  });

  it('should render meeting with repetition count', () => {
    render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.AfterMeetingCount}
        startDate={startDate}
        untilDate={moment('2022-01-02T13:10:00.000Z')}
      />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByRole('radio', { name: 'Ends after 10 meetings' })
    ).toBeChecked();
    const meetingCountTextbox = screen.getByRole('spinbutton', {
      name: 'Count of meetings',
    });
    expect(meetingCountTextbox).toBeEnabled();
    expect(meetingCountTextbox).toHaveValue(10);
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.Never}
        startDate={startDate}
        untilDate={moment('2022-01-02T13:10:00.000Z')}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should select endless repetition', async () => {
    render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.UntilDate}
        startDate={startDate}
        untilDate={moment('2022-01-02T13:10:00.000Z')}
      />,
      { wrapper: Wrapper }
    );

    await userEvent.click(
      screen.getByRole('radio', { name: 'The meeting is repeated forever' })
    );

    expect(onRecurrenceEndChange).toHaveBeenLastCalledWith(RecurrenceEnd.Never);
  });

  it('should select until end date', async () => {
    render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.Never}
        startDate={startDate}
        untilDate={moment('2022-01-02T13:10:00.000Z')}
      />,
      { wrapper: Wrapper }
    );

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'The meeting is repeated till January 2, 2022',
      })
    );

    expect(onRecurrenceEndChange).toHaveBeenLastCalledWith(
      RecurrenceEnd.UntilDate
    );
  });

  it('should select end after meeting count', async () => {
    render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.Never}
        startDate={startDate}
        untilDate={moment('2022-01-02T13:10:00.000Z')}
      />,
      { wrapper: Wrapper }
    );

    await userEvent.click(
      screen.getByRole('radio', { name: 'Ends after 10 meetings' })
    );

    expect(onRecurrenceEndChange).toHaveBeenLastCalledWith(
      RecurrenceEnd.AfterMeetingCount
    );
  });

  it('should change end date', () => {
    render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.UntilDate}
        startDate={startDate}
        untilDate={moment('2022-01-02T13:10:00.000Z')}
      />,
      { wrapper: Wrapper }
    );

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'Date at which the recurring meetings ends',
      }),
      { target: { value: '05/05/2022' } }
    );

    expect(onUntilDateChange.mock.calls.at(-1).at(0).toDate()).toEqual(
      // Explicitly choose the end of the day, as until should be inclusive
      new Date('2022-05-05T23:59:59.999Z')
    );
  });

  it('should change after meeting count', () => {
    render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.AfterMeetingCount}
        startDate={startDate}
        untilDate={moment('2022-01-02T13:10:00.000Z')}
      />,
      { wrapper: Wrapper }
    );

    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: 'Count of meetings',
      }),
      { target: { value: '11' } }
    );

    expect(onAfterMeetingCountChange).toHaveBeenLastCalledWith('11');
  });

  it('should handle invalid end date', () => {
    render(
      <RecurringMeetingEnd
        afterMeetingCount="10"
        onAfterMeetingCountChange={onAfterMeetingCountChange}
        onRecurrenceEndChange={onRecurrenceEndChange}
        onUntilDateChange={onUntilDateChange}
        recurrenceEnd={RecurrenceEnd.UntilDate}
        startDate={startDate}
        untilDate={moment.invalid()}
      />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByRole('textbox', {
        name: 'Date at which the recurring meetings ends',
        description: 'Invalid date',
      })
    ).toBeInvalid();
  });

  it.each(['', '0'])(
    'should handle invalid after meeting count ("%s")',
    async (afterMeetingCount) => {
      render(
        <RecurringMeetingEnd
          afterMeetingCount={afterMeetingCount}
          onAfterMeetingCountChange={onAfterMeetingCountChange}
          onRecurrenceEndChange={onRecurrenceEndChange}
          onUntilDateChange={onUntilDateChange}
          recurrenceEnd={RecurrenceEnd.AfterMeetingCount}
          startDate={startDate}
          untilDate={moment('2022-01-02T13:10:00.000Z')}
        />,
        { wrapper: Wrapper }
      );

      expect(
        screen.getByRole('spinbutton', {
          name: 'Count of meetings',
          description: 'Invalid input',
        })
      ).toBeInvalid();
    }
  );
});
