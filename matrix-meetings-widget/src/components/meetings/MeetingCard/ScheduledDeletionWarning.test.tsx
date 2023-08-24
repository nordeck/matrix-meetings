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
import { axe } from 'jest-axe';
import { ScheduledDeletionWarning } from './ScheduledDeletionWarning';

describe('<ScheduledDeletionWarning>', () => {
  beforeEach(() => {
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => +new Date('2022-02-01T12:00:00Z'));
  });

  it.each`
    deletionDate              | format
    ${'2022-03-01T12:00:00Z'} | ${'in 28 days'}
    ${'2022-02-02T12:00:00Z'} | ${'in 1 day'}
    ${'2022-02-02T11:59:00Z'} | ${'in 23 hours'}
    ${'2022-02-01T13:01:00Z'} | ${'in 1 hour'}
    ${'2022-02-01T12:30:00Z'} | ${'in 30 minutes'}
    ${'2022-02-01T12:01:00Z'} | ${'in 1 minute'}
    ${'2022-02-01T12:00:59Z'} | ${'soon'}
    ${'2022-02-01T11:00:00Z'} | ${'soon'}
  `(
    'should show a warning that the meeting will be deleted $format ($deletionDate)',
    ({ deletionDate, format }) => {
      render(<ScheduledDeletionWarning deletionTime={deletionDate} />);

      expect(screen.getByRole('status')).toHaveTextContent(
        `Meeting room will be automatically deleted ${format}.`,
      );
    },
  );

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ScheduledDeletionWarning deletionTime="2022-02-01T12:00:00Z" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
