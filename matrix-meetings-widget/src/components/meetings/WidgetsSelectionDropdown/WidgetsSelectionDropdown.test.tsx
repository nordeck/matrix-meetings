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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockWidgetEndpoint } from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { WidgetsSelectionDropdown } from './WidgetsSelectionDropdown';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi({ userId: 'user-charlie' })));

describe('<WidgetsSelectionDropdown>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    mockWidgetEndpoint(server);

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should render without exploding', async () => {
    render(
      <WidgetsSelectionDropdown
        onChange={jest.fn()}
        selectedWidgets={['widget-1']}
      />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByRole('combobox', {
        name: 'Widgets',
        description: /0 of 0 entries selected./,
      })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    expect(
      screen.getByRole('combobox', {
        name: 'Widgets',
        description: /1 of 2 entries selected./,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Widget 1',
        description: /Use the backspace key/,
      })
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations, while loading', async () => {
    const { container } = render(
      <WidgetsSelectionDropdown onChange={jest.fn()} selectedWidgets={[]} />,
      { wrapper: Wrapper }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, after load', async () => {
    const { container } = render(
      <WidgetsSelectionDropdown onChange={jest.fn()} selectedWidgets={[]} />,
      { wrapper: Wrapper }
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should start empty', async () => {
    const onChange = jest.fn();

    render(
      <WidgetsSelectionDropdown onChange={onChange} selectedWidgets={[]} />,
      { wrapper: Wrapper }
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    expect(onChange).not.toBeCalled();
  });

  it('should start with all widgets selected if enabled', async () => {
    const onChange = jest.fn();

    render(
      <WidgetsSelectionDropdown
        autoSelectAllWidgets
        onChange={onChange}
        selectedWidgets={[]}
      />,
      { wrapper: Wrapper }
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    expect(onChange).toBeCalledWith(['widget-1', 'widget-2']);
  });

  it('should not enable any optional widgets', async () => {
    mockWidgetEndpoint(server, {
      widgets: [
        { id: 'widget-1', name: 'Widget 1' },
        { id: 'widget-2', name: 'Widget 2', optional: true },
      ],
    });

    const onChange = jest.fn();

    render(
      <WidgetsSelectionDropdown
        autoSelectAllWidgets
        onChange={onChange}
        selectedWidgets={[]}
      />,
      { wrapper: Wrapper }
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    expect(onChange).toBeCalledWith(['widget-1']);
  });

  it('should select a widget', async () => {
    const onChange = jest.fn();

    render(
      <WidgetsSelectionDropdown onChange={onChange} selectedWidgets={[]} />,
      { wrapper: Wrapper }
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Widgets', expanded: false })
    );
    await userEvent.click(screen.getByRole('option', { name: 'Widget 1' }));

    expect(onChange).toBeCalledWith(['widget-1']);
  });

  it('should show a message if all widgets are selected', async () => {
    render(
      <WidgetsSelectionDropdown
        onChange={jest.fn()}
        selectedWidgets={['widget-1', 'widget-2']}
      />,
      { wrapper: Wrapper }
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Widgets', expanded: false })
    );
    expect(
      screen.getByText(/All available widgets are already active/)
    ).toBeInTheDocument();
  });

  it('should show a message if no widgets are available', async () => {
    server.use(
      rest.get('http://localhost/v1/widget/list', (_, res, ctx) =>
        res(ctx.json([]))
      )
    );

    render(
      <WidgetsSelectionDropdown
        onChange={jest.fn()}
        selectedWidgets={['widget-1', 'widget-2']}
      />,
      { wrapper: Wrapper }
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Widgets', expanded: false })
    );
    expect(screen.getByText(/No Widgets/)).toBeInTheDocument();
  });

  it('should show a message if widgets could not be loaded', async () => {
    server.use(
      rest.get('http://localhost/v1/widget/list', (_, res, ctx) =>
        res(ctx.status(500))
      )
    );

    render(
      <WidgetsSelectionDropdown
        onChange={jest.fn()}
        selectedWidgets={['widget-1', 'widget-2']}
      />,
      { wrapper: Wrapper }
    );

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Widgets', expanded: false })
    );
    expect(
      screen.getByText(/Error while loading available Widgets/)
    ).toBeInTheDocument();
  });
});
