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

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

describe('<ConfirmDeleteDialog/>', () => {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();

  it('should render without exploding', () => {
    const { container } = render(
      <ConfirmDeleteDialog
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open={false}
        title="Confirm the deletion"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ConfirmDeleteDialog
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Confirm the deletion"
      />,
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations while loading', async () => {
    const { container } = render(
      <ConfirmDeleteDialog
        confirmTitle="Confirm"
        description="The description of the modal"
        loading
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Confirm the deletion"
      />,
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should open a confirm dialog if opened', async () => {
    render(
      <ConfirmDeleteDialog
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Confirm the deletion"
      />,
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /confirm the deletion/i,
    });

    expect(
      within(deleteModal).getByText(/confirm the deletion/i),
    ).toBeInTheDocument();

    expect(deleteModal).toHaveAccessibleDescription(
      /the description of the modal/i,
    );

    expect(
      within(deleteModal).getByText(/the description of the modal/i),
    ).toBeInTheDocument();

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Confirm' }),
    );

    expect(onConfirm).toBeCalledTimes(1);
    expect(onCancel).not.toBeCalled();
  });

  it('should do nothing if the user cancels the deletion', async () => {
    render(
      <ConfirmDeleteDialog
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Confirm the deletion"
      />,
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /confirm the deletion/i,
    });

    expect(
      within(deleteModal).getByText(/confirm the deletion/i),
    ).toBeInTheDocument();

    expect(deleteModal).toHaveAccessibleDescription(
      /the description of the modal/i,
    );

    expect(
      within(deleteModal).getByText(/the description of the modal/i),
    ).toBeInTheDocument();

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Cancel' }),
    );

    expect(onConfirm).not.toBeCalled();
    expect(onCancel).toBeCalledTimes(1);
  });

  it('should render additional buttons', async () => {
    render(
      <ConfirmDeleteDialog
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Confirm the deletion"
        additionalButtons={<button>Example</button>}
      />,
    );

    const deleteModal = screen.getByRole('dialog', {
      name: 'Confirm the deletion',
    });

    expect(
      within(deleteModal).getByRole('button', { name: 'Example' }),
    ).toBeInTheDocument();
  });

  it('should call onEnter every time the dialog is displayed', async () => {
    const onEnter = vi.fn();

    const { rerender } = render(
      <ConfirmDeleteDialog
        open
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        onEnter={onEnter}
        title="Confirm the deletion"
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onEnter).toBeCalledTimes(1);

    rerender(
      <ConfirmDeleteDialog
        open={false}
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        onEnter={onEnter}
        title="Confirm the deletion"
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(onEnter).toBeCalledTimes(1);

    rerender(
      <ConfirmDeleteDialog
        open
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        onEnter={onEnter}
        title="Confirm the deletion"
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onEnter).toBeCalledTimes(2);
  });
});
