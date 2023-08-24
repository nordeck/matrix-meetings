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

import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, Menu } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import React, {
  DispatchWithoutAction,
  MouseEvent,
  PropsWithChildren,
  useCallback,
  useState,
} from 'react';

/** Props for {@link MenuButton} */
type MenuButtonProps = PropsWithChildren<{
  /** The label of the button that opens the menu. */
  buttonLabel: string;

  /** The description of the button that opens the menu. */
  'aria-describedby'?: string;

  /** A function that is called when the menu is opened. */
  onOpen?: DispatchWithoutAction;
}>;

/**
 * A menu that is opened by an icon button. Use it in combination with
 * {@link MenuButtonItem}.
 *
 * The menu will automatically be closed once one of the menu items is clicked.
 */
export function MenuButton({
  children,
  'aria-describedby': ariaDescribedBy,
  buttonLabel,
  onOpen,
}: MenuButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onOpen?.();
      setAnchorEl(event.currentTarget);
    },
    [onOpen],
  );
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const menuId = useId();
  const buttonId = useId();

  return (
    <>
      <IconButton
        aria-controls={open ? menuId : undefined}
        aria-describedby={ariaDescribedBy}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        aria-label={buttonLabel}
        id={buttonId}
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        MenuListProps={{
          'aria-labelledby': buttonId,
          dense: true,
          color: 'primary',
        }}
        anchorEl={anchorEl}
        id={menuId}
        onClose={handleClose}
        open={open}
      >
        {React.Children.map(children, (element) => {
          if (
            React.isValidElement<{ onClick: DispatchWithoutAction }>(element)
          ) {
            return React.cloneElement(element, {
              // override the onClick property to close the menu
              // when the entry is clicked.
              onClick: () => {
                handleClose();
                element.props.onClick?.();
              },
            });
          }

          return element;
        })}
      </Menu>
    </>
  );
}
