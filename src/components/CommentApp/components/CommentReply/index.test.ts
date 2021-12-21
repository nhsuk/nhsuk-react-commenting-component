import { Comment, CommentReply } from '../../state/comments';
import { createStore } from 'redux';
import { Store, reducer } from '../../state';
import { updateGlobalSettings } from '../../actions/settings';

/* eslint-disable no-console */

const myApp = require('./index');
const consoleError = console.error;
const store: Store = createStore(reducer);
beforeAll(() => {
  store.dispatch(
    updateGlobalSettings({
      apiEnabled: true
    }));
});
beforeEach(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = consoleError; // restore original console.log after all tests
});

const comment: Comment = {
  contentpath: 'test_contentpath',
  position: '',
  localId: 5,
  annotation: null,
  remoteId: 5,
  mode: 'default',
  deleted: false,
  author: {
    id: 1,
    type: 'external',
    firstname: 'Joe',
    lastname: 'Bloggins',
    jobTitle: 'Developer',
    organisation: 'Nhs',
  },
  date: 0,
  highlightedText: 'This is the highlighted text.',
  text: 'new comment',
  originalText: 'new comment',
  newReply: '',
  newText: '',
  remoteReplyCount: 0,
  resolved: false,
  replies: new Map(),
};

const commentReply: CommentReply = {
  localId: 2,
  remoteId: 2,
  mode: 'default',
  author: {
    id: 1,
    type: 'external',
    firstname: 'Joe',
    lastname: 'Bloggins',
    jobTitle: 'Developer',
    organisation: 'Nhs',
  },
  date: 0,
  text: 'a reply',
  originalText: 'a reply',
  newText: '',
  deleted: false,
};

test('Check saveCommentReply when successful', () => {
  const makeRequestMock = jest.spyOn(myApp,
    'makeRequest').mockReturnValue(Promise.resolve({ success: 'True' }));
  myApp.saveCommentReply(comment, commentReply, store)
    .then(() => {
      expect(console.error).not.toHaveBeenCalled();
      expect(makeRequestMock).toHaveBeenCalled();
      makeRequestMock.mockRestore();
    });
});

test('Check saveCommentReply when unsuccessful', () => {
  const makeRequestMock = jest.spyOn(myApp,
    'makeRequest').mockReturnValue(Promise.resolve({ success: 'False', error: 'Failed to retrieve response body' }));
  myApp.saveCommentReply(comment, commentReply, store)
    .then(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to retrieve response body');
      expect(makeRequestMock).toHaveBeenCalled();
      makeRequestMock.mockRestore();
    });
});

test('Check deleteCommentReply when successful', () => {
  const makeRequestMock = jest.spyOn(myApp,
    'makeRequest').mockReturnValue(Promise.resolve({ success: 'True' }));
  myApp.deleteCommentReply(comment, commentReply, store)
    .then(() => {
      expect(console.error).not.toHaveBeenCalled();
      expect(makeRequestMock).toHaveBeenCalled();
      makeRequestMock.mockRestore();
    });
});

test('Check deleteCommentReply when unsuccessful', () => {
  const makeRequestMock = jest.spyOn(myApp,
    'makeRequest').mockReturnValue(Promise.resolve({ success: 'False', error: 'Failed to retrieve response body' }));
  myApp.deleteCommentReply(comment, commentReply, store)
    .then(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to retrieve response body');
      expect(makeRequestMock).toHaveBeenCalled();
      makeRequestMock.mockRestore();
    });
});
