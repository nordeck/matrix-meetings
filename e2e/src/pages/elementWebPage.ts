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

import { expect, FrameLocator, Locator, Page } from '@playwright/test';
import { Credentials, getElementWebUrl, getSynapseUrl } from '../util';

export type OpenIdToken = {
  matrix_server_name: string;
  access_token: string;
};

export class ElementWebPage {
  private readonly sidebarRegion: Locator;
  private readonly navigationRegion: Locator;
  private readonly headerRegion: Locator;
  private readonly sendMessageTextbox: Locator;
  public readonly noChatPermissionText: Locator;
  public readonly roomNameText: Locator;
  public readonly roomTopicText: Locator;
  public readonly roomInviteHeader: Locator;
  public readonly userKickMessageHeader: Locator;

  constructor(private readonly page: Page) {
    this.navigationRegion = page.getByRole('navigation');
    this.sidebarRegion = page.getByRole('complementary');
    this.headerRegion = page.getByRole('main').locator('header');
    this.sendMessageTextbox = page.getByRole('textbox', { name: /message…/ });
    this.noChatPermissionText = page.getByText(
      'You do not have permission to post to this room',
    );
    this.roomNameText = this.headerRegion.getByRole('heading');
    this.roomTopicText = this.headerRegion.locator('.mx_RoomTopic');
    this.roomInviteHeader = this.page.getByRole('heading', {
      name: /Do you want to join/,
    });
    this.userKickMessageHeader = this.page.getByRole('heading', {
      name: /You were removed from/,
    });
  }

  async approveWidgetWarning() {
    await this.page
      .getByText('Widget added by')
      .locator('..')
      .getByRole('button', { name: 'Continue' })
      .click();
  }

  async approveWidgetCapabilities() {
    const dialogLocator = this.page.getByRole('dialog'); // TODO: We can't use [name="Approve widget permissions"] here as Element is reusing the same dialog name if multiple dialogs are open at once.

    // We don't select the "Remember this" option, so that we are always asked
    // again. This way we better now when to expect the dialog.
    await dialogLocator
      .getByRole('switch', { name: 'Remember my selection for this widget' })
      // Increase but also limit the timeout to account for widget load time
      .click({ timeout: 15000 });

    await dialogLocator.getByRole('button', { name: 'Approve' }).click();
  }

  async approveWidgetIdentity() {
    const approveWidgetIdentityDialogLocator = this.page.getByRole(
      'dialog', // TODO: We can't use [name="Allow this widget to verify your identity"] here as Element is reusing the same dialog name if multiple dialogs are open at once.
    );

    // We don't select the "Remember this" option, so that we are always asked
    // again. This way we better now when to expect the dialog.

    await approveWidgetIdentityDialogLocator
      .getByRole('button', { name: 'Continue' })
      .click();
  }

  async reloadWidgets() {
    await this.headerRegion
      .getByRole('button', { name: 'Hide Widgets' })
      .click();
    await this.headerRegion
      .getByRole('button', { name: 'Show Widgets' })
      .click();
  }

  public getCurrentRoomId(): string {
    const m = this.page.url().match(/#\/room\/(.*)/);
    const roomId = m && m[1];

    if (!roomId) {
      throw new Error('Unknown room');
    }

    return roomId;
  }

  async createRoom(
    name: string,
    { encrypted = false }: { encrypted?: boolean } = {},
  ) {
    // Instead of controling the UI, we use the matrix client as it is faster.
    await this.page.evaluate(
      async ({ name, encrypted }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = (window as any).mxMatrixClientPeg.get();

        if (encrypted) {
          // TODO: Support encryption in rooms

          throw new Error('Encryption not supported!');
        }

        await client.createRoom({
          name,
        });
      },
      { name, encrypted },
    );

    await this.switchToRoom(name);
  }

  async navigateToRoomOrInvitation(name: string) {
    await this.page
      .getByRole('tree', { name: 'Rooms' })
      .getByRole('treeitem', {
        name: new RegExp(`^${name}( Unread messages\\.)?`),
      })
      .click();
  }

  async waitForRoom(name: string) {
    await this.page
      .getByRole('tree', { name: 'Rooms' })
      .getByRole('treeitem', {
        name: new RegExp(`^${name}( Unread messages\\.)?`),
      })
      .click();

    await this.roomNameText.getByText(name).waitFor();
  }

  async waitForRoomJoin(name: string) {
    const roomsTree = this.page.getByRole('tree', { name: 'Rooms' });

    await roomsTree
      .getByRole('treeitem', {
        name: new RegExp(`^${name}( Unread messages\\.)?`),
      })
      .waitFor();

    // Wait till the room is not part of the open invitations list anymore
    await roomsTree
      .getByRole('group', { name: 'Invites' })
      .getByRole('treeitem', {
        name: new RegExp(`^${name}( Unread messages\\.)?`),
      })
      .waitFor({ state: 'hidden' });
  }

  async switchToRoom(name: string) {
    await this.navigateToRoomOrInvitation(name);
    await this.waitForRoom(name);
  }

  async acceptPrivateChatInvitation() {
    await this.page.getByRole('button', { name: 'Start chatting' }).click();
  }

  async acceptRoomInvitation() {
    await this.page.getByRole('button', { name: 'Accept' }).click();
  }

  async joinRoom() {
    await this.page
      .getByRole('button', { name: 'Join the discussion' })
      .click();
  }

  async toggleRoomInfo() {
    await this.headerRegion.getByRole('tab', { name: 'Room Info' }).click();
  }

  async revealRoomInviteReason(): Promise<Locator> {
    await this.page.locator('.mx_InviteReason').click();

    return this.page.locator('.mx_InviteReason');
  }

  locateChatMessageInRoom(message: string | RegExp): Locator {
    if (typeof message === 'string') {
      return this.page.getByRole('listitem').getByText(message);
    } else {
      return this.page.getByRole('listitem').getByText(message);
    }
  }

  async sendMessage(message: string) {
    // Both for encrypted and non-encrypted cases
    await this.sendMessageTextbox.type(message);
    await this.sendMessageTextbox.press('Enter');
  }

  widgetByTitle(title: string): FrameLocator {
    return this.page.frameLocator(`iframe[title="${title}"]`);
  }

  async setupWidget(url: string) {
    await this.sendMessage(`/addwidget ${url}`);

    await this.toggleRoomInfo();
    await this.page
      .getByRole('button', { name: 'Custom' })
      .locator('..')
      .getByRole('button', { name: 'Pin' })
      .click();

    await this.approveWidgetCapabilities();

    await this.toggleRoomInfo();

    await this.widgetByTitle('Custom')
      .getByRole('button', { name: 'Repair registration' })
      .click();

    await this.approveWidgetCapabilities();

    await this.page
      // Title has changed, so we can't wait for the exact title!
      .frameLocator('iframe[title]')
      .getByText('Widget configuration complete')
      .waitFor();

    await this.reloadWidgets();
    await this.approveWidgetCapabilities();
  }

  async inviteUser(username: string) {
    const roomId = this.getCurrentRoomId();

    // Instead of controling the UI, we use the matrix client as it is faster.
    await this.page.evaluate(
      async ({ roomId, username }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = (window as any).mxMatrixClientPeg.get();

        await client.invite(roomId, `@${username}:localhost`);
      },
      { roomId, username },
    );
  }

  async waitForUserToJoin(username: string) {
    await this.waitForUserMembership(username, 'join');
  }

  async waitForUserMembership(
    username: string,
    membership: 'join' | 'leave' | 'ban' | 'invite',
  ) {
    // Instead of controling the UI, we use the matrix client as it is faster.
    await expect
      .poll(async () => {
        const roomId = this.getCurrentRoomId();

        return await this.page.evaluate(
          async ({ roomId, username }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = (window as any).mxMatrixClientPeg.get();

            try {
              const memberEvent = await client.getStateEvent(
                roomId,
                'm.room.member',
                `@${username}:localhost`,
              );

              return memberEvent.membership;
            } catch (err) {
              return undefined;
            }
          },
          { roomId, username },
        );
      })
      .toEqual(membership);
  }

  async removeUser(username: string) {
    const roomId = this.getCurrentRoomId();

    // Instead of controling the UI, we use the matrix client as it is faster.
    await this.page.evaluate(
      async ({ roomId, username }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = (window as any).mxMatrixClientPeg.get();

        await client.kick(roomId, `@${username}:localhost`);
      },
      { roomId, username },
    );
  }

  async promoteUserAsModerator(username: string) {
    const roomId = this.getCurrentRoomId();

    // Instead of controling the UI, we use the matrix client as it is faster.
    await this.page.evaluate(
      async ({ roomId, username }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = (window as any).mxMatrixClientPeg.get();
        const powerLevelsEvent = await client.getStateEvent(
          roomId,
          'm.room.power_levels',
          '',
        );

        const newPowerLevels = {
          ...powerLevelsEvent,
          users: {
            ...(powerLevelsEvent.users ?? {}),
            [`@${username}:localhost`]: 50,
          },
        };

        await client.sendStateEvent(
          roomId,
          'm.room.power_levels',
          newPowerLevels,
          '',
        );
      },
      { roomId, username },
    );
  }

  async showWidgetInSidebar(widget: string) {
    await this.toggleRoomInfo();

    await this.sidebarRegion.getByText('Widgets', { exact: true }).waitFor();

    await this.sidebarRegion.getByRole('button', { name: widget }).click();

    await this.approveWidgetWarning();
    await this.approveWidgetCapabilities();
  }

  async closeWidgetInSidebar() {
    await this.sidebarRegion
      .getByRole('button', { name: 'Room information' })
      .click();
    await this.toggleRoomInfo();
  }

  locateTombstone(): Locator {
    return this.page.getByText(
      'This room has been replaced and is no longer active.',
    );
  }

  async followTombstone() {
    await this.page
      .getByRole('link', { name: 'The conversation continues here.' })
      .click();
  }

  async getWidgets(): Promise<string[]> {
    const roomId = this.getCurrentRoomId();

    return await this.page.evaluate(
      ({ roomId }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mxWidgetStore = (window as any).mxWidgetStore;
        const roomWidgets = mxWidgetStore.roomMap.get(roomId);

        if (!roomWidgets) {
          return [];
        }

        const widgets = roomWidgets.widgets as { name: string }[];

        return widgets.map((w) => w.name);
      },
      { roomId },
    );
  }

  async getMeetingRoomForceDeletionAt(): Promise<string | undefined> {
    const roomId = this.getCurrentRoomId();

    return await this.page.evaluate(
      async ({ roomId }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = (window as any).mxMatrixClientPeg.get();

        try {
          const metadataEvent = await client.getStateEvent(
            roomId,
            'net.nordeck.meetings.metadata',
          );

          if (metadataEvent?.force_deletion_at) {
            return new Date(metadataEvent.force_deletion_at).toISOString();
          } else {
            return undefined;
          }
        } catch (err) {
          return undefined;
        }
      },
      { roomId },
    );
  }

  async getOpenIdToken(): Promise<OpenIdToken> {
    const openIdToken = await this.page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = (window as any).mxMatrixClientPeg.get();
      return await client.getOpenIdToken();
    });

    return openIdToken;
  }

  async login(username: string, password: string): Promise<Credentials> {
    const synapseUrl = getSynapseUrl();
    const url = `${synapseUrl}/_matrix/client/r0/login`;
    const createResp = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        type: 'm.login.password',
        identifier: {
          type: 'm.id.user',
          user: username,
        },
        password,
      }),
    });
    const credentials = (await createResp.json()) as {
      access_token: string;
      user_id: string;
      device_id: string;
      home_server: string;
    };

    // To set the credentials, we have to be on the correct origin. But loading
    // element full is expensive, so we load something else.
    await this.page.goto(`${getElementWebUrl()}/welcome/images/logo.svg`);

    // Seed the localStorage with the required credentials
    await this.page.evaluate(
      ({ synapseUrl, credentials }) => {
        window.localStorage.setItem('mx_hs_url', synapseUrl);
        window.localStorage.setItem('mx_user_id', credentials.user_id);
        window.localStorage.setItem(
          'mx_access_token',
          credentials.access_token,
        );
        window.localStorage.setItem('mx_device_id', credentials.device_id);
        window.localStorage.setItem('mx_is_guest', 'false');
        window.localStorage.setItem('mx_has_pickle_key', 'false');
        window.localStorage.setItem('mx_has_access_token', 'true');
        window.localStorage.setItem(
          'mx_local_settings',
          JSON.stringify({
            // Disable opt-ins and cookie headers
            analyticsOptIn: false,
            showCookieBar: false,
            // Set language to en instead of using the current locale
            language: 'en',
            // Always test in high contrast mode
            theme: 'light-high-contrast',
          }),
        );
        // Don't ask the user if he wants to enable notifications
        window.localStorage.setItem('notifications_hidden', 'true');
        // Disable audio notifications, they can be annoying during tests
        window.localStorage.setItem('audio_notifications_enabled', 'false');
      },
      { synapseUrl, credentials },
    );

    // Reload and use the credentials
    await this.page.goto(getElementWebUrl());

    // Wait for Element to be ready
    await this.navigationRegion
      .getByRole('button', { name: 'Add', exact: true })
      .waitFor();

    return {
      accessToken: credentials.access_token,
      userId: credentials.user_id,
      deviceId: credentials.device_id,
      homeServer: credentials.home_server,
    };
  }
}
