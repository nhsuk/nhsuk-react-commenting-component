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
    text: 'An example comment',
  });

  addTestComment(store, {
    mode: 'default',
    text: 'An second example comment',
  });

  return (
    <CommentsTabs store={store} />
  );
}
