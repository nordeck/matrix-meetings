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

/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  AdminApis,
  EventContext,
  IdentityClient,
  IJoinRoomStrategy,
  IPreprocessor,
  IStorageProvider,
  MatrixClient,
  MatrixProfileInfo,
  Membership,
  MembershipEvent,
  Metrics,
  OpenIDConnectToken,
  PowerLevelBounds,
  Presence,
  RoomDirectoryLookupResponse,
  RoomReference,
  Space,
  SpaceCreateOptions,
  UnstableApis,
} from 'matrix-bot-sdk';

/**
 * Abstract implementation of Matrix Client
 */
export abstract class AbstractMatrixClient extends MatrixClient {
  get storageProvider(): IStorageProvider {
    throw new Error('unsupported method storageProvider');
  }

  set metrics(metrics: Metrics) {
    throw new Error('unsupported method metrics');
  }

  get unstableApis(): UnstableApis {
    throw new Error('unsupported method unstableApis');
  }

  get adminApis(): AdminApis {
    throw new Error('unsupported method adminApis');
  }

  impersonateUserId(userId: string) {
    throw new Error('unsupported method impersonateUserId');
  }

  getIdentityServerClient(identityServerName: string): Promise<IdentityClient> {
    throw new Error('unsupported method getIdentityServerClient');
  }

  setJoinStrategy(strategy: IJoinRoomStrategy) {
    throw new Error('unsupported method setJoinStrategy');
  }

  addPreprocessor(preprocessor: IPreprocessor) {
    throw new Error('unsupported method addPreprocessor');
  }

  getOpenIDConnectToken(): Promise<OpenIDConnectToken> {
    throw new Error('unsupported method getOpenIDConnectToken');
  }

  getAccountData<T>(eventType: string): Promise<T> {
    throw new Error('unsupported method getAccountData');
  }

  getRoomAccountData<T>(eventType: string, roomId: string): Promise<T> {
    throw new Error('unsupported method getRoomAccountData');
  }

  getSafeAccountData<T>(eventType: string, defaultContent?: T): Promise<T> {
    throw new Error('unsupported method');
  }

  getSafeRoomAccountData<T>(
    eventType: string,
    roomId: string,
    defaultContent?: T,
  ): Promise<T> {
    throw new Error('unsupported method getSafeRoomAccountData');
  }

  setAccountData(eventType: string, content: any): Promise<any> {
    throw new Error('unsupported method setAccountData');
  }

  setRoomAccountData(
    eventType: string,
    roomId: string,
    content: any,
  ): Promise<any> {
    throw new Error('unsupported method setRoomAccountData');
  }

  getPresenceStatus(): Promise<Presence> {
    throw new Error('unsupported method getPresenceStatus');
  }

  getPresenceStatusFor(userId: string): Promise<Presence> {
    throw new Error('unsupported method');
  }

  setPresenceStatus(
    presence: 'online' | 'offline' | 'unavailable',
    statusMessage?: string,
  ): Promise<any> {
    throw new Error('unsupported method setPresenceStatus');
  }

  getPublishedAlias(roomIdOrAlias: string): Promise<string> {
    throw new Error('unsupported method getPublishedAlias');
  }

  createRoomAlias(alias: string, roomId: string): Promise<any> {
    throw new Error('unsupported method createRoomAlias');
  }

  deleteRoomAlias(alias: string): Promise<any> {
    throw new Error('unsupported method deleteRoomAlias');
  }

  setDirectoryVisibility(
    roomId: string,
    visibility: 'public' | 'private',
  ): Promise<any> {
    throw new Error('unsupported method setDirectoryVisibility');
  }

  getDirectoryVisibility(roomId: string): Promise<'public' | 'private'> {
    throw new Error('unsupported method getDirectoryVisibility');
  }

  resolveRoom(roomIdOrAlias: string): Promise<string> {
    throw new Error('unsupported method resolveRoom');
  }

  lookupRoomAlias(roomAlias: string): Promise<RoomDirectoryLookupResponse> {
    throw new Error('unsupported method lookupRoomAlias');
  }

  inviteUser(userId: any, roomId: any): Promise<any> {
    throw new Error('unsupported method inviteUser');
  }

  kickUser(userId: any, roomId: any, reason?: any): Promise<any> {
    throw new Error('unsupported method kickUser');
  }

  banUser(userId: any, roomId: any, reason?: any): Promise<any> {
    throw new Error('unsupported method banUser');
  }

  unbanUser(userId: any, roomId: any): Promise<any> {
    throw new Error('unsupported method unbanUser');
  }

  getUserId(): Promise<string> {
    throw new Error('unsupported method getUserId');
  }

  stop() {
    throw new Error('unsupported method stop');
  }

  start(filter?: any): Promise<any> {
    throw new Error('unsupported method start');
  }

  protected startSyncInternal(): Promise<any> {
    throw new Error('unsupported method startSyncInternal');
  }

  protected startSync(
    emitFn?: (emitEventType: string, ...payload: any[]) => Promise<any>,
  ): Promise<void> {
    throw new Error('unsupported method startSync');
  }

  protected doSync(token: string): Promise<any> {
    throw new Error('unsupported method doSync');
  }

  protected processSync(
    raw: any,
    emitFn?: (emitEventType: string, ...payload: any[]) => Promise<any>,
  ): Promise<any> {
    throw new Error('unsupported method processSync');
  }

  getEvent(roomId: string, eventId: string): Promise<any> {
    throw new Error('unsupported method getEvent');
  }

  getRoomState(roomId: string): Promise<any[]> {
    throw new Error('unsupported method getRoomState');
  }

  getRoomStateEvents(roomId: any, type: any, stateKey: any): Promise<any> {
    throw new Error('unsupported method getRoomStateEvents');
  }

  getRoomStateEvent(roomId: any, type: any, stateKey: any): Promise<any> {
    throw new Error('unsupported method getRoomStateEvent');
  }

  getEventContext(
    roomId: string,
    eventId: string,
    limit?: number,
  ): Promise<EventContext> {
    throw new Error('unsupported method getEventContext');
  }

  getUserProfile(userId: string): Promise<any> {
    throw new Error('unsupported method getUserProfile');
  }

  setDisplayName(displayName: string): Promise<any> {
    throw new Error('unsupported method setDisplayName');
  }

  setAvatarUrl(avatarUrl: string): Promise<any> {
    throw new Error('unsupported method setAvatarUrl');
  }

  joinRoom(roomIdOrAlias: string, viaServers?: string[]): Promise<string> {
    throw new Error('unsupported method joinRoom');
  }

  getJoinedRooms(): Promise<string[]> {
    throw new Error('unsupported method getJoinedRooms');
  }

  getJoinedRoomMembers(roomId: string): Promise<string[]> {
    throw new Error('unsupported method getJoinedRoomMembers');
  }

  getJoinedRoomMembersWithProfiles(
    roomId: string,
  ): Promise<{ [p: string]: MatrixProfileInfo }> {
    throw new Error('unsupported method getJoinedRoomMembersWithProfiles');
  }

  getRoomMembers(
    roomId: string,
    batchToken?: string,
    membership?: Membership[],
    notMembership?: Membership[],
  ): Promise<MembershipEvent[]> {
    throw new Error('unsupported method getRoomMembers');
  }

  leaveRoom(roomId: string): Promise<any> {
    throw new Error('unsupported method leaveRoom');
  }

  sendReadReceipt(roomId: string, eventId: string): Promise<any> {
    throw new Error('unsupported method sendReadReceipt');
  }

  setTyping(roomId: string, typing: boolean, timeout?: number): Promise<any> {
    throw new Error('unsupported method setTyping');
  }

  replyText(
    roomId: string,
    event: any,
    text: string,
    html?: string,
  ): Promise<string> {
    throw new Error('unsupported method replyText');
  }

  replyHtmlText(roomId: string, event: any, html: string): Promise<string> {
    throw new Error('unsupported method replyHtmlText');
  }

  replyNotice(
    roomId: string,
    event: any,
    text: string,
    html?: string,
  ): Promise<string> {
    throw new Error('unsupported method replyNotice');
  }

  replyHtmlNotice(roomId: string, event: any, html: string): Promise<string> {
    throw new Error('unsupported method replyHtmlNotice');
  }

  sendNotice(roomId: string, text: string): Promise<string> {
    throw new Error('unsupported method sendNotice');
  }

  sendHtmlNotice(roomId: string, html: string): Promise<string> {
    throw new Error('unsupported method sendHtmlNotice');
  }

  sendText(roomId: string, text: string): Promise<string> {
    throw new Error('unsupported method sendText');
  }

  sendHtmlText(roomId: string, html: string): Promise<string> {
    throw new Error('unsupported method sendHtmlText');
  }

  sendMessage(roomId: string, content: any): Promise<string> {
    throw new Error('unsupported method sendMessage');
  }

  sendEvent(roomId: string, eventType: string, content: any): Promise<string> {
    throw new Error('unsupported method sendEvent');
  }

  sendStateEvent(
    roomId: string,
    type: string,
    stateKey: string,
    content: any,
  ): Promise<string> {
    throw new Error('unsupported method sendStateEvent');
  }

  redactEvent(
    roomId: string,
    eventId: string,
    reason?: string | null,
  ): Promise<string> {
    throw new Error('unsupported method redactEvent');
  }

  createRoom(properties?: any): Promise<string> {
    throw new Error('unsupported method createRoom');
  }

  userHasPowerLevelFor(
    userId: string,
    roomId: string,
    eventType: string,
    isState: boolean,
  ): Promise<boolean> {
    throw new Error('unsupported method userHasPowerLevelFor');
  }

  calculatePowerLevelChangeBoundsOn(
    targetUserId: string,
    roomId: string,
  ): Promise<PowerLevelBounds> {
    throw new Error('unsupported method calculatePowerLevelChangeBoundsOn');
  }

  setUserPowerLevel(
    userId: string,
    roomId: string,
    newLevel: number,
  ): Promise<any> {
    throw new Error('unsupported method setUserPowerLevel');
  }

  mxcToHttp(mxc: string): string {
    throw new Error('unsupported method mxcToHttp');
  }

  mxcToHttpThumbnail(
    mxc: string,
    width: number,
    height: number,
    method: 'crop' | 'scale',
  ): string {
    throw new Error('unsupported method mxcToHttpThumbnail');
  }

  uploadContent(
    data: Buffer,
    contentType?: string,
    filename?: string,
  ): Promise<string> {
    throw new Error('unsupported method uploadContent');
  }

  downloadContent(
    mxcUrl: string,
    allowRemote?: boolean,
  ): Promise<{ data: Buffer; contentType: string }> {
    throw new Error('unsupported method downloadContent');
  }

  uploadContentFromUrl(url: string): Promise<string> {
    throw new Error('unsupported method uploadContentFromUrl');
  }

  getRoomUpgradeHistory(roomId: string): Promise<{
    previous: RoomReference[];
    newer: RoomReference[];
    current: RoomReference;
  }> {
    throw new Error('unsupported method getRoomUpgradeHistory');
  }

  createSpace(opts: SpaceCreateOptions): Promise<Space> {
    throw new Error('unsupported method createSpace');
  }

  getSpace(roomIdOrAlias: string): Promise<Space> {
    throw new Error('unsupported method getSpace');
  }

  doRequest(
    method: any,
    endpoint: any,
    qs?: any,
    body?: any,
    timeout?: number,
    raw?: boolean,
    contentType?: string,
    noEncoding?: boolean,
  ): Promise<any> {
    throw new Error('unsupported method doRequest');
  }
}
