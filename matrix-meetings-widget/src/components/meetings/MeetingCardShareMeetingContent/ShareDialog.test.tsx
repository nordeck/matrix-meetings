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

import { render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ShareDialog, useShareDialog } from './ShareDialog';

describe('<ShareDialog/>', () => {
  const onClose = vi.fn();

  it('should render without exploring', () => {
    render(
      <ShareDialog
        description="Description"
        onClose={onClose}
        open
        title="Title"
      />,
    );

    const dialog = screen.getByRole('dialog', { name: /title/i });

    expect(dialog).toHaveAccessibleDescription(/description/i);

    expect(
      within(dialog).getByRole('heading', { level: 3, name: /title/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/description/i)).toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: /close/i }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ShareDialog
        description="Description"
        onClose={onClose}
        open
        title="Title"
      />,
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should render children in the dialog', () => {
    render(
      <ShareDialog
        description="Description"
        onClose={onClose}
        open
        title="Title"
      >
        Children
      </ShareDialog>,
    );

    const dialog = screen.getByRole('dialog', { name: /title/i });

    expect(within(dialog).getByText(/children/i)).toBeInTheDocument();
  });

  it('should close the dialog', async () => {
    render(
      <ShareDialog
        description="Description"
        onClose={onClose}
        open
        title="Title"
      />,
    );

    const dialog = screen.getByRole('dialog', { name: /title/i });

    await userEvent.click(
      within(dialog).getByRole('button', { name: /close/i }),
    );

    expect(onClose).toBeCalled();
  });
});

describe('useShareDialog', () => {
  it('should open and close', async () => {
    const { result } = renderHook(() => useShareDialog());

    expect(result.current.open).toBe(false);

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.open).toBe(true);

    act(() => {
      result.current.onClose();
    });

    expect(result.current.open).toBe(false);
  });
});
