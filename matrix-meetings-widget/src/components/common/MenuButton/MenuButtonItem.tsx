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

import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuItemProps,
} from '@mui/material';
import { DispatchWithoutAction, PropsWithChildren, ReactElement } from 'react';

/** Properties for {@link MenuButtonItem} */
type MenuButtonItemProps = PropsWithChildren<
  MenuItemProps & {
    /** The color of the icon and text of the icon */
    color?: string;

    /** The icon of the element */
    icon: ReactElement;

    /** A function that is called when the item is clicked. */
    onClick?: DispatchWithoutAction;
  }
>;

/**
 * An item in a menu. Use it in combination with {@link MenuButton}.
 */
export const MenuButtonItem = ({
  children,
  color,
  icon,
  onClick,
  ...menuItemProps
}: MenuButtonItemProps) => {
  return (
    <MenuItem onClick={onClick} sx={{ color }} {...menuItemProps}>
      <ListItemIcon sx={{ color }}>{icon}</ListItemIcon>
      <ListItemText primaryTypographyProps={{ noWrap: true }}>
        {children}
      </ListItemText>
    </MenuItem>
  );
};
