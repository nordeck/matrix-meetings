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
import { DateTime } from 'luxon';
import { ComponentType, PropsWithChildren } from 'react';
import { expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { LocalizationProvider } from '../LocalizationProvider';
import { EndTimePicker } from './EndTimePicker';

describe('<EndTimePicker/>', () => {
  const onChange = vi.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render without exploding', () => {
    render(
      <EndTimePicker
        onChange={onChange}
        value={DateTime.fromISO('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByRole('textbox', { name: /end time/i })).toHaveValue(
      '12:15 PM',
    );
    expect(
      screen.getByRole('button', {
        name: /choose end time, selected time is 12:15 PM/i,
      }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <EndTimePicker
        onChange={onChange}
        value={DateTime.fromISO('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if picker is open', async () => {
    const { container } = render(
      <EndTimePicker
        onChange={onChange}
        value={DateTime.fromISO('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(screen.getByLabelText(/choose end time/i));

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should update the meeting end time', () => {
    render(
      <EndTimePicker
        onChange={onChange}
        value={DateTime.fromISO('2020-01-01T12:15:38.123Z')}
      />,
      { wrapper: Wrapper },
    );

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.change(screen.getByRole('textbox', { name: /end time/i }), {
      target: { value: '08:15 AM' },
    });

    expect(onChange).toBeCalled();
    expect(onChange.mock.calls[0][0].toISO()).toEqual(
      '2020-01-01T08:15:00.000Z',
    );
  });

  it('should not update on invalid value', () => {
    render(
      <EndTimePicker onChange={onChange} value={DateTime.invalid('Invalid')} />,
      { wrapper: Wrapper },
    );

    const textbox = screen.getByRole('textbox', {
      name: /end time/i,
    }) as HTMLInputElement;

    // userEvent.type doesn't work here, so we have to use fireEvent
    fireEvent.click(textbox);
    fireEvent.change(textbox, { target: { value: '1:mm aa' } });
    expect(textbox).toHaveValue('01:mm aa');

    expect(textbox).toHaveAccessibleDescription('Invalid time');
    expect(textbox).toBeInvalid();

    expect(onChange).not.toBeCalled();
  });

  it('should show error state', () => {
    render(
      <EndTimePicker
        error="This is wrong"
        onChange={onChange}
        value={DateTime.fromISO('2020-01-01T12:15:38Z')}
      />,
      { wrapper: Wrapper },
    );

    const input = screen.getByRole('textbox', { name: /end time/i });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('This is wrong');
  });

  it('should notice an external data update', () => {
    const { rerender } = render(
      <EndTimePicker
        onChange={onChange}
        value={DateTime.fromISO('2020-01-01T12:15:38.123Z')}
      />,
      { wrapper: Wrapper },
    );

    const input = screen.getByRole('textbox', { name: /end time/i });

    expect(input).toHaveValue('12:15 PM');

    rerender(
      <EndTimePicker
        onChange={onChange}
        value={DateTime.fromISO('2020-01-01T14:15:38.123Z')}
      />,
    );

    expect(input).toHaveValue('02:15 PM');
  });
});
