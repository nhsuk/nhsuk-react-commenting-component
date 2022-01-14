/* eslint-disable react/prop-types */

import React from 'react';

import type { Store } from '../../state';
import type { Comment, CommentReply, Author } from '../../state/comments';
import { updateReply, deleteReply } from '../../actions/comments';
import type { TranslatableStrings } from '../../main';
import { CommentMenu } from '../CommentMenu';
import { CommentFooter } from '../CommentFooter';
import TextArea from '../TextArea';

export function getRequestOptions(verb: string, apiKey: string, body?: string) {
  let csrftoken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='));
  if (csrftoken) {
    csrftoken = csrftoken.split('=')[1];
  } else {
    // error condition - error message and return
    return {};
  }
  const headerOptions = {
    'X-CSRFToken': csrftoken,
    'subscription-key': apiKey,
    'Content-Type': 'text/html; charset=UTF-8',
  };
  const headers = new Headers(headerOptions);
  return {
    method: verb,
    headers,
    mode: 'same-origin' as RequestMode,
    body: body,
  };
}

export async function makeRequest(remoteId: number,
  verb: string,
  action: string,
  apiUrl: string,
  apiKey: string,
  body?: string) {
  const request = new Request(
    apiUrl + '/workflow-api/reply/' + remoteId + '/' + action + '/',
    getRequestOptions(verb, apiKey, body),
  );
  const response = await fetch(request);
  // Check the response status for != 200, show error message?
  if (response.status !== 200) {
    /* eslint-disable no-console */
    console.error('Failed to make request ' + response);
    console.error(response);
    /* eslint-enable no-console */
    return { success: 'False', error: response.status };
  }

  let decodedData = '';
  if (response.body) {
    const responseReader = response.body.getReader();
    if (responseReader) {
      const responseData = await responseReader.read();
      decodedData = new TextDecoder().decode(responseData.value);
      return decodedData;
    }
    return { success: 'False', error: 'Failed to retrieve response body' };
  }
  return { success: 'False', error: 'Failed to retrieve response body' };
}

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
      exports.makeRequest(reply.remoteId,
        'PUT',
        'update',
        settings.apiUrl,
        settings.apiKey,
        reply.newText)
        .then(response => {
          /* eslint-disable-next-line dot-notation */
          if (response['success'] === 'False') {
            /* eslint-disable-next-line no-console, dot-notation */
            console.error(response['error']);
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
      exports.makeRequest(reply.remoteId,
        'DELETE',
        'delete',
        settings.apiUrl,
        settings.apiKey)
        .then(response => {
          /* eslint-disable-next-line dot-notation */
          if (response['success'] === 'False') {
            /* eslint-disable-next-line no-console, dot-notation */
            console.error(response['error']);
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

export default class CommentReplyComponent extends React.Component<CommentReplyProps> {
  renderEditing(): React.ReactFragment {
    const { comment, reply, store, strings, isFocused } = this.props;

    const onChangeText = (value: string) => {
      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          newText: value,
        })
      );
    };

    const onSave = async (e: React.FormEvent) => {
      e.preventDefault();
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

    return (
      <>
        <CommentMenu
          commentItem={reply}
          store={store}
          strings={strings}
          focused={isFocused}
        />
        <CommentFooter commentItem={reply} />
        <form onSubmit={onSave}>
          <TextArea
            className="comment-reply__input"
            value={reply.newText}
            onChange={onChangeText}
          />
          <div className="comment-reply__actions">
            <button
              type="submit"
              disabled={reply.newText.length === 0}
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
    const { reply, store, strings, isFocused } = this.props;

    return (
      <>
        <CommentMenu
          commentItem={reply}
          store={store}
          strings={strings}
          focused={isFocused}
        />
        <p className="comment-reply__text">{reply.text}</p>
        <CommentFooter commentItem={reply} />
        <div className="comment-reply__progress">{strings.SAVING}</div>
      </>
    );
  }

  renderSaveError(): React.ReactFragment {
    const { comment, reply, store, strings, isFocused } = this.props;

    const onClickRetry = async (e: React.MouseEvent) => {
      e.preventDefault();

      await saveCommentReply(comment, reply, store);
    };

    return (
      <>
        <CommentMenu
          commentItem={reply}
          store={store}
          strings={strings}
          focused={isFocused}
        />
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
    const { comment, reply, store, strings, isFocused } = this.props;

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
        <CommentMenu
          commentItem={reply}
          store={store}
          strings={strings}
          focused={isFocused}
        />
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
    const { reply, store, strings, isFocused } = this.props;

    return (
      <>
        <CommentMenu
          commentItem={reply}
          store={store}
          strings={strings}
          focused={isFocused}
        />
        <p className="comment-reply__text">{reply.text}</p>
        <CommentFooter commentItem={reply} />
        <div className="comment-reply__progress">{strings.DELETING}</div>
      </>
    );
  }

  renderDeleteError(): React.ReactFragment {
    const { comment, reply, store, strings, isFocused } = this.props;

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
        <CommentMenu
          commentItem={reply}
          store={store}
          strings={strings}
          focused={isFocused}
        />
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
    const { comment, reply, store, strings, isFocused } = this.props;

    // Show edit/delete buttons if this reply was authored by the current user
    let onEdit;
    let onDelete;
    if (reply.author === null || this.props.user && this.props.user.id === reply.author.userId) {
      onEdit = () => {
        store.dispatch(
          updateReply(comment.localId, reply.localId, {
            mode: 'editing',
            newText: reply.text,
          })
        );
      };

      onDelete = () => {
        store.dispatch(
          updateReply(comment.localId, reply.localId, {
            mode: 'delete_confirm',
          })
        );
      };
    }

    return (
      <>
        <CommentMenu
          commentItem={reply}
          store={store}
          strings={strings}
          onEdit={onEdit}
          onDelete={onDelete}
          focused={isFocused}
        />
        <p className="comment-reply__text">{reply.text}</p>
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
