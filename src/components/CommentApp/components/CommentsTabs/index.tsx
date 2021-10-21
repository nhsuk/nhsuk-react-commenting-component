import React, { FunctionComponent } from 'react';
import type { Store } from '../../state';
import CommentComponent from '../Comment/index';
import { LayoutController } from '../../utils/layout';
import { Author, Comment } from '../../state/comments';
import type { TranslatableStrings } from '../../main';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

interface CommentsTabsProps {
  store: Store;
  author?: Author;
  strings: TranslatableStrings;
}

export function filterResolvedComments(commentsToRender: Comment[]) {
  return commentsToRender.filter(({ deleted, resolved }) => (!deleted && resolved));
}

export function filterActiveComments(commentsToRender: Comment[]) {
  return commentsToRender.filter(({ deleted, resolved }) => (!deleted && !resolved));
}

export const CommentsTabs: FunctionComponent<CommentsTabsProps> = ({
  store,
  strings,
}) => {
  const layout = new LayoutController();
  const [state, setState] = React.useState(store.getState());
  store.subscribe(() => {
    setState(store.getState());
  });
  const commentsToRender: Comment[] = Array.from(
    state.comments.comments.values()
  );
  const { focusedComment, forceFocus } = state.comments;
  const { commentsEnabled, user, currentTab } = state.settings;
  let resolvedCommentsToRender = filterResolvedComments(commentsToRender);
  let activeCommentsToRender = filterActiveComments(commentsToRender);
  if (!commentsEnabled || !user) {
    resolvedCommentsToRender = [];
    activeCommentsToRender = [];
  }

  function commentsRenderd(comments: Comment[]) {
    return comments.map((comment) => (
      <CommentComponent
        key={comment.localId}
        store={store}
        layout={layout}
        user={user}
        comment={comment}
        isFocused={comment.localId === focusedComment}
        forceFocus={forceFocus}
        isVisible={layout.getCommentVisible(currentTab, comment.localId)}
        strings={strings}
      />
    ));
  }

  const resolvedCommentsRendered = commentsRenderd(resolvedCommentsToRender);

  const activeCommentsRendered = commentsRenderd(activeCommentsToRender);

  const tabs = (
    <Tabs defaultActiveKey="activeComments" id="uncontrolled-tab" className="mb-3 comments-tabs">
      <Tab eventKey="activeComments" title="Active Comments">
        <ol className="comments-list">{activeCommentsRendered}</ol>
      </Tab>
      <Tab eventKey="resolvedComments" title="Resolved Comments">
        <ol className="comments-list">{resolvedCommentsRendered}</ol>
      </Tab>
    </Tabs>
  );

  return tabs;
};
