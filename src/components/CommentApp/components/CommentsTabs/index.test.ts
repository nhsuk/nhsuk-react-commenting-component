import { newComment, Comment } from '../../state/comments';
import { getNextCommentId } from '../../utils/sequences';
import { resolveComment } from '../../actions/comments';
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

const resolvedAuthor = {
  id: 2,
  type: 'external',
  firstname: 'Jane',
  lastname: 'Doe',
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
resolveComment(commentsToRender[0].localId, resolvedAuthor);
resolveComment(commentsToRender[1].localId, resolvedAuthor);
// Statically set resolved to true as resolveComment only assigns true if remoteID exists
commentsToRender[0].resolved = true;
commentsToRender[1].resolved = true;

// DELETED
resolveComment(commentsToRender[2].localId, resolvedAuthor);
resolveComment(commentsToRender[3].localId, resolvedAuthor);
// Statically set resolved to true as resolveComment only assigns true if remoteID exists
commentsToRender[2].resolved = true;
commentsToRender[2].deleted = true;
commentsToRender[3].resolved = true;
commentsToRender[3].deleted = true;

// ACTIVE
commentsToRender[4].resolved = false;
commentsToRender[4].deleted = false;

commentsToRender[5].resolved = false;
commentsToRender[5].deleted = false;

let resolvedComments = filterResolvedComments(commentsToRender);
let activeComments = filterActiveComments(commentsToRender);


describe('filterResolvedComments', () => {
  it('filters only resolved comments', () => {
    expect(resolvedComments.length).toBe(2);
    expect(resolvedComments.every(comment => comment.resolved)).toBeTruthy();
    expect(resolvedComments.every(comment => comment.deleted)).toBeFalsy();

    commentsToRender[2].deleted = false;
    resolvedComments = filterResolvedComments(commentsToRender);

    expect(resolvedComments.length).toBe(3);
    expect(resolvedComments.every(comment => comment.resolved)).toBeTruthy();
    expect(resolvedComments.every(comment => comment.deleted)).toBeFalsy();
  });
});


describe('filterActiveComments', () => {
  it('filters only active comments', () => {
    expect(activeComments.length).toBe(2);
    expect(activeComments.every(comment => comment.resolved)).toBeFalsy();
    expect(activeComments.every(comment => comment.deleted)).toBeFalsy();

    commentsToRender[3].resolved = false;
    commentsToRender[3].deleted = false;
    activeComments = filterActiveComments(commentsToRender);

    expect(activeComments.length).toBe(3);
    expect(activeComments.every(comment => comment.resolved)).toBeFalsy();
    expect(activeComments.every(comment => comment.deleted)).toBeFalsy();
  });
});
