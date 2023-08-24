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
import { MeetingsToolbarButtons } from './MeetingsToolbarButtons';

afterEach(() => jest.restoreAllMocks());

describe('<MeetingsToolbarButtons/>', () => {
  it('should render without exploding in list view', () => {
    render(
      <MeetingsToolbarButtons
        endDate="2020-06-13T23:59:59.999+00:00"
        onRangeChange={jest.fn()}
        startDate="2020-06-07T00:00:00.000+00:00"
        view="list"
      />,
    );

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous period' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next period' }),
    ).toBeInTheDocument();
  });

  it('should render without exploding in day view', () => {
    render(
      <MeetingsToolbarButtons
        endDate="2020-06-13T23:59:59.999+00:00"
        onRangeChange={jest.fn()}
        startDate="2020-06-07T00:00:00.000+00:00"
        view="day"
      />,
    );

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous day' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next day' }),
    ).toBeInTheDocument();
  });

  it('should render without exploding in work week view', () => {
    render(
      <MeetingsToolbarButtons
        endDate="2020-06-13T23:59:59.999+00:00"
        onRangeChange={jest.fn()}
        startDate="2020-06-07T00:00:00.000+00:00"
        view="workWeek"
      />,
    );

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous work week' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next work week' }),
    ).toBeInTheDocument();
  });

  it('should render without exploding in week view', () => {
    render(
      <MeetingsToolbarButtons
        endDate="2020-06-13T23:59:59.999+00:00"
        onRangeChange={jest.fn()}
        startDate="2020-06-07T00:00:00.000+00:00"
        view="week"
      />,
    );

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous week' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next week' }),
    ).toBeInTheDocument();
  });

  it('should render without exploding in month view', () => {
    render(
      <MeetingsToolbarButtons
        endDate="2020-06-13T23:59:59.999+00:00"
        onRangeChange={jest.fn()}
        startDate="2020-06-07T00:00:00.000+00:00"
        view="month"
      />,
    );

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous month' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next month' }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingsToolbarButtons
        endDate="2020-06-13T23:59:59.999+00:00"
        onRangeChange={jest.fn()}
        startDate="2020-06-07T00:00:00.000+00:00"
        view="week"
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should change the filter to the current week', async () => {
    const onRangeChange = jest.fn();

    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => +new Date('2020-06-15T13:00:00.000Z'));

    render(
      <MeetingsToolbarButtons
        endDate="2020-06-13T23:59:59.999+00:00"
        onRangeChange={onRangeChange}
        startDate="2020-06-07T00:00:00.000+00:00"
        view="week"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Today' }));

    expect(onRangeChange).toHaveBeenLastCalledWith(
      '2020-06-14T00:00:00.000+00:00',
      '2020-06-20T23:59:59.999+00:00',
    );
  });

  it('should change the filter to the previous week', async () => {
    const onRangeChange = jest.fn();

    render(
      <MeetingsToolbarButtons
        endDate="2020-06-13T23:59:59.999+00:00"
        onRangeChange={onRangeChange}
        startDate="2020-06-07T00:00:00.000+00:00"
        view="week"
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Previous week' }),
    );

    expect(onRangeChange).toHaveBeenLastCalledWith(
      '2020-05-31T00:00:00.000+00:00',
      '2020-06-06T23:59:59.999+00:00',
    );
  });

  it('should change the filter to the next week', async () => {
    const onRangeChange = jest.fn();

    render(
      <MeetingsToolbarButtons
        endDate="2020-06-13T23:59:59.999+00:00"
        onRangeChange={onRangeChange}
        startDate="2020-06-07T00:00:00.000+00:00"
        view="week"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next week' }));

    expect(onRangeChange).toHaveBeenLastCalledWith(
      '2020-06-14T00:00:00.000+00:00',
      '2020-06-20T23:59:59.999+00:00',
    );
  });
});
