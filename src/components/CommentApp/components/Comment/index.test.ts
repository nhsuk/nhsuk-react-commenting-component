import { getAdjustedIndex, getContentPathParts } from './index';

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
  expect(adjustedIndex).toBe(36);

  adjustedIndex = getAdjustedIndex(content, 21);
  expect(adjustedIndex).toBe(44);

  adjustedIndex = getAdjustedIndex(content, 22);
  expect(adjustedIndex).toBe(52);
});

test('Check content path parts', () => {
  // test that the content path is correctly split into the required parts
  let contentPathParts = getContentPathParts('content.xxxxxxxxx');
  expect(contentPathParts).toStrictEqual(['content', 'xxxxxxxxx']);

  contentPathParts = getContentPathParts('content.abcdefg.content.qwerty');
  expect(contentPathParts).toStrictEqual(['content', 'abcdefg', 'content.qwerty']);
});
