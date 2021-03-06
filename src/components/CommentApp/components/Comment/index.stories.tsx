import React from 'react';
import { createStore } from 'redux';

import { Store, reducer } from '../../state';

import {
  RenderCommentsForStorybook,
  addTestComment,
} from '../../utils/storybook';

export default { title: 'Commenting/Comment' };

export function addNewComment() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'creating',
    highlightedText: 'This is the highlighted text.',
    focused: true,
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function comment() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'default',
    highlightedText: 'This is the highlighted text.',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function commentFromSomeoneElse() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'default',
    highlightedText: 'This is the highlighted text.',
    text: 'An example comment',
    author: {
      id: 2,
      type: 'external',
      firstname: 'John',
      lastname: 'Doe',
      jobTitle: 'Designer',
      organisation: 'Nhs D',
    },
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function commentFromSomeoneWithAReallyLongName() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'default',
    highlightedText: 'This is the highlighted text.',
    text: 'An example comment',
    author: {
      id: 3,
      type: 'external',
      firstname: 'This person has a really long name',
      lastname: 'and it should wrap to the next line',
      jobTitle: 'Developer',
      organisation: 'Nhs',
    },
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function focused() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'default',
    highlightedText: 'This is the highlighted text.',
    text: 'An example comment',
    focused: true,
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function saving() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'saving',
    highlightedText: 'This is the highlighted text.',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function saveError() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'save_error',
    highlightedText: 'This is the highlighted text.',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function deleteConfirm() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'delete_confirm',
    highlightedText: 'This is the highlighted text.',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function deleting() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'deleting',
    highlightedText: 'This is the highlighted text.',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function deleteError() {
  const store: Store = createStore(reducer);
  addTestComment(store, {
    mode: 'delete_error',
    highlightedText: 'This is the highlighted text.',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}
