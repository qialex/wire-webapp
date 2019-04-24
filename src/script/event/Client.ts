/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

enum CALL {
  E_CALL = 'call.e-call',
}

enum CONVERSATION {
  ASSET_ADD = 'conversation.asset-add',
  CONFIRMATION = 'conversation.confirmation',
  DELETE_EVERYWHERE = 'conversation.delete-everywhere',
  GROUP_CREATION = 'conversation.group-creation',
  INCOMING_MESSAGE_TOO_BIG = 'conversation.incoming-message-too-big',
  KNOCK = 'conversation.knock',
  LOCATION = 'conversation.location',
  MESSAGE_ADD = 'conversation.message-add',
  MESSAGE_DELETE = 'conversation.message-delete',
  MESSAGE_HIDDEN = 'conversation.message-hidden',
  MISSED_MESSAGES = 'conversation.missed-messages',
  ONE2ONE_CREATION = 'conversation.one2one-creation',
  REACTION = 'conversation.reaction',
  TEAM_MEMBER_LEAVE = 'conversation.team-member-leave',
  UNABLE_TO_DECRYPT = 'conversation.unable-to-decrypt',
  VERIFICATION = 'conversation.verification',
  VOICE_CHANNEL_ACTIVATE = 'conversation.voice-channel-activate',
  VOICE_CHANNEL_DEACTIVATE = 'conversation.voice-channel-deactivate',
}

enum USER {
  AVAILABILITY = 'user.availability',
}

export const ClientEvent = {
  CALL,
  CONVERSATION,
  USER,
};
