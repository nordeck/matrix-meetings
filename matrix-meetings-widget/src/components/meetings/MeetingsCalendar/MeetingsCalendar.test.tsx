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

import { extractWidgetApiParameters } from '@matrix-widget-toolkit/api';
import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import {
  mockCalendar,
  mockConfigEndpoint,
  mockCreateMeetingRoom,
  mockMeetingSharingInformationEndpoint,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { MeetingsCalendar } from './MeetingsCalendar';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  extractWidgetApiParameters: jest.fn(),
}));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

// The DOM is quite complex and big, therefore we have to increase the timeout
jest.setTimeout(15000);

describe('<MeetingsCalendar/>', () => {
  const onShowMore = jest.fn();

  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    jest.mocked(extractWidgetApiParameters).mockReturnValue({
      clientOrigin: 'http://element.local',
      widgetId: '',
    });

    mockConfigEndpoint(server);
    mockMeetingSharingInformationEndpoint(server);

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-0',
      name: { name: 'Meeting 0' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20201228T080000',
          dtend: '20201228T090000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-1',
      name: { name: 'Meeting 1' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20210101T080000',
          dtend: '20210101T090000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-2',
      name: { name: 'Meeting 2' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20210101T100000',
          dtend: '20210101T140000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-3',
      name: { name: 'Meeting 3' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20210101T120000',
          dtend: '20210101T130000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-4',
      name: { name: 'Meeting 4' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20210101T140000',
          dtend: '20210101T150000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-5',
      name: { name: 'Meeting 5' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20210102T140000',
          dtend: '20210102T150000',
        }),
      },
    });

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-6',
      name: { name: 'Meeting 6' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20210102T100000',
          dtend: '20210102T140000',
        }),
      },
      roomOptions: {
        skipParentEvent: true,
      },
    });

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const [store] = useState(() => {
        const store = createStore({ widgetApi });
        initializeStore(store);
        return store;
      });
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };

    // We mock the offsetHeight as js-dom is not providing layout causing
    // fullcalendar not being able to calculate the size of the events and
    // hiding them instead.
    jest
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(() => 10);

    // We also mock getBoundingClientRect to support the more link
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 1,
      height: 1,
      left: 1,
      right: 1,
      top: 1,
      width: 1,
      x: 1,
      y: 1,
      toJSON: jest.fn(),
    });
  });

  it('should render day view', async () => {
    render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2021-01-02T00:00:00Z',
          endDate: '2021-01-02T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    const weekDays = screen.getAllByRole('gridcell');

    expect(weekDays).toHaveLength(1);
    expect(
      await within(weekDays[0]).findByText('Meeting 5'),
    ).toBeInTheDocument();
    expect(
      within(weekDays[0]).getByRole('button', {
        name: /January 2, 2021(,| at) 2:00 PM–3:00 PM: “Meeting 5” by Alice/,
      }),
    ).toBeInTheDocument();
  });

  it('should render day view when displayAllMeetings', async () => {
    render(
      <MeetingsCalendar
        displayAllMeetings
        filters={{
          filterText: '',
          startDate: '2021-01-02T00:00:00Z',
          endDate: '2021-01-02T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    const weekDays = screen.getAllByRole('gridcell');

    expect(weekDays).toHaveLength(1);
    expect(
      await within(weekDays[0]).findByText('Meeting 5'),
    ).toBeInTheDocument();
    expect(
      within(weekDays[0]).getByRole('button', {
        name: /January 2, 2021(,| at) 2:00 PM–3:00 PM: “Meeting 5” by Alice/,
      }),
    ).toBeInTheDocument();

    expect(
      await within(weekDays[0]).findByText('Meeting 6'),
    ).toBeInTheDocument();
    expect(
      within(weekDays[0]).getByRole('button', {
        name: /January 2, 2021(,| at) 10:00 AM–2:00 PM: “Meeting 6” by Alice/,
      }),
    ).toBeInTheDocument();

    expect(within(weekDays[0]).getAllByRole('button')).toHaveLength(2);
  });

  it('should have no accessibility violations for day view', async () => {
    const { container } = render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2021-01-02T00:00:00Z',
          endDate: '2021-01-02T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    expect(
      await screen.findByRole('button', { name: /Meeting 5/ }),
    ).toBeInTheDocument();

    // disabled aria-required-children because structure of roles is not correct
    // in fullcalendar
    expect(
      await axe(container, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });

  it('should render work week view', async () => {
    render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2020-12-28T00:00:00Z',
          endDate: '2021-01-01T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="workWeek"
      />,
      { wrapper: Wrapper },
    );

    const weekDays = screen.getAllByRole('gridcell');

    expect(weekDays).toHaveLength(5);
    expect(
      await within(weekDays[0]).findByText('Meeting 0'),
    ).toBeInTheDocument();
    expect(
      within(weekDays[0]).getByRole('button', {
        name: /December 28, 2020(,| at) 8:00 AM–9:00 AM: “Meeting 0” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(weekDays[4]).getByText('Meeting 1')).toBeInTheDocument();
    expect(
      within(weekDays[4]).getByRole('button', {
        name: /January 1, 2021(,| at) 8:00 AM–9:00 AM: “Meeting 1” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(weekDays[4]).getByText('Meeting 2')).toBeInTheDocument();
    expect(
      within(weekDays[4]).getByRole('button', {
        name: /January 1, 2021(,| at) 10:00 AM–2:00 PM: “Meeting 2” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(weekDays[4]).getByText('Meeting 3')).toBeInTheDocument();
    expect(
      within(weekDays[4]).getByRole('button', {
        name: /January 1, 2021(,| at) 12:00 PM–1:00 PM: “Meeting 3” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(weekDays[4]).getByText('Meeting 4')).toBeInTheDocument();
    expect(
      within(weekDays[4]).getByRole('button', {
        name: /January 1, 2021(,| at) 2:00 PM–3:00 PM: “Meeting 4” by Alice/,
      }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations for work week view', async () => {
    const { container } = render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2020-12-28T00:00:00Z',
          endDate: '2021-01-01T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="workWeek"
      />,
      { wrapper: Wrapper },
    );

    expect(await screen.findByText('Meeting 0')).toBeInTheDocument();

    // disabled aria-required-children because structure of roles is not correct
    // in fullcalendar
    expect(
      await axe(container, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });

  it('should render week view', async () => {
    render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2020-12-27T00:00:00Z',
          endDate: '2021-01-02T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="week"
      />,
      { wrapper: Wrapper },
    );

    const weekDays = screen.getAllByRole('gridcell');

    expect(weekDays).toHaveLength(7);
    expect(
      await within(weekDays[1]).findByText('Meeting 0'),
    ).toBeInTheDocument();
    expect(
      within(weekDays[1]).getByRole('button', {
        name: /December 28, 2020(,| at) 8:00 AM–9:00 AM: “Meeting 0” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(weekDays[5]).getByText('Meeting 1')).toBeInTheDocument();
    expect(
      within(weekDays[5]).getByRole('button', {
        name: /January 1, 2021(,| at) 8:00 AM–9:00 AM: “Meeting 1” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(weekDays[5]).getByText('Meeting 2')).toBeInTheDocument();
    expect(
      within(weekDays[5]).getByRole('button', {
        name: /January 1, 2021(,| at) 10:00 AM–2:00 PM: “Meeting 2” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(weekDays[5]).getByText('Meeting 3')).toBeInTheDocument();
    expect(
      within(weekDays[5]).getByRole('button', {
        name: /January 1, 2021(,| at) 12:00 PM–1:00 PM: “Meeting 3” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(weekDays[5]).getByText('Meeting 4')).toBeInTheDocument();
    expect(
      within(weekDays[5]).getByRole('button', {
        name: /January 1, 2021(,| at) 2:00 PM–3:00 PM: “Meeting 4” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(weekDays[6]).getByText('Meeting 5')).toBeInTheDocument();
    expect(
      within(weekDays[6]).getByRole('button', {
        name: /January 2, 2021(,| at) 2:00 PM–3:00 PM: “Meeting 5” by Alice/,
      }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations for week view', async () => {
    const { container } = render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2020-12-27T00:00:00Z',
          endDate: '2021-01-03T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="week"
      />,
      { wrapper: Wrapper },
    );

    expect(await screen.findByText('Meeting 0')).toBeInTheDocument();

    // disabled aria-required-children because structure of roles is not correct
    // in fullcalendar
    expect(
      await axe(container, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });

  it('should render month view', async () => {
    render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2020-12-01T00:00:00Z',
          endDate: '2020-12-31T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="month"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getAllByRole('gridcell')).toHaveLength(5 * 7);
    const day28 = screen.getByRole('gridcell', { name: /^december 28, 2020/i });
    const day1 = screen.getByRole('gridcell', { name: /^january 1, 2021/i });
    const day2 = screen.getByRole('gridcell', { name: /^january 2, 2021/i });

    expect(await within(day28).findByText('Meeting 0')).toBeInTheDocument();
    expect(
      within(day28).getByRole('button', {
        name: /December 28, 2020(,| at) 8:00 AM–9:00 AM: “Meeting 0” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(day1).getByText('Meeting 1')).toBeInTheDocument();
    expect(
      within(day1).getByRole('button', {
        name: /January 1, 2021(,| at) 8:00 AM–9:00 AM: “Meeting 1” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(within(day1).getByText('Meeting 2')).toBeInTheDocument();
    expect(
      within(day1).getByRole('button', {
        name: /January 1, 2021(,| at) 10:00 AM–2:00 PM: “Meeting 2” by Alice/,
      }),
    ).toBeInTheDocument();
    expect(
      within(day1).getByRole('button', {
        name: 'Show 2 more events',
      }),
    ).toBeInTheDocument();
    expect(within(day2).getByText('Meeting 5')).toBeInTheDocument();
    expect(
      within(day2).getByRole('button', {
        name: /January 2, 2021(,| at) 2:00 PM–3:00 PM: “Meeting 5” by Alice/,
      }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations for month view', async () => {
    const { container } = render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2020-12-01T00:00:00Z',
          endDate: '2020-12-31T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="month"
      />,
      { wrapper: Wrapper },
    );

    expect(await screen.findByText('Meeting 0')).toBeInTheDocument();

    // disabled aria-required-children because structure of roles is not correct
    //in fullcalendar
    expect(
      await axe(container, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });

  it('should handle more click', async () => {
    render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2020-12-28T00:00:00Z',
          endDate: '2021-01-31T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="month"
      />,
      { wrapper: Wrapper },
    );

    const day1 = screen.getByRole('gridcell', { name: /^january 1, 2021/i });
    await userEvent.click(
      await within(day1).findByRole('button', {
        name: 'Show 2 more events',
      }),
    );

    expect(onShowMore).toBeCalledWith(new Date('2021-01-01T00:00:00.000Z'));
  });

  it('should switch views', async () => {
    const { rerender } = render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2021-01-02T00:00:00Z',
          endDate: '2021-01-02T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getAllByRole('gridcell')).toHaveLength(1);
    expect(await screen.findByText('Meeting 5')).toBeInTheDocument();

    rerender(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2020-12-28T00:00:00Z',
          endDate: '2021-01-01T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="workWeek"
      />,
    );

    expect(screen.getAllByRole('gridcell')).toHaveLength(5);
    expect(await screen.findByText('Meeting 0')).toBeInTheDocument();
  });

  it('should handle new meetings', async () => {
    render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2021-01-02T00:00:00Z',
          endDate: '2021-01-02T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    expect(await screen.findByText('Meeting 5')).toBeInTheDocument();

    mockCreateMeetingRoom(widgetApi, {
      room_id: '!meeting-room-id-6',
      name: { name: 'Meeting 6' },
      metadata: {
        calendar: mockCalendar({
          dtstart: '20210102T140000',
          dtend: '20210102T150000',
        }),
      },
    });

    expect(await screen.findByText('Meeting 6')).toBeInTheDocument();
  });

  it('should open expended meeting view details', async () => {
    render(
      <MeetingsCalendar
        filters={{
          filterText: '',
          startDate: '2021-01-02T00:00:00Z',
          endDate: '2021-01-02T23:59:59Z',
        }}
        onShowMore={onShowMore}
        view="day"
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: /January 2, 2021(,| at) 2:00 PM–3:00 PM: “Meeting 5” by Alice/,
      }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Meeting 5',
      description: 'January 2, 2021, 2:00 – 3:00 PM',
    });

    expect(within(dialog).getByText('Meeting 5')).toBeInTheDocument();
    expect(within(dialog).getByText('A brief description')).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: /close/i }),
    );

    // There is an animation closing the dialog
    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
  });
});
