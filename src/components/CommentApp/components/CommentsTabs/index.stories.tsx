import React from 'react';
import { createStore } from 'redux';
import { CommentsTabs } from './index';
import { Store, reducer } from '../../state';

import { defaultStrings } from '../../main';
import { SettingsState } from '../../state/settings';
import {
  addTestComment,
} from '../../utils/storybook';

export default { title: 'Commenting/Comments Tabs' };

const testSettingsState: SettingsState = {
  user: {
    id: 1,
    name: 'Admin',
  },
  commentsEnabled: true,
  currentTab: null,
};

export function ActiveAndResolvedComments() {
  const store: Store = createStore(reducer, {
    settings: testSettingsState,
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An example active comment',
    highlightedText: 'This is the highlighted text.',
    resolved: false,
    deleted: false,
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An second example active comment',
    highlightedText: 'This is the highlighted text.',
    resolved: false,
    deleted: false,
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An example resolved comment',
    resolved: true,
    deleted: false,
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An second example resolved comment',
    resolved: true,
    deleted: false,
  });

  return (
    <CommentsTabs store={store} strings={defaultStrings} />
  );
}
