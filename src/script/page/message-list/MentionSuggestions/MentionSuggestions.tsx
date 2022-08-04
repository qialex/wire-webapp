/*
 * Wire
 * Copyright (C) 2021 Wire Swiss GmbH
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

import React, {useEffect, useMemo, useRef, useState} from 'react';

import {registerReactComponent} from 'Util/ComponentUtil';
import {KEY} from 'Util/KeyboardUtil';
import {clamp} from 'Util/NumberUtil';

import {useFadingScrollbar} from '../../../ui/fadingScrollbar';
import MentionSuggestionsItem from './MentionSuggestionsItem';
import {User} from '../../../entity/User';

type MentionSuggestionListProps = {
  onSelectionValidated: (data: User, element: HTMLInputElement | null) => void;
  suggestions: User[];
  targetInputSelector: string;
};
const MentionSuggestionList: React.FunctionComponent<MentionSuggestionListProps> = ({
  suggestions,
  onSelectionValidated,
  targetInputSelector,
}) => {
  const selectedItemElement = useRef<HTMLDivElement>(null);
  const scrollbarElement = useRef<HTMLDivElement>(null);
  useFadingScrollbar(scrollbarElement.current);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  useEffect(
    () => selectedItemElement.current?.scrollIntoView({behavior: 'auto', block: 'nearest'}),
    [selectedItemElement.current, suggestions.length],
  );

  const targetInput = useMemo(
    () => document.querySelector<HTMLInputElement>(targetInputSelector),
    [targetInputSelector],
  );

  const isVisible = suggestions.length > 0;
  const bottom = useMemo(
    () => (isVisible && targetInput ? window.innerHeight - targetInput.getBoundingClientRect().top + 24 : 0),
    [isVisible, targetInput],
  );

  useEffect(() => {
    const updateSelectedIndex = (delta: number = 0) => {
      setSelectedSuggestionIndex(curr => clamp(curr + delta, 0, suggestions.length - 1));
    };

    const onInput = (event: KeyboardEvent) => {
      const moveSelection = (delta: number) => {
        updateSelectedIndex(delta);
        event.preventDefault();
        event.stopPropagation();
      };
      const validateSelection = () => {
        if (!event.shiftKey && targetInput) {
          onSelectionValidated(suggestions[selectedSuggestionIndex], targetInput);
          event.preventDefault();
          event.stopPropagation();
        }
      };
      const actions = {
        [KEY.ARROW_UP]: () => moveSelection(1),
        [KEY.ARROW_DOWN]: () => moveSelection(-1),
        [KEY.ENTER]: validateSelection,
        [KEY.TAB]: validateSelection,
      };

      actions[event.key]?.();
    };

    if (isVisible && targetInput) {
      targetInput.addEventListener('keydown', onInput);
    }
    updateSelectedIndex();
    return () => {
      if (targetInput) {
        targetInput.removeEventListener('keydown', onInput);
      }
    };
  }, [isVisible, targetInput, suggestions, selectedSuggestionIndex]);

  return isVisible ? (
    <div
      className="conversation-input-bar-mention-suggestion"
      style={{bottom, overflowY: 'auto'}}
      data-uie-name="list-mention-suggestions"
      ref={scrollbarElement}
    >
      <div className="mention-suggestion-list">
        {suggestions
          .map((suggestion, index) => (
            <MentionSuggestionsItem
              key={suggestion.id}
              suggestion={suggestion}
              isSelected={index === selectedSuggestionIndex}
              onSuggestionClick={() => {
                targetInput?.focus();
                onSelectionValidated(suggestion, targetInput);
              }}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
              ref={index === selectedSuggestionIndex ? selectedItemElement : undefined}
            />
          ))
          .reverse()}
      </div>
    </div>
  ) : null;
};

export default MentionSuggestionList;

registerReactComponent('mention-suggestions', MentionSuggestionList);
