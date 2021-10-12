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
  // commentsToRender: Comment[];
  author?: Author;
}

export const CommentsTabs: FunctionComponent<CommentsTabsProps> = ({
  store,
  // commentsToRender,
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

  const commentsRendered = commentsToRender.map((comment) => (
    <CommentComponent
      key={comment.localId}
      store={store}
      layout={layout}
      user={
        author || {
          id: 1,
          name: 'Admin',
          avatarUrl: 'https://gravatar.com/avatar/e31ec811942afbf7b9ce0ac5affe426f?s=200&d=robohash&r=x',
        }
      }
      comment={comment}
      isVisible={true}
      isFocused={comment.localId === state.comments.focusedComment}
      strings={defaultStrings}
    />
  ));

  const tabs = (
    <Tabs defaultActiveKey="activeComments" id="uncontrolled-tab" className="mb-3 comments-tabs">
      <Tab eventKey="activeComments" title="Active Comments">
        <ol className="comments-list">{commentsRendered}</ol>
      </Tab>
      <Tab eventKey="resolvedComments" title="Resolved Comments">
        <p>nothing</p>
      </Tab>
    </Tabs>
  );

  return tabs;
};
