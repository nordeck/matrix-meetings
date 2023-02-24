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

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { MeetingParticipant } from '../../../reducer/meetingsApi';

export function ParticipantMembershipIcon({
  participant,
}: {
  participant: MeetingParticipant;
}) {
  if (participant.membership === 'join') {
    return <CheckIcon color="success" fontSize="small" />;
  }

  if (participant.membership === 'invite') {
    return <QuestionMarkIcon color="warning" fontSize="small" />;
  }

  return <CloseIcon color="error" fontSize="small" />;
}
