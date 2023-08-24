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
import { HeadingDivider } from './HeadingDivider';

describe('<HeadingDivider/>', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<HeadingDivider />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations with children', async () => {
    const { container } = render(
      <HeadingDivider>
        <div>
          <h1>Hallo</h1>
        </div>
      </HeadingDivider>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render children', async () => {
    render(
      <HeadingDivider>
        <div>
          <h1>Hello</h1>
        </div>
      </HeadingDivider>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /hello/i }),
    ).toBeInTheDocument();
  });
});
