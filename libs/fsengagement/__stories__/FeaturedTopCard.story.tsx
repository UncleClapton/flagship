import React from 'react';

import { Text } from 'react-native';

import type { Navigator } from '@brandingbrand/fsapp';

import { action } from '@storybook/addon-actions';
import { boolean, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { FeaturedTopCard } from '../src/inboxblocks/FeaturedTopCard';
import type { Action } from '../src/types';

import ActionContext from './assets/ActionContext';

const submitAction = action('submit');
const pushAction = action('push');
const WrapperContext = ActionContext((actions: Action) => {
  submitAction(actions);
});

const navigator: Navigator = {
  push: (params: unknown) => {
    pushAction(params);
  },
} as Navigator;

storiesOf('Engagement FeaturedTopCard', module).add('basic usage', () => (
  <WrapperContext>
    <FeaturedTopCard
      private_blocks={[]}
      navigator={navigator as any}
      contents={{
        Image: {
          source: {
            uri: '',
          },
        },
        Text: {
          text: text('Card Text', 'TestText'),
        },
        CTA: {
          action: text('Card Action Event', 'Test'),
          text: text('Card Action Text', 'Test'),
          actions: {
            type: boolean('Is Story', false) ? 'story' : 'click',
            value: text('actionValue', 'click'),
          },
        },
      }}
      story={{
        html: {
          link: text('Story Link', 'test.html'),
          body: '',
          iframe: '',
          image: {
            private_type: 'image',
          },
          title: {
            private_type: 'title',
          },
        },
        private_type: 'story',
      }}
    >
      <Text>{text('Card Text', 'Card Text')}</Text>
    </FeaturedTopCard>
  </WrapperContext>
));