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
import { StartTimePicker } from './StartTimePicker';

describe('<StartTimePicker/>', () => {
  const onChange = jest.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should render without exploding', () => {
    render(
      <StartTimePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('textbox', { name: 'Start time' })).toHaveValue(
      '12:15 PM'
    );
    expect(
      screen.getByRole('button', {
        name: /choose start time, selected time is 12:15 PM/i,
      })
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <StartTimePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if picker is open', async () => {
    const { container } = render(
      <StartTimePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    userEvent.click(screen.getByLabelText(/choose start time/i));

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should update the meeting start time', () => {
    render(
      <StartTimePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38.123Z')}
      />,
      { wrapper: Wrapper }
    );

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(screen.getByRole('textbox', { name: 'Start time' }), {
      target: { value: '08:15 AM' },
    });

    expect(onChange).toBeCalled();
    expect(onChange.mock.calls[0][0].toISOString()).toEqual(
      '2020-01-01T08:15:00.000Z'
    );
  });

  it('should not update on invalid value', () => {
    render(
      <StartTimePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38.123Z')}
      />,
      { wrapper: Wrapper }
    );

    const textbox = screen.getByRole('textbox', { name: 'Start time' });

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(textbox, { target: { value: '99:99' } });

    expect(textbox).toHaveAccessibleDescription('Invalid time');
    expect(textbox).toBeInvalid();

    expect(onChange).not.toBeCalled();
  });

  it('should show error state', () => {
    render(
      <StartTimePicker
        error="This is wrong"
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    const input = screen.getByRole('textbox', {
      name: 'Start time',
      description: 'This is wrong',
    });
    expect(input).toBeInvalid();
  });

  it('should show readOnly state even if error is set', () => {
    render(
      <StartTimePicker
        error="This is wrong"
        onChange={onChange}
        readOnly="This is readonly"
        value={moment.utc('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper }
    );

    const input = screen.getByRole('textbox', {
      name: 'Start time',
      description: 'This is readonly',
    });

    expect(input).toBeValid();
    expect(input).toHaveAttribute('readonly');
  });

  it('should notice an external data update', () => {
    const { rerender } = render(
      <StartTimePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T12:15:38.123Z')}
      />,
      { wrapper: Wrapper }
    );

    const input = screen.getByRole('textbox', { name: 'Start time' });

    expect(input).toHaveValue('12:15 PM');

    rerender(
      <StartTimePicker
        onChange={onChange}
        value={moment.utc('2020-01-01T14:15:38.123Z')}
      />
    );

    expect(input).toHaveValue('02:15 PM');
  });
});
