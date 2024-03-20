/*
 * Wire
 * Copyright (C) 2022 Wire Swiss GmbH
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

import React, {useEffect, useState} from 'react';

import {amplify} from 'amplify';
import {container} from 'tsyringe';

import {CircleCloseIcon, Input, SearchIcon} from '@wireapp/react-ui-kit';
import {WebAppEvents} from '@wireapp/webapp-events';

import {CallingCell} from 'Components/calling/CallingCell';
import {Config} from 'src/script/Config';
import {IntegrationRepository} from 'src/script/integration/IntegrationRepository';
import {
  closeIconStyles,
  searchIconStyles,
  searchInputStyles,
  searchInputWrapperStyles,
} from 'src/script/page/LeftSidebar/panels/Conversations/Conversations.styles';
import {Preferences} from 'src/script/page/LeftSidebar/panels/Preferences';
import {StartUI} from 'src/script/page/LeftSidebar/panels/StartUI';
import {ANIMATED_PAGE_TRANSITION_DURATION} from 'src/script/page/MainContent';
import {useAppMainState, ViewType} from 'src/script/page/state';
import {ContentState, ListState} from 'src/script/page/useAppState';
import {SearchRepository} from 'src/script/search/SearchRepository';
import {TeamRepository} from 'src/script/team/TeamRepository';
import {UserRepository} from 'src/script/user/UserRepository';
import {useKoSubscribableChildren} from 'Util/ComponentUtil';
import {t} from 'Util/LocalizerUtil';

import {ConversationsList} from './ConversationsList';
import {ConversationTabs} from './ConversationTabs';
import {getTabConversations} from './helpers';
import {useFolderState} from './state';

import {CallState} from '../../../../calling/CallState';
import {DefaultLabelIds} from '../../../../conversation/ConversationLabelRepository';
import {ConversationRepository} from '../../../../conversation/ConversationRepository';
import {ConversationState} from '../../../../conversation/ConversationState';
import {User} from '../../../../entity/User';
import {useConversationFocus} from '../../../../hooks/useConversationFocus';
import {PreferenceNotificationRepository} from '../../../../notification/PreferenceNotificationRepository';
import {PropertiesRepository} from '../../../../properties/PropertiesRepository';
import {PROPERTIES_TYPE} from '../../../../properties/PropertiesType';
import {TeamState} from '../../../../team/TeamState';
import {UserState} from '../../../../user/UserState';
import {ListViewModel} from '../../../../view_model/ListViewModel';
import {UserDetails} from '../../UserDetails';
import {ListWrapper} from '../ListWrapper';

type ConversationsProps = {
  callState?: CallState;
  conversationRepository: ConversationRepository;
  conversationState?: ConversationState;
  listViewModel: ListViewModel;
  preferenceNotificationRepository: PreferenceNotificationRepository;
  propertiesRepository: PropertiesRepository;
  selfUser: User;
  teamState?: TeamState;
  userState?: UserState;
  integrationRepository: IntegrationRepository;
  searchRepository: SearchRepository;
  teamRepository: TeamRepository;
  userRepository: UserRepository;
};

export enum SidebarTabs {
  RECENT,
  FOLDER,
  FAVORITES,
  GROUPS,
  DIRECTS,
  ARCHIVES,
  CONNECT,
  PREFERENCES,
}

const Conversations: React.FC<ConversationsProps> = ({
  integrationRepository,
  searchRepository,
  teamRepository,
  userRepository,
  propertiesRepository,
  conversationRepository,
  preferenceNotificationRepository,
  listViewModel,
  conversationState = container.resolve(ConversationState),
  teamState = container.resolve(TeamState),
  callState = container.resolve(CallState),
  userState = container.resolve(UserState),
  selfUser,
}) => {
  const [conversationsFilter, setConversationsFilter] = useState<string>('');
  const {activeCalls} = useKoSubscribableChildren(callState, ['activeCalls']);
  const {classifiedDomains} = useKoSubscribableChildren(teamState, ['classifiedDomains']);
  const {connectRequests} = useKoSubscribableChildren(userState, ['connectRequests']);
  const {
    activeConversation,
    unreadConversations,
    archivedConversations,
    groupConversations,
    directConversations,
    visibleConversations: conversations,
  } = useKoSubscribableChildren(conversationState, [
    'activeConversation',
    'archivedConversations',
    'groupConversations',
    'directConversations',
    'unreadConversations',
    'visibleConversations',
  ]);

  const {conversationLabelRepository} = conversationRepository;
  const favoriteConversations = conversationLabelRepository.getFavorites(conversations);

  const initialTab = propertiesRepository.getPreference(PROPERTIES_TYPE.INTERFACE.VIEW_FOLDERS)
    ? SidebarTabs.FOLDER
    : SidebarTabs.RECENT;

  const [currentTab, setCurrentTab] = useState<SidebarTabs>(initialTab);

  const isFolderTab = currentTab === SidebarTabs.FOLDER;
  const isPreferences = currentTab === SidebarTabs.PREFERENCES;

  const showSearchInput = [
    SidebarTabs.RECENT,
    SidebarTabs.FOLDER,
    SidebarTabs.FAVORITES,
    SidebarTabs.GROUPS,
    SidebarTabs.DIRECTS,
    SidebarTabs.ARCHIVES,
  ].includes(currentTab);

  const {setCurrentView} = useAppMainState(state => state.responsiveView);
  const {isOpen: isFolderOpen, openFolder} = useFolderState();
  const {currentFocus, handleKeyDown, resetConversationFocus} = useConversationFocus(conversations);
  const {conversations: currentTabConversations, searchInputPlaceholder} = getTabConversations({
    currentTab,
    conversations,
    conversationsFilter,
    archivedConversations,
    groupConversations,
    directConversations,
    favoriteConversations,
  });

  const hasNoConversations = conversations.length + connectRequests.length === 0;

  useEffect(() => {
    if (activeConversation && !conversationState.isVisible(activeConversation)) {
      // If the active conversation is not visible, switch to the recent view
      listViewModel.contentViewModel.loadPreviousContent();
    }
  }, [activeConversation, conversationState, listViewModel.contentViewModel, conversations.length]);

  useEffect(() => {
    if (!activeConversation) {
      return () => {};
    }

    const conversationLabels = conversationLabelRepository.getConversationLabelIds(activeConversation);
    amplify.subscribe(WebAppEvents.CONTENT.EXPAND_FOLDER, openFolder);

    if (!conversationLabels.some(isFolderOpen)) {
      openFolder(conversationLabels[0]);
    }

    return () => {
      amplify.unsubscribe(WebAppEvents.CONTENT.EXPAND_FOLDER, openFolder);
    };
  }, [activeConversation]);

  useEffect(() => {
    const openFavorites = () => openFolder(DefaultLabelIds.Favorites);
    conversationLabelRepository.addEventListener('conversation-favorited', openFavorites);
    return () => {
      conversationLabelRepository.removeEventListener('conversation-favorited', openFavorites);
    };
  }, []);

  useEffect(() => {
    propertiesRepository.savePreference(PROPERTIES_TYPE.INTERFACE.VIEW_FOLDERS, isFolderTab);
  }, [isFolderTab]);

  function changeTab(nextTab: SidebarTabs) {
    if (nextTab === SidebarTabs.ARCHIVES) {
      // will eventually load missing events from the db
      conversationRepository.updateArchivedConversations();
    }

    if (
      nextTab !== SidebarTabs.PREFERENCES
      //  && isPreferences
    ) {
      onExitPreferences();
      // switchList(ListState.CONVERSATIONS);
      // listViewModel.contentViewModel.switchContent(ContentState.COLLECTION);
    }

    setConversationsFilter('');
    setCurrentTab(nextTab);
  }

  const switchList = listViewModel.switchList;

  const onExitPreferences = () => {
    setCurrentView(ViewType.LEFT_SIDEBAR);
    switchList(ListState.CONVERSATIONS);
    listViewModel.contentViewModel.switchContent(ContentState.CONVERSATION);
  };

  function onClickPreferences(itemId: ContentState) {
    switchList(ListState.PREFERENCES);
    setCurrentView(ViewType.CENTRAL_COLUMN);
    listViewModel.contentViewModel.switchContent(itemId);

    setTimeout(() => {
      const centerColumn = document.getElementById('center-column');
      const nextElementToFocus = centerColumn?.querySelector("[tabindex='0']") as HTMLElement | null;
      nextElementToFocus?.focus();
    }, ANIMATED_PAGE_TRANSITION_DURATION + 1);
  }

  const sidebar = (
    <nav className="conversations-sidebar">
      <UserDetails
        user={selfUser}
        groupId={conversationState.selfMLSConversation()?.groupId}
        isTeam={teamState.isTeam()}
      />

      <ConversationTabs
        unreadConversations={unreadConversations}
        favoriteConversations={favoriteConversations}
        archivedConversations={archivedConversations}
        groupConversations={groupConversations}
        directConversations={directConversations}
        onChangeTab={changeTab}
        currentTab={currentTab}
        onClickPreferences={() => onClickPreferences(ContentState.PREFERENCES_ACCOUNT)}
      />
    </nav>
  );

  const callingView = (
    <>
      {activeCalls.map(call => {
        const conversation = conversationState.findConversation(call.conversationId);

        if (!conversation) {
          return null;
        }

        const callingViewModel = listViewModel.callingViewModel;
        const {callingRepository} = callingViewModel;

        return (
          <div className="calling-cell" key={conversation.id}>
            <CallingCell
              classifiedDomains={classifiedDomains}
              call={call}
              callActions={callingViewModel.callActions}
              callingRepository={callingRepository}
              conversation={conversation}
              isFullUi
              hasAccessToCamera={callingViewModel.hasAccessToCamera()}
              isSelfVerified={selfUser.is_verified()}
              multitasking={callingViewModel.multitasking}
            />
          </div>
        );
      })}
    </>
  );

  return (
    <div className="conversations-wrapper">
      <ListWrapper id="conversations" headerElement={<></>} hasHeader={false} sidebar={sidebar} before={callingView}>
        {isPreferences && (
          <Preferences
            onPreferenceItemClick={onClickPreferences}
            teamRepository={teamRepository}
            preferenceNotificationRepository={preferenceNotificationRepository}
          />
        )}

        {isPreferences ? null : hasNoConversations ? (
          <>
            {archivedConversations.length === 0 ? (
              <div className="conversations-centered">
                <div>
                  {t('conversationsWelcome', {
                    brandName: Config.getConfig().BRAND_NAME,
                  })}
                </div>
                <button className="button-reset-default text-underline" onClick={() => changeTab(SidebarTabs.CONNECT)}>
                  {t('conversationsNoConversations')}
                </button>
              </div>
            ) : (
              <div className="conversations-all-archived">{t('conversationsAllArchived')}</div>
            )}
          </>
        ) : (
          <>
            {showSearchInput && (
              <Input
                className="label-1"
                value={conversationsFilter}
                onChange={event => {
                  setConversationsFilter(event.currentTarget.value);
                }}
                startContent={<SearchIcon width={14} height={14} css={searchIconStyles} />}
                endContent={
                  conversationsFilter && (
                    <CircleCloseIcon
                      className="cursor-pointer"
                      onClick={() => setConversationsFilter('')}
                      css={closeIconStyles}
                    />
                  )
                }
                inputCSS={searchInputStyles}
                wrapperCSS={searchInputWrapperStyles}
                placeholder={searchInputPlaceholder}
              />
            )}
            {showSearchInput && currentTabConversations.length === 0 && (
              <div className="conversations-centered">
                <div>{t('searchConversationsNoResult')}</div>
                <button className="button-reset-default text-underline" onClick={() => changeTab(SidebarTabs.CONNECT)}>
                  {t('searchConversationsNoResultConnectSuggestion')}
                </button>
              </div>
            )}

            {currentTab === SidebarTabs.CONNECT && (
              <StartUI
                conversationRepository={conversationRepository}
                searchRepository={searchRepository}
                teamRepository={teamRepository}
                integrationRepository={integrationRepository}
                mainViewModel={listViewModel.mainViewModel}
                userRepository={userRepository}
                isFederated={listViewModel.isFederated}
                selfUser={selfUser}
              />
            )}

            {showSearchInput && (
              <ConversationsList
                callState={callState}
                currentTab={currentTab}
                currentFocus={currentFocus}
                listViewModel={listViewModel}
                connectRequests={connectRequests}
                handleArrowKeyDown={handleKeyDown}
                conversationState={conversationState}
                conversations={currentTabConversations}
                conversationRepository={conversationRepository}
                resetConversationFocus={resetConversationFocus}
              />
            )}
          </>
        )}
      </ListWrapper>
    </div>
  );
};

export {Conversations};
