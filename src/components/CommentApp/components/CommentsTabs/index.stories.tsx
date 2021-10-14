import React from 'react';
import { createStore } from 'redux';
import { CommentsTabs } from './index';
import { Store, reducer } from '../../state';

import {
  addTestComment,
} from '../../utils/storybook';

export default { title: 'Commenting/Comments Tabs' };

export function ActiveAndResolvedComments() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'default',
    text: 'An example active comment',
    resolved: false,
    deleted: false,
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An second example active comment',
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
    <CommentsTabs store={store} />
  );
}
