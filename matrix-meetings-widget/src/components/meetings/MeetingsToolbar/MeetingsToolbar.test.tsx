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

import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { useMediaQuery } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPowerLevelsEvent } from '../../../lib/testUtils';
import { Filters } from '../../../reducer/meetingsApi';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { LocalizationProvider } from '../../common/LocalizationProvider';
import { MeetingsToolbar } from './MeetingsToolbar';

vi.mock('@mui/material/useMediaQuery');

describe('<MeetingsToolbar/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let filters: Filters;
  let widgetApi: MockedWidgetApi;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    vi.mocked(useMediaQuery).mockReturnValue(true);

    filters = {
      startDate: '2020-06-07T00:00:00.000+00:00',
      endDate: '2020-06-13T23:59:59.999+00:00',
      filterText: '',
    };

    widgetApi = mockWidgetApi();

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });
      return (
        <LocalizationProvider>
          <Provider store={store}>
            <WidgetApiMockProvider value={widgetApi}>
              {children}
            </WidgetApiMockProvider>
          </Provider>
        </LocalizationProvider>
      );
    };
  });

  it('should render without exploding', () => {
    render(
      <MeetingsToolbar
        filters={filters}
        onRangeChange={vi.fn()}
        onSearchChange={vi.fn()}
        onViewChange={vi.fn()}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('button', { name: 'Schedule Meeting' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Next day' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Previous day' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Choose date, selected date is June 7, 2020',
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();

    expect(screen.getByRole('combobox', { name: 'View' })).toHaveTextContent(
      'Day',
    );
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MeetingsToolbar
        filters={filters}
        onRangeChange={vi.fn()}
        onSearchChange={vi.fn()}
        onViewChange={vi.fn()}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('hide next, prev and today button when viewport is too small', () => {
    const { rerender } = render(
      <MeetingsToolbar
        filters={filters}
        onRangeChange={vi.fn()}
        onSearchChange={vi.fn()}
        onViewChange={vi.fn()}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    const todayButton = screen.getByRole('button', { name: 'Today' });
    const nextButton = screen.getByRole('button', { name: 'Next day' });
    const previousButton = screen.getByRole('button', {
      name: 'Previous day',
    });

    vi.mocked(useMediaQuery).mockReturnValue(false);

    rerender(
      <MeetingsToolbar
        filters={filters}
        onRangeChange={vi.fn()}
        onSearchChange={vi.fn()}
        onViewChange={vi.fn()}
        view="day"
      />,
    );

    expect(todayButton).not.toBeInTheDocument();
    expect(nextButton).not.toBeInTheDocument();
    expect(previousButton).not.toBeInTheDocument();
  });

  it('should hide the schedule button if the user has no permission to create meetings', async () => {
    render(
      <MeetingsToolbar
        filters={filters}
        onRangeChange={vi.fn()}
        onSearchChange={vi.fn()}
        onViewChange={vi.fn()}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    const scheduleButton = screen.getByRole('button', {
      name: /schedule meeting/i,
    });

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!room-id',
        content: { events: { 'net.nordeck.meetings.meeting.create': 101 } },
      }),
    );

    await waitFor(() => {
      expect(scheduleButton).not.toBeInTheDocument();
    });
  });
});
