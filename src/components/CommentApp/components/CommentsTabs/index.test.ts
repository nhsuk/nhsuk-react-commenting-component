import { newComment, Comment } from '../../state/comments';
import { getNextCommentId } from '../../utils/sequences';
import {
  filterResolvedComments,
  filterActiveComments,
} from './index';

const author = {
  id: 1,
  type: 'external',
  firstname: 'Joe',
  lastname: 'Bloggins',
  jobTitle: 'Developer',
  organisation: 'Nhs',
};

const comments: Comment[] = [];

for (let i = 0; i < 6; i++) {
  comments.push(newComment('test', '', getNextCommentId(), null, author, Date.now(), {
    mode: 'default',
    text: 'An example active comment',
    resolved: false,
    deleted: false,
  }));
}

const commentsToRender = Array.from(
  comments.values()
);

// commentsToRender array contains 2 of all possible combinations of states
// RESOLVED
commentsToRender[0].resolved = true;
commentsToRender[0].deleted = false;

commentsToRender[1].resolved = true;
commentsToRender[1].deleted = false;

// DELETED
commentsToRender[2].resolved = true;
commentsToRender[2].deleted = true;

commentsToRender[3].resolved = true;
commentsToRender[3].deleted = true;

// ACTIVE
commentsToRender[4].resolved = false;
commentsToRender[4].deleted = false;

commentsToRender[5].resolved = false;
commentsToRender[5].deleted = false;

const resolvedComments = filterResolvedComments(commentsToRender);
const activeComments = filterActiveComments(commentsToRender);


describe('filterResolvedComments', () => {
  it('filters only resolved, non-deleted comments', () => {
    for (let i = 0; i < resolvedComments.length; i++) {
      expect(resolvedComments[i].resolved).toBe(true);
      expect(resolvedComments[i].deleted).toBe(false);
    }
  });

  it('never filters deleted comments', () => {
    for (let i = 0; i < resolvedComments.length; i++) {
      expect(resolvedComments[i].deleted).toBe(false);
    }
  });

  it('never filters active comments', () => {
    for (let i = 0; i < resolvedComments.length; i++) {
      expect(resolvedComments[i].resolved).not.toBe(false);
      expect(resolvedComments[i].deleted).toBe(false);
    }
  });
});


describe('filterActiveComments', () => {
  it('filters only active, non-deleted comments', () => {
    for (let i = 0; i < activeComments.length; i++) {
      expect(activeComments[i].resolved).toBe(false);
      expect(activeComments[i].deleted).toBe(false);
    }
  });

  it('never filters deleted comments', () => {
    for (let i = 0; i < activeComments.length; i++) {
      expect(activeComments[i].deleted).toBe(false);
    }
  });

  it('never filters resolved comments', () => {
    for (let i = 0; i < activeComments.length; i++) {
      expect(activeComments[i].resolved).toBe(false);
    }
  });
});
