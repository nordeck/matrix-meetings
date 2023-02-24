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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import SendIcon from '@mui/icons-material/Send';
import {
  Alert,
  AlertTitle,
  CircularProgress,
  IconButton,
  InputAdornment,
  InputBase,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import {
  ChangeEvent,
  KeyboardEvent,
  ReactElement,
  useCallback,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useSendMessageToBreakoutSessionsMutation } from '../../../reducer/meetingsApi';

export function BreakoutSessionsMessageForm(): ReactElement {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const [message, setMessage] = useState('');

  const inputRef = useRef<HTMLTextAreaElement | undefined>();

  const [
    sendMessageToBreakoutSessions,
    { data, isLoading: isSubmitting, isError, reset },
  ] = useSendMessageToBreakoutSessionsMutation();

  const onClickSendMessage = useCallback(async () => {
    if (widgetApi.widgetParameters.roomId) {
      try {
        const { acknowledgement } = await sendMessageToBreakoutSessions({
          parentRoomId: widgetApi.widgetParameters.roomId,
          message,
        }).unwrap();

        if (acknowledgement.success || acknowledgement.timeout) {
          // reset the message
          setMessage('');
        } else {
          // refocus the input after an error
          inputRef.current?.focus();
        }
      } catch {
        // refocus the input after an error
        inputRef.current?.focus();
      }
    }
  }, [
    message,
    sendMessageToBreakoutSessions,
    widgetApi.widgetParameters.roomId,
  ]);

  const handleOnChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);

      // clear all errors
      reset();
    },
    [reset]
  );

  const handleOnKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onClickSendMessage();
      }
    },
    [onClickSendMessage]
  );

  const sendMessageLabel = t(
    'meetingsPanel.messageToAllBreakoutRoom.sendLabel',
    'Send message to all rooms'
  );

  const id = useId();

  return (
    <>
      <Typography component="h3" id={id} variant="h6">
        {t(
          'meetingsPanel.messageToAllBreakoutRoom.title',
          'Send message to all breakout session rooms'
        )}
      </Typography>

      <Stack alignItems="center" direction="row" gap={1}>
        <InputBase
          disabled={isSubmitting}
          endAdornment={
            isSubmitting && (
              <InputAdornment position="end">
                <CircularProgress color="inherit" size={16} />
              </InputAdornment>
            )
          }
          fullWidth
          inputProps={{ 'aria-labelledby': id, ref: inputRef }}
          multiline
          onChange={handleOnChange}
          onKeyDown={handleOnKeyDown}
          placeholder={t(
            'meetingsPanel.messageToAllBreakoutRoom.placeholder',
            'Send a message...'
          )}
          value={message}
        />

        <Tooltip placement="left" title={sendMessageLabel}>
          {/* span is needed to also show the tooltip if the button is disabled */}
          <span>
            <IconButton
              aria-label={sendMessageLabel}
              disabled={isSubmitting || !message?.length}
              onClick={onClickSendMessage}
              size="small"
              sx={{
                '&, &:hover': {
                  bgcolor: 'primary.main',
                  color: 'white',
                },
              }}
            >
              <SendIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {(isError || data?.acknowledgement.error) && (
        <Alert severity="error">
          <AlertTitle>
            {t(
              'meetingsPanel.messageToAllBreakoutRoom.sendFailedTitle',
              'Failed to send the message'
            )}
          </AlertTitle>
          {t(
            'meetingsPanel.messageToAllBreakoutRoom.sendFailed',
            'Please try again.'
          )}
        </Alert>
      )}

      {data?.acknowledgement.timeout && (
        <Alert role="status" severity="info">
          <AlertTitle>
            {t(
              'meetingsPanel.messageToAllBreakoutRoom.sendTimeoutTitle',
              'The request was sent'
            )}
          </AlertTitle>
          {t(
            'meetingsPanel.messageToAllBreakoutRoom.sendTimeout',
            'The change was submitted and will be applied soon.'
          )}
        </Alert>
      )}
    </>
  );
}
