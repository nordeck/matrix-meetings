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

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as moment from 'moment-timezone';
import { ComponentType, PropsWithChildren } from 'react';
import { LocalizationProvider } from '../LocalizationProvider';
import { StartDatePicker } from './StartDatePicker';

describe('<StartDatePicker/>', () => {
  const onChange = jest.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should render without exploding', () => {
    render(
      <StartDatePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('textbox', { name: 'Start date' })).toHaveValue(
      '01/01/2020'
    );
    expect(
      screen.getByRole('button', {
        name: /choose start date, selected date is January 1, 2020/i,
      })
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <StartDatePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if picker is open', async () => {
    const { container } = render(
      <StartDatePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    await userEvent.click(screen.getByLabelText(/choose start date/i));

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should update the meeting start date', () => {
    render(
      <StartDatePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38.123Z')}
      />,
      { wrapper: Wrapper }
    );

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(screen.getByRole('textbox', { name: 'Start date' }), {
      target: { value: '06/05/2022' },
    });

    expect(onChange).toBeCalled();
    expect(onChange.mock.calls[0][0].toISOString()).toEqual(
      '2022-06-05T12:15:00.000Z'
    );
  });

  it('should not update on invalid value', () => {
    render(<StartDatePicker onChange={onChange} value={moment.invalid()} />, {
      wrapper: Wrapper,
    });

    const textbox = screen.getByRole('textbox', {
      name: /start date/i,
    }) as HTMLInputElement;

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.click(textbox);
    fireEvent.change(textbox, { target: { value: '1/DD/YYYY' } });
    expect(textbox).toHaveValue('01/DD/YYYY');

    expect(textbox).toHaveAccessibleDescription('Invalid date');
    expect(textbox).toBeInvalid();

    expect(onChange).not.toBeCalled();
  });

  it('should show error state', () => {
    render(
      <StartDatePicker
        error="This is wrong"
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    const input = screen.getByRole('textbox', {
      name: 'Start date',
      description: 'This is wrong',
    });

    expect(input).toBeInvalid();
  });

  it('should show readOnly state even if error is set', () => {
    render(
      <StartDatePicker
        error="This is wrong"
        onChange={onChange}
        readOnly="This is readonly"
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    const input = screen.getByRole('textbox', {
      name: 'Start date',
      description: 'This is readonly',
    });

    expect(input).toBeValid();
    expect(input).toHaveAttribute('readonly');
  });

  it('should notice an external data update', () => {
    const { rerender } = render(
      <StartDatePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38.123Z')}
      />,
      { wrapper: Wrapper }
    );

    const input = screen.getByRole('textbox', { name: 'Start date' });

    expect(input).toHaveValue('01/01/2020');

    rerender(
      <StartDatePicker
        onChange={onChange}
        value={moment.utc('2021-01-01T12:15:38.123Z')}
      />
    );

    expect(input).toHaveValue('01/01/2021');
  });

  it('disallow values in the past (before min date)', () => {
    render(
      <StartDatePicker
        minDate={moment.utc('2020-01-02T12:15:38Z')}
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    const input = screen.getByRole('textbox', { name: 'Start date' });

    expect(input).toBeInvalid();
  });

  it('allow values in the past (after min date)', () => {
    render(
      <StartDatePicker
        minDate={moment.utc('2020-01-01T12:15:38Z')}
        onChange={onChange}
        value={moment.utc('2020-02-01T12:17:38Z')}
      />,
      { wrapper: Wrapper }
    );

    const input = screen.getByRole('textbox', { name: 'Start date' });

    expect(input).toBeValid();
  });
});
