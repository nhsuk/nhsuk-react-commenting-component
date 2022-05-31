/* eslint-disable react/prop-types */

import React from 'react';

import type { Store } from '../../state';
import type { Comment, CommentReply, Author } from '../../state/comments';
import { updateReply, deleteReply } from '../../actions/comments';
import type { TranslatableStrings } from '../../main';
import { CommentMenu } from '../CommentMenu';
import { CommentFooter } from '../CommentFooter';
import TextArea from '../TextArea';
import {
  makeRequest,
  getRequestBody,
  getUserDetails,
  isAuthorTheCurrentUser,
  isAuthorTheExternalUser,
  isAuthorTheCurrentGuestUser,
  checkSuccessFalse,
  getStatus
} from '../utils';

export async function saveCommentReply(
  comment: Comment,
  reply: CommentReply,
  store: Store
) {
  store.dispatch(
    updateReply(comment.localId, reply.localId, {
      mode: 'saving',
    })
  );

  try {
    store.dispatch(
      updateReply(comment.localId, reply.localId, {
        mode: 'default',
        text: reply.newText,
        author: reply.author,
      })
    );
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error(err);
    store.dispatch(
      updateReply(comment.localId, reply.localId, {
        mode: 'save_error',
      })
    );
  }
  const settings = store.getState().settings;
  if (settings.apiEnabled) {
    if (reply.remoteId) {
      const requestBody = getRequestBody(reply.newText, settings.authUserId);
      makeRequest(reply.remoteId,
        'reply',
        'PUT',
        'update',
        settings.apiUrl,
        settings.apiKey,
        requestBody)
        .then(response => {
          if (checkSuccessFalse(response)) {
            return;
          }
        });
    }
  }
}

export async function deleteCommentReply(
  comment: Comment,
  reply: CommentReply,
  store: Store
) {
  store.dispatch(
    updateReply(comment.localId, reply.localId, {
      mode: 'deleting',
    })
  );

  try {
    store.dispatch(deleteReply(comment.localId, reply.localId));
  } catch (err) {
    store.dispatch(
      updateReply(comment.localId, reply.localId, {
        mode: 'delete_error',
      })
    );
  }
  const settings = store.getState().settings;
  if (settings.apiEnabled) {
    if (reply.remoteId) {
      const requestBody = getUserDetails(settings.authUserId);
      makeRequest(reply.remoteId,
        'reply',
        'DELETE',
        'delete',
        settings.apiUrl,
        settings.apiKey,
        requestBody)
        .then(response => {
          if (checkSuccessFalse(response)) {
            return;
          }
        });
    }
  }
}

export interface CommentReplyProps {
  comment: Comment;
  reply: CommentReply;
  store: Store;
  user: Author | null;
  strings: TranslatableStrings;
  isFocused: boolean;
}

export interface CommentReplyState {
  isShowAll: boolean;
}

// This value dictates how many characters from a reply will be displayed
// before an action from the user is required to display the full reply
const replyLimit = 200;

export default class CommentReplyComponent extends React.Component<CommentReplyProps, CommentReplyState> {
  constructor(props) {
    super(props);
    let isShowAll = true;
    if (this.props.reply.text.length > replyLimit) {
      isShowAll = false;
    }
    this.state = { isShowAll  };
  }

  renderReplyMenu(): React.ReactFragment {
    const { comment, reply, store, strings, isFocused } = this.props;

    // If comment is resolved or page status is approved, don't show menu
    const status = getStatus();
    if (status === 'Approved' || comment.resolved) {
      return <></>;
    }
    // Show edit/delete buttons if this reply was authored by the current user
    if (isAuthorTheExternalUser(reply.author, this.props.user) ||
    isAuthorTheCurrentUser(reply.author, store.getState().settings.authUserId, this.props.user) ||
    isAuthorTheCurrentGuestUser(reply.author)) {
      const onEdit = () => {
        store.dispatch(
          updateReply(comment.localId, reply.localId, {
            mode: 'editing',
            newText: reply.text,
          })
        );
      };

      const onDelete = () => {
        store.dispatch(
          updateReply(comment.localId, reply.localId, {
            mode: 'delete_confirm',
          })
        );
      };

      return (
        <CommentMenu
          commentItem={reply}
          store={store}
          strings={strings}
          onEdit={onEdit}
          onDelete={onDelete}
          focused={isFocused}
        />
      );
    }

    return (
      <CommentMenu
        commentItem={reply}
        store={store}
        strings={strings}
        focused={isFocused}
      />
    );
  }


  renderEditing(): React.ReactFragment {
    const { comment, reply, store, strings } = this.props;

    const onChangeText = (value: string) => {
      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          newText: value,
        })
      );
    };

    const onSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (reply.newText.length <= replyLimit) {
        this.setState({ isShowAll: true });
      } else {
        this.setState({ isShowAll: false });
      }
      await saveCommentReply(comment, reply, store);
    };

    const onCancel = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          mode: 'default',
          newText: reply.text,
        })
      );
    };

    const charLimit = 5000;

    return (
      <>
        {this.renderReplyMenu()}
        <CommentFooter commentItem={reply} />
        <form onSubmit={onSave}>
          <TextArea
            className="comment-reply__input"
            value={reply.newText}
            onChange={onChangeText}
          />
          <p className="comment__reply-character-limit">
            Characters remaining: {charLimit - reply.newText.length}
          </p>
          <div className="comment-reply__actions">
            <button
              type="submit"
              disabled={reply.newText.length === 0 || reply.newText.length > charLimit}
              className="comment-reply__button comment-reply__button--primary"
            >
              {strings.SAVE}
            </button>
            <button
              type="button"
              className="comment-reply__button"
              onClick={onCancel}
            >
              {strings.CANCEL}
            </button>
          </div>
        </form>
      </>
    );
  }

  renderSaving(): React.ReactFragment {
    const { reply, strings } = this.props;

    return (
      <>
        {this.renderReplyMenu()}
        <p className="comment-reply__text">{reply.text}</p>
        <CommentFooter commentItem={reply} />
        <div className="comment-reply__progress">{strings.SAVING}</div>
      </>
    );
  }

  renderSaveError(): React.ReactFragment {
    const { comment, reply, store, strings } = this.props;

    const onClickRetry = async (e: React.MouseEvent) => {
      e.preventDefault();

      await saveCommentReply(comment, reply, store);
    };

    return (
      <>
        {this.renderReplyMenu()}
        <p className="comment-reply__text">{reply.text}</p>
        <CommentFooter commentItem={reply} />
        <div className="comment-reply__error">
          {strings.SAVE_ERROR}
          <button
            type="button"
            className="comment-reply__button"
            onClick={onClickRetry}
          >
            {strings.RETRY}
          </button>
        </div>
      </>
    );
  }

  renderDeleteConfirm(): React.ReactFragment {
    const { comment, reply, store, strings } = this.props;

    const onClickDelete = async (e: React.MouseEvent) => {
      e.preventDefault();

      await deleteCommentReply(comment, reply, store);
    };

    const onClickCancel = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          mode: 'default',
        })
      );
    };

    return (
      <>
        {this.renderReplyMenu()}
        <p className="comment-reply__text">{reply.text}</p>
        <CommentFooter commentItem={reply} />
        <div className="comment-reply__confirm-delete">
          {strings.CONFIRM_DELETE_COMMENT}
          <button
            type="button"
            className="comment-reply__button"
            onClick={onClickCancel}
          >
            {strings.CANCEL}
          </button>
          <button
            type="button"
            className="comment-reply__button comment-reply__button--primary"
            onClick={onClickDelete}
          >
            {strings.DELETE}
          </button>
        </div>
      </>
    );
  }

  renderDeleting(): React.ReactFragment {
    const { reply, strings } = this.props;

    return (
      <>
        {this.renderReplyMenu()}
        <p className="comment-reply__text">{reply.text}</p>
        <CommentFooter commentItem={reply} />
        <div className="comment-reply__progress">{strings.DELETING}</div>
      </>
    );
  }

  renderDeleteError(): React.ReactFragment {
    const { comment, reply, store, strings } = this.props;

    const onClickRetry = async (e: React.MouseEvent) => {
      e.preventDefault();

      await deleteCommentReply(comment, reply, store);
    };

    const onClickCancel = async (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          mode: 'default',
        })
      );
    };

    return (
      <>
        {this.renderReplyMenu()}
        <p className="comment-reply__text">{reply.text}</p>
        <CommentFooter commentItem={reply} />
        <div className="comment-reply__error">
          {strings.DELETE_ERROR}
          <button
            type="button"
            className="comment-reply__button"
            onClick={onClickCancel}
          >
            {strings.CANCEL}
          </button>
          <button
            type="button"
            className="comment-reply__button"
            onClick={onClickRetry}
          >
            {strings.RETRY}
          </button>
        </div>
      </>
    );
  }

  renderDefault(): React.ReactFragment {
    const { reply } = this.props;
    const limitedReply = reply.text.substring(0, replyLimit);

    if (this.state.isShowAll) {
      return (
        <>
          {this.renderReplyMenu()}
          <p className="comment-reply__text">{reply.text}</p>
          <CommentFooter commentItem={reply} />
        </>
      );
    }

    return (
      <>
        {this.renderReplyMenu()}
        <p className="comment-reply__text">
          {limitedReply}
          <a className="comment-reply__show-all" onClick={() => this.setState({ isShowAll: true })}>...</a>
        </p>
        <CommentFooter commentItem={reply} />
      </>
    );
  }

  render() {
    let inner: React.ReactFragment;

    switch (this.props.reply.mode) {
    case 'editing':
      inner = this.renderEditing();
      break;
    case 'saving':
      inner = this.renderSaving();
      break;
    case 'save_error':
      inner = this.renderSaveError();
      break;
    case 'delete_confirm':
      inner = this.renderDeleteConfirm();
      break;
    case 'deleting':
      inner = this.renderDeleting();
      break;
    case 'delete_error':
      inner = this.renderDeleteError();
      break;
    default:
      inner = this.renderDefault();
      break;
    }

    return (
      <li
        key={this.props.reply.localId}
        className={`comment-reply comment-reply--mode-${this.props.reply.mode}`}
        data-reply-id={this.props.reply.localId}
      >
        {inner}
      </li>
    );
  }
}
