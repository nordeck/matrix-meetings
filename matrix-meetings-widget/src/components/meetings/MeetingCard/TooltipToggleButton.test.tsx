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

import { ToggleButtonGroup } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { TooltipToggleButton } from './TooltipToggleButton';

describe('<TooltipToggleButton/>', () => {
  it('should render without exploding', () => {
    render(
      <TooltipToggleButton TooltipProps={{ title: 'Example' }} value="test" />,
    );

    expect(
      screen.getByRole('button', { name: /example/i }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <>
        <TooltipToggleButton
          TooltipProps={{ title: 'Example' }}
          expandedId="expanded-id"
          value="test"
        />
        <div id="expanded-id">Test</div>
      </>,
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations if expanded', async () => {
    const { container } = render(
      <>
        <TooltipToggleButton
          TooltipProps={{ title: 'Example' }}
          expandedId="expanded-id"
          selected
          value="test"
        />
        <div id="expanded-id">Test</div>
      </>,
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should add aria-expanded and aria-controls', () => {
    const { rerender } = render(
      <>
        <TooltipToggleButton
          TooltipProps={{ title: 'Example' }}
          expandedId="expanded-id"
          value="test"
        />
        <div id="expanded-id">Test</div>
      </>,
    );

    const button1 = screen.getByRole('button', { name: /example/i });
    expect(button1).not.toHaveAttribute('aria-expanded');
    expect(button1).not.toHaveAttribute('aria-controls');

    rerender(
      <>
        <TooltipToggleButton
          TooltipProps={{ title: 'Example' }}
          expandedId="expanded-id"
          selected
          value="test"
        />
        <div id="expanded-id">Test</div>
      </>,
    );

    const button2 = screen.getByRole('button', {
      name: /example/i,
      expanded: true,
    });
    expect(button2).toHaveAttribute('aria-controls', 'expanded-id');
  });

  it('should be usable in a ToggleButtonGroup', async () => {
    const onChange = vi.fn();

    const { rerender } = render(
      <ToggleButtonGroup exclusive onChange={onChange}>
        <TooltipToggleButton TooltipProps={{ title: 'Option A' }} value="a" />
        <TooltipToggleButton TooltipProps={{ title: 'Option B' }} value="b" />
      </ToggleButtonGroup>,
    );

    await userEvent.click(
      screen.getByRole('button', { pressed: false, name: 'Option A' }),
    );

    expect(onChange).toBeCalledWith(expect.anything(), 'a');
    rerender(
      <ToggleButtonGroup exclusive onChange={onChange} value="a">
        <TooltipToggleButton TooltipProps={{ title: 'Option A' }} value="a" />
        <TooltipToggleButton TooltipProps={{ title: 'Option B' }} value="b" />
      </ToggleButtonGroup>,
    );

    expect(
      screen.getByRole('button', { pressed: true, name: 'Option A' }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { pressed: false, name: 'Option B' }),
    );

    expect(onChange).toBeCalledWith(expect.anything(), 'b');
    rerender(
      <ToggleButtonGroup exclusive onChange={onChange} value="b">
        <TooltipToggleButton TooltipProps={{ title: 'Option A' }} value="a" />
        <TooltipToggleButton TooltipProps={{ title: 'Option B' }} value="b" />
      </ToggleButtonGroup>,
    );

    expect(
      screen.getByRole('button', { pressed: false, name: 'Option A' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { pressed: true, name: 'Option B' }),
    ).toBeInTheDocument();
  });
});
