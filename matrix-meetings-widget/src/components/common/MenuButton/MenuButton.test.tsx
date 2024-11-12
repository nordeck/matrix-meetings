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

import DeleteIcon from '@mui/icons-material/Delete';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { MenuButton } from './MenuButton';
import { MenuButtonItem } from './MenuButtonItem';

describe('<MenuButton/>', () => {
  it('should render without exploding', () => {
    render(
      <MenuButton buttonLabel="Settings">
        <MenuButtonItem icon={<DeleteIcon />}>Delete</MenuButtonItem>
      </MenuButton>,
    );

    const button = screen.getByRole('button', { name: /settings/i });

    expect(button).toHaveAttribute('aria-haspopup', 'true');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MenuButton buttonLabel="Settings">
        <MenuButtonItem icon={<DeleteIcon />}>Delete</MenuButtonItem>
      </MenuButton>,
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, if menu is open', async () => {
    const { container } = render(
      <MenuButton buttonLabel="Settings">
        <MenuButtonItem icon={<DeleteIcon />}>Delete</MenuButtonItem>
      </MenuButton>,
    );

    await userEvent.click(screen.getByRole('button', { name: /settings/i }));

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should open the menu', async () => {
    render(
      <MenuButton buttonLabel="Settings">
        <MenuButtonItem icon={<DeleteIcon />}>Delete</MenuButtonItem>
      </MenuButton>,
    );

    await userEvent.click(screen.getByRole('button', { name: /settings/i }));

    const button = screen.getByRole('button', {
      name: /settings/i,
      expanded: true,

      // the button is hidden due to the focus locking of the menu
      hidden: true,
    });

    expect(button).toHaveAttribute('aria-controls');

    expect(screen.getByRole('menu', { name: /settings/i })).toBeInTheDocument();
  });

  it('should trigger a callback when the menu is opened', async () => {
    const onOpen = vi.fn();

    render(
      <MenuButton buttonLabel="Settings" onOpen={onOpen}>
        <MenuButtonItem icon={<DeleteIcon />}>Delete</MenuButtonItem>
      </MenuButton>,
    );

    await userEvent.click(screen.getByRole('button', { name: /settings/i }));

    expect(onOpen).toBeCalledTimes(1);
  });

  it('should close the menu on item click', async () => {
    render(
      <MenuButton buttonLabel="Settings">
        <MenuButtonItem icon={<DeleteIcon />}>Delete</MenuButtonItem>
      </MenuButton>,
    );

    await userEvent.click(screen.getByRole('button', { name: /settings/i }));

    const menu = screen.getByRole('menu', { name: /settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /delete/i }),
    );

    await waitFor(() => {
      expect(menu).not.toBeInTheDocument();
    });

    screen.getByRole('button', { name: /settings/i });
  });

  it('should have accessible description', () => {
    render(
      <>
        <p id="id">Example Context</p>
        <MenuButton aria-describedby="id" buttonLabel="Settings">
          <MenuButtonItem icon={<DeleteIcon />}>Delete</MenuButtonItem>
        </MenuButton>
      </>,
    );

    const button = screen.getByRole('button', { name: /settings/i });

    expect(button).toHaveAccessibleDescription(/example context/i);
  });
});
