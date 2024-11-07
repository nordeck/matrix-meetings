/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { DateTime } from 'luxon';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalizationProvider } from '../LocalizationProvider';
import { ButtonDatePicker } from './ButtonDatePicker';

function Component() {
  const [open, setOpen] = useState(false);

  return (
    <ButtonDatePicker
      slotProps={{
        field: {
          inputProps: {
            'aria-label': 'Choose date, selected date is February 7, 2022',
          },
        },
      }}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      reduceAnimations
      value={DateTime.fromISO('2022-02-07T00:00:00Z')}
      label="Choose date"
    />
  );
}

describe('<CalendarDayPicker>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <LocalizationProvider>{children}</LocalizationProvider>;
    };
  });

  it('should render without exploding', () => {
    render(<Component />, { wrapper: Wrapper });

    expect(
      screen.getByRole('button', {
        name: 'Choose date, selected date is February 7, 2022',
      }),
    ).toHaveTextContent('Choose date');
  });

  it('should open the dialog', async () => {
    render(<Component />, { wrapper: Wrapper });

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Choose date, selected date is February 7, 2022',
      }),
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Choose date, selected date is February 7, 2022',
    });

    expect(
      within(dialog).getByRole('grid', { name: 'February 2022' }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<Component />, { wrapper: Wrapper });

    expect(await axe.run(container)).toHaveNoViolations();
  });
});
