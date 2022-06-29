import { getAdjustedIndex, getContentPathParts } from './index';
import { Comment } from '../../state/comments';
import { createStore } from 'redux';
import { Store, reducer } from '../../state';
import { updateGlobalSettings } from '../../actions/settings';
import * as utils from  '../utils';

/* eslint-disable no-console */
const myApp = require('./index');
const consoleError = console.error;
const author = {
  id: 1,
  type: 'external',
  firstname: 'Joe',
  lastname: 'Bloggins',
  jobTitle: 'Developer',
  organisation: 'Nhs',
};
const store: Store = createStore(reducer);
beforeAll(() => {
  store.dispatch(
    updateGlobalSettings({
      apiEnabled: true,
      user: author,
    }));
});
beforeEach(() => {
  console.error = jest.fn(); // create a new mock function for each test
});
afterAll(() => {
  console.error = consoleError; // restore original console.log after all tests
});

const newComment: Comment = {
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
  contentTab: 'desktop',
};

test('Check adjusted index value', () => {
  // test that the getAdjustedIndex returns the correct value
  const content = 'This is some <span class="my_class"> content </span> with markup';
  let adjustedIndex = getAdjustedIndex(content, 0);
  expect(adjustedIndex).toBe(0);

  adjustedIndex = getAdjustedIndex(content, 1);
  expect(adjustedIndex).toBe(1);

  adjustedIndex = getAdjustedIndex(content, 12);
  expect(adjustedIndex).toBe(12);

  adjustedIndex = getAdjustedIndex(content, 13);
  expect(adjustedIndex).toBe(13);

  adjustedIndex = getAdjustedIndex(content, 21);
  expect(adjustedIndex).toBe(44);

  adjustedIndex = getAdjustedIndex(content, 22);
  expect(adjustedIndex).toBe(52);
});

test('Check adjusted index value for HTML chars', () => {
  // test that the getAdjustedIndex returns the correct value
  const content = 'This is some&nbsp;content &lt;with&gt; HTML chars';
  let adjustedIndex = getAdjustedIndex(content, 0);
  expect(adjustedIndex).toBe(0);

  adjustedIndex = getAdjustedIndex(content, 1);
  expect(adjustedIndex).toBe(1);

  adjustedIndex = getAdjustedIndex(content, 12);
  expect(adjustedIndex).toBe(12);

  adjustedIndex = getAdjustedIndex(content, 13);
  expect(adjustedIndex).toBe(18);

  adjustedIndex = getAdjustedIndex(content, 21);
  expect(adjustedIndex).toBe(26);

  adjustedIndex = getAdjustedIndex(content, 22);
  expect(adjustedIndex).toBe(30);
});

test('Check content path parts', () => {
  // test that the content path is correctly split into the required parts
  let contentPathParts = getContentPathParts('content.xxxxxxxxx');
  expect(contentPathParts).toStrictEqual(['content', 'xxxxxxxxx']);

  contentPathParts = getContentPathParts('content.abcdefg.content.qwerty');
  expect(contentPathParts).toStrictEqual(['content', 'abcdefg', 'content.qwerty']);
});

test('Check request options with body', () => {
  // test that the getRequestOptions method returns correct values
  // when body data is passed
  document.cookie = 'csrftoken=myCSRFToken';
  const headers = new Headers({
    'X-CSRFToken': 'myCSRFToken',
    'subscription-key': 'SOMEKEY',
    'Content-Type': 'text/html; charset=UTF-8',
  });
  const bodyData = 'test body';

  const requestOptions = utils.getRequestOptions('POST', 'some-api-key', bodyData);

  expect(requestOptions.method).toBe('POST');
  expect(requestOptions.mode).toBe('cors');
  expect(requestOptions.headers).toStrictEqual(headers);
  expect(requestOptions.body).toBe(bodyData);
});

test('Check request options without body', () => {
  // test that the getRequestOptions method returns correct values
  // when no body data is passed
  document.cookie = 'csrftoken=myCSRFToken';
  const headers = new Headers({
    'X-CSRFToken': 'myCSRFToken',
    'subscription-key': 'SOMEKEY',
    'Content-Type': 'text/html; charset=UTF-8',
  });

  const requestOptions = utils.getRequestOptions('POST', 'some-api-key');

  expect(requestOptions.method).toBe('POST');
  expect(requestOptions.mode).toBe('cors');
  expect(requestOptions.headers).toStrictEqual(headers);
  expect(requestOptions.body).toBeUndefined();
});

test('Check doDeleteComment when successful', () => {
  const mock = jest.spyOn(utils, 'makeRequest');
  mock.mockImplementation(() => Promise.resolve('{ "success": "True", "error": "" }'));
  myApp.doDeleteComment(newComment, store)
    .then(() => {
      expect(console.error).not.toHaveBeenCalled();
    });
});

test('Check doDeleteComment when unsuccessful', () => {
  const mock = jest.spyOn(utils, 'makeRequest');
  mock.mockImplementation(() => Promise.resolve('{ "success": "False", "error": "Failed to retrieve response body" }'));
  myApp.doDeleteComment(newComment, store)
    .then(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to retrieve response body');
    });
});

test('Check doResolveComment when successful', () => {
  const mock = jest.spyOn(utils, 'makeRequest');
  mock.mockImplementation(() => Promise.resolve('{ "success": "True", "error": ""}'));
  myApp.doResolveComment(newComment, store)
    .then(() => {
      expect(console.error).not.toHaveBeenCalled();
    });
});

test('Check doResolveComment when unsuccessful', () => {
  const mock = jest.spyOn(utils, 'makeRequest');
  mock.mockImplementation(() => Promise.resolve('{ "success": "False", "error": "Failed to retrieve response body" }'));
  myApp.doResolveComment(newComment, store)
    .then(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to retrieve response body');
    });
});

test('Check saveComment when successful', () => {
  const mock = jest.spyOn(utils, 'makeRequest');
  mock.mockImplementation(() => Promise.resolve('{ "success": "True", "error": ""}'));
  myApp.saveComment(newComment, store)
    .then(() => {
      expect(console.error).not.toHaveBeenCalled();
    });
});

test('Check saveComment when unsuccessful', () => {
  const mock = jest.spyOn(utils, 'makeRequest');
  mock.mockImplementation(() => Promise.resolve('{ "success": "False", "error": "Failed to retrieve response body" }'));
  myApp.saveComment(newComment, store)
    .then(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to retrieve response body');
    });
});
