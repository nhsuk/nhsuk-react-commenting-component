import React, { FunctionComponent } from 'react';
import type { Store } from '../../state';
import CommentComponent from '../Comment/index';
import { LayoutController } from '../../utils/layout';
import { Author, Comment } from '../../state/comments';
import { defaultStrings } from '../../main';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

interface CommentsTabsProps {
  store: Store;
  author?: Author;
}

export const CommentsTabs: FunctionComponent<CommentsTabsProps> = ({
  store,
  author,
}) => {
  const layout = new LayoutController();

  const [state, setState] = React.useState(store.getState());
  store.subscribe(() => {
    setState(store.getState());
  });

  const commentsToRender: Comment[] = Array.from(
    state.comments.comments.values()
  );

  const resolvedCommentsToRender = commentsToRender.filter(({ resolved }) => (resolved));

  const activeCommentsToRender = commentsToRender.filter(({ deleted, resolved }) => !(deleted || resolved));

  function commentsRenderd(comments: Comment[]) {
    return comments.map((comment) => (
      <CommentComponent
        key={comment.localId}
        store={store}
        layout={layout}
        user={
          author || {
            id: 1,
            name: 'Admin',
          }
        }
        comment={comment}
        isVisible={true}
        isFocused={comment.localId === state.comments.focusedComment}
        strings={defaultStrings}
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
