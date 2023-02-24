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
import PeopleIcon from '@mui/icons-material/People';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import {
  ChangeEvent,
  Dispatch,
  ReactElement,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useTranslation } from 'react-i18next';
import { ellipsis } from '../../../../lib/ellipsis';
import {
  makeSelectAllRoomMemberEventsByRoomId,
  Meeting,
} from '../../../../reducer/meetingsApi';
import { useAppSelector } from '../../../../store';
import { HeadingDivider } from '../../../common/HeadingDivider';
import { BreakoutSessionGroupForm } from './BreakoutSessionGroupForm';
import { initializer, reducer } from './state';
import { BreakoutSessionGroup } from './types';

type BreakoutSessionGroupsFormProps = {
  parentMeeting: Meeting;
  onGroupsChange: Dispatch<SetStateAction<BreakoutSessionGroup[]>>;
};

export function BreakoutSessionGroupsForm({
  parentMeeting,
  onGroupsChange,
}: BreakoutSessionGroupsFormProps): ReactElement {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const [
    { groups, groupsCount, selectableMemberEvents, validMemberEvents },
    dispatch,
  ] = useReducer(
    reducer,
    {
      t,
      ownUserId: widgetApi.widgetParameters.userId,
    },
    initializer
  );

  const selectAllRoomMemberEventsByRoomId = useMemo(
    makeSelectAllRoomMemberEventsByRoomId,
    []
  );
  const allRoomMembers = useAppSelector((state) =>
    selectAllRoomMemberEventsByRoomId(state, parentMeeting.meetingId)
  );

  const tooManyGroupsError = groupsCount > validMemberEvents.length;

  // forward result to parent
  useEffect(() => {
    onGroupsChange(tooManyGroupsError ? [] : groups);
  }, [groups, onGroupsChange, tooManyGroupsError]);

  // keep the state up-to-date
  useEffect(() => {
    dispatch({
      type: 'replaceCtx',
      ctx: {
        t,
        allMemberEvents: allRoomMembers,
        ownUserId: widgetApi.widgetParameters.userId,
      },
    });
  }, [allRoomMembers, t, widgetApi.widgetParameters.userId]);

  const handleChangeGroupNumber = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch({
        type: 'updateCount',
        count: Number.parseInt(e.target.value) || 1,
      });
    },
    []
  );

  const handleGroupChange = useCallback((groupIndex: number) => {
    return (group: Partial<BreakoutSessionGroup>) =>
      dispatch({
        type: 'updateGroup',
        groupIndex,
        group,
      });
  }, []);

  const handleClickDistributeAllRoomMembers = useCallback(() => {
    dispatch({ type: 'distributeAll' });
  }, []);

  const headingId = useId();
  const groupCountId = useId();

  return (
    <Box aria-labelledby={headingId} component="section" flex="1" mt={2}>
      <HeadingDivider>
        <Typography component="h3" id={headingId} sx={ellipsis} variant="h4">
          {t('setupBreakoutSessions.groups', 'Groups')}
        </Typography>
      </HeadingDivider>

      <Grid container spacing={{ xs: 1, sm: 2 }}>
        <Grid item sm={6} xs={12}>
          <TextField
            // don't use the required property of the text field because we don't
            // want it to add a asterisk (*) to the title.
            InputProps={{ required: true }}
            error={groupsCount > validMemberEvents.length}
            fullWidth
            helperText={
              groupsCount > validMemberEvents.length &&
              t(
                'setupBreakoutSessions.groupNumberErrorMessage',
                'There are not enough participants for the number of groups you have entered.'
              )
            }
            id={groupCountId}
            inputProps={{
              inputMode: 'numeric',
              type: 'number',
              min: 1,
              max: Math.max(1, validMemberEvents.length),
            }}
            label={t(
              'setupBreakoutSessions.groupNumber',
              'Number of groups (required)'
            )}
            margin="dense"
            onChange={handleChangeGroupNumber}
            sx={{ minWidth: '50%' }}
            value={groupsCount}
          />
        </Grid>

        <Grid
          alignItems="flex-start"
          display="flex"
          item
          mt={{ xs: 0, sm: 1 }}
          sm={6}
          xs={12}
        >
          <Button
            disabled={validMemberEvents.length < 1 || groups.length === 0}
            fullWidth
            onClick={handleClickDistributeAllRoomMembers}
            startIcon={<PeopleIcon />}
            variant="contained"
          >
            {t('setupBreakoutSessions.distributeAllRoomMembers', {
              amount: validMemberEvents.length,
              defaultValue: 'Distribute all {{amount}} participants',
            })}
          </Button>
        </Grid>
      </Grid>

      {selectableMemberEvents.length > 0 &&
      selectableMemberEvents.length <= validMemberEvents.length ? (
        <Alert role="status" severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>
            {t('setupBreakoutSessions.notAssignedTitle', 'Note')}
          </AlertTitle>

          {t(
            'setupBreakoutSessions.notAssignedMessage',
            'Some participants are not assigned to a group.'
          )}
        </Alert>
      ) : null}

      <Box aria-labelledby={headingId} component="ul" p={0}>
        {groups.map((group, groupIndex) => (
          <BreakoutSessionGroupForm
            allMemberEvents={allRoomMembers}
            group={group}
            key={groupIndex}
            onGroupChange={handleGroupChange(groupIndex)}
            selectableMemberEvents={selectableMemberEvents}
          />
        ))}
      </Box>
    </Box>
  );
}
