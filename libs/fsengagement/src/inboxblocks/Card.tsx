import React from 'react';

import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';

import { useNavigator } from '@brandingbrand/fsapp';
import { Navigator } from '@brandingbrand/fsapp/legacy';

import { CardContext, EngagementContext } from '../lib/contexts';
import type { Action, CardProps, JSON } from '../types';

export interface ActionsCard extends CardProps {
  actions?: Action;
}

export const Card: React.FunctionComponent<ActionsCard> = React.memo((props) => {
  const navigator = props.discoverPath ? useNavigator() : props.navigator;
  const { dynamicData, handleAction } = React.useContext(EngagementContext);

  const handleStoryAction = async (json: JSON) => {
    DeviceEventEmitter.emit('viewStory', {
      title: props.name,
      id: props.id,
    });

    if (!navigator) {
      return;
    }
    if (props.discoverPath && !(navigator instanceof Navigator)) {
      navigator.open(`${props.discoverPath}/${props.id}`, {
        json,
        backButton: true,
        name: props.name,
        discoverPath: props.discoverPath,
      });
      return;
    }
    return navigator.push({
      component: {
        name: 'EngagementComp',
        options: {
          topBar: {
            visible: false,
          },
        },
        passProps: {
          json,
          backButton: true,
          name: props.name,
          id: props.id,
          dynamicData,
        },
      },
    });
  };

  const onCardPress = async (): Promise<void> => {
    const { actions, story, storyGradient } = props;
    if (!handleAction) {
      return;
    }
    // if there is a story attached and either
    //    1) no actions object (Related)
    //    2) actions.type is null or 'story' (new default tappable cards)
    if (story && (!actions || (actions && (actions.type === null || actions.type === 'story')))) {
      if (story.html) {
        handleAction({
          type: 'blog-url',
          value: story.html.link,
        });
      } else {
        return handleStoryAction({
          ...story,
          storyGradient,
        });
      }
    } else if (actions?.type) {
      handleAction(actions);
    }
  };

  if (props.plainCard) {
    return (
      <CardContext.Provider
        value={{
          story: props.story,
          handleStoryAction,
          cardActions: props.actions,
          id: props.id,
          name: props.name,
          isCard: true,
        }}
      >
        <View style={props.containerStyle}>{props.children}</View>
      </CardContext.Provider>
    );
  }

  return (
    <CardContext.Provider
      value={{
        story: props.story,
        handleStoryAction,
        cardActions: props.actions,
        id: props.id,
        name: props.name,
        isCard: true,
      }}
    >
      <TouchableOpacity style={props.containerStyle} activeOpacity={0.9} onPress={onCardPress}>
        {props.children}
      </TouchableOpacity>
    </CardContext.Provider>
  );
});
