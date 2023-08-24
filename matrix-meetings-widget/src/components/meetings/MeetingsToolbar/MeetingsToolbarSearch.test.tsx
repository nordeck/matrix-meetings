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
import { MeetingsToolbarSearch } from './MeetingsToolbarSearch';

describe('<MeetingsToolbarSearch/>', () => {
  it('should render without exploding', () => {
    render(<MeetingsToolbarSearch onSearchChange={jest.fn()} search="" />);

    expect(screen.getByRole('textbox', { name: /Search/i })).toHaveValue('');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingsToolbarSearch onSearchChange={jest.fn()} search="" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should call onSearchChange when the search field is updated', async () => {
    const onSearchChange = jest.fn();

    render(<MeetingsToolbarSearch onSearchChange={onSearchChange} search="" />);

    const textbox = screen.getByRole('textbox', { name: 'Search' });
    await userEvent.type(textbox, 'N');

    expect(onSearchChange).toHaveBeenLastCalledWith('N');
  });

  it('should update the search when the filter changes', () => {
    const { rerender } = render(
      <MeetingsToolbarSearch onSearchChange={jest.fn()} search="Meeting" />,
    );

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue(
      'Meeting',
    );

    rerender(
      <MeetingsToolbarSearch onSearchChange={jest.fn()} search="Other text" />,
    );
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue(
      'Other text',
    );
  });
});
