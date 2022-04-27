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
    type: 'external',
    firstname: 'Joe',
    lastname: 'Bloggins',
    jobTitle: 'Developer',
    organisation: 'Nhs',
  },
  shareType: 'First editorial check',
  shareUrl: '#',
  commentsEnabled: true,
  currentTab: null,
  componentStyle: null,
  authUserId: null,
  apiEnabled: null,
  apiUrl: null,
  apiKey: null,
};

export function ActiveAndResolvedComments() {
  const store: Store = createStore(reducer, {
    settings: testSettingsState,
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An example active comment',
    highlightedText: 'This is the highlighted text Lorem ipsum dolor sit amet, consectetur adipiscing',
    resolved: false,
    deleted: false,
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An second example active comment',
    highlightedText: 'This is the highlighted text Lorem ipsum dolor sit amet, consectetur adipiscing',
    resolved: false,
    deleted: false,
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An example resolved comment',
    highlightedText: 'This is the highlighted text Lorem ipsum dolor sit amet, consectetur adipiscing',
    resolved: true,
    resolvedAuthor: {
      id: 2,
      type: 'external',
      firstname: 'Jane',
      lastname: 'Doe',
      jobTitle: 'Developer',
      organisation: 'Nhs',
    },
    deleted: false,
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An second example resolved comment',
    highlightedText: 'This is the highlighted text Lorem ipsum dolor sit amet, consectetur adipiscing',
    resolved: true,
    resolvedAuthor: {
      id: 2,
      type: 'external',
      firstname: 'Jane',
      lastname: 'Doe',
      jobTitle: 'Developer',
      organisation: 'Nhs',
    },
    deleted: false,
  });

  return (
    <CommentsTabs store={store} strings={defaultStrings} />
  );
}
