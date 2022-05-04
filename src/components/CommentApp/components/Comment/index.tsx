/* eslint-disable react/prop-types */

import React from 'react';
import ReactDOM from 'react-dom';
import FocusTrap from 'focus-trap-react';
import dateFormat from 'dateformat';

import type { Store } from '../../state';
import { Author, Comment, newCommentReply } from '../../state/comments';
import {
  updateComment,
  deleteComment,
  resolveComment,
  reopenComment,
  setFocusedComment,
  addReply
} from '../../actions/comments';
import { LayoutController } from '../../utils/layout';
import { getNextReplyId } from '../../utils/sequences';
import CommentReplyComponent from '../CommentReply';
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

export async function saveComment(comment: Comment, store: Store) {
  store.dispatch(
    updateComment(comment.localId, {
      mode: 'saving',
    })
  );

  try {
    store.dispatch(
      updateComment(comment.localId, {
        mode: 'default',
        text: comment.newText,
        remoteId: comment.remoteId,
        author: comment.author,
        date: comment.date,
      })
    );
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error(err);
    store.dispatch(
      updateComment(comment.localId, {
        mode: 'save_error',
      })
    );
  }

  if (!comment.remoteId && !comment.localId) {
    return;
  } else if (comment.remoteId && comment.localId) {
    // Edit of an existing comment
    const settings = store.getState().settings;
    if (settings.apiEnabled) {
      const requestBody = getRequestBody(comment.newText, settings.authUserId);
      makeRequest(comment.remoteId,
        'comment',
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
  } else if (!comment.remoteId && comment.localId) {
    // Add a new comment
    const settings = store.getState().settings;
    if (settings.apiEnabled) {
      // Get the share_id from the url
      let shareId = '';
      const shareIdArray = document.location.href.match('/cms/share/(.*)/');
      if (shareIdArray) {
        shareId = shareIdArray[1];
      }
      const requestBody = getRequestBody(comment.newText,
        settings.authUserId,
        shareId,
        comment.contentpath,
        comment.position,
        comment.highlightedText);
      makeRequest(-1,
        'comment',
        'POST',
        'add',
        settings.apiUrl,
        settings.apiKey,
        requestBody)
        .then(response => {
          if (checkSuccessFalse(response)) {
            return;
          }
          const responseJson = JSON.parse(String(response));
          store.dispatch(
            updateComment(comment.localId, {
              /* eslint-disable-next-line dot-notation */
              remoteId: responseJson['commentId'],
            }));
        });
    }
  }
}

export async function doDeleteComment(comment: Comment, store: Store) {
  try {
    store.dispatch(deleteComment(comment.localId));
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error(err);
    store.dispatch(
      updateComment(comment.localId, {
        mode: 'delete_error',
      })
    );
  }
  if (!comment.remoteId || !comment.localId) {
    return;
  }
  const settings = store.getState().settings;
  if (settings.apiEnabled) {
    const guestUserDetails = getUserDetails(settings.authUserId);
    makeRequest(comment.remoteId,
      'comment',
      'DELETE',
      'delete',
      settings.apiUrl,
      settings.apiKey,
      guestUserDetails)
      .then(response => {
        if (checkSuccessFalse(response)) {
          return;
        }
      });
  }
}

export async function doResolveComment(comment: Comment, store: Store) {
  const user = store.getState().settings.user;
  if (!user) {
    return;
  }
  try {
    store.dispatch(
      resolveComment(comment.localId, user)
    );
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error(err);
    store.dispatch(
      updateComment(comment.localId, {
        mode: 'save_error',
      })
    );
  }

  if (!comment.remoteId || !comment.localId) {
    return;
  }
  const settings = store.getState().settings;
  if (settings.apiEnabled) {
    const guestUserDetails = getUserDetails(settings.authUserId);
    makeRequest(comment.remoteId,
      'comment',
      'PUT',
      'resolve',
      settings.apiUrl,
      settings.apiKey,
      guestUserDetails
    )
      .then(response => {
        if (checkSuccessFalse(response)) {
          return;
        }
      });
  }
}

function doReopenComment(comment: Comment, store: Store) {
  store.dispatch(
    reopenComment(comment.localId)
  );
  const settings = store.getState().settings;
  if (settings.apiEnabled) {
    if (comment.remoteId) {
      const guestUserDetails = getUserDetails(settings.authUserId);
      makeRequest(comment.remoteId,
        'comment',
        'PUT',
        'reopen',
        settings.apiUrl,
        settings.apiKey,
        guestUserDetails)
        .then(response => {
          if (checkSuccessFalse(response)) {
            return;
          }
        });
    }
  }
}

function highlightContent(comment: Comment, mode: string) {
  let highlightElements = document.querySelectorAll("[id='" + comment.contentpath + "-']");
  if (comment.position) {
    // eslint-disable-next-line quotes
    highlightElements = document.querySelectorAll("[id='" + comment.contentpath + "-" + comment.position.replace(/"/gi, '') + "']");
  }
  if (highlightElements) {
    for (let elem = 0;  elem < highlightElements.length; elem++) {
      if (mode === 'hover' && highlightElements[elem].className === 'highlight-comment') {
        highlightElements[elem].className = 'highlight-comment-hover';
      } else if (mode === 'click' && highlightElements[elem].className !== '') {
        highlightElements[elem].className = 'highlight-comment-selected';
      }
    }
  }
}

function unHighlightContent(comment: Comment) {
  let highlightElements = document.querySelectorAll("[id='" + comment.contentpath + "-']");
  if (comment.position) {
    // eslint-disable-next-line quotes
    highlightElements = document.querySelectorAll("[id='" + comment.contentpath + "-" + comment.position.replace(/"/gi, '') + "']");
  }
  if (highlightElements) {
    for (let elem = 0; elem < highlightElements.length; elem++) {
      if (highlightElements[elem].className === 'highlight-comment-hover') {
        highlightElements[elem].className = 'highlight-comment';
      }
    }
  }
}

function removeHighlightContent(comment: Comment) {
  let highlightElements = document.querySelectorAll("[id='" + comment.contentpath + "-']");
  if (comment.position) {
    // eslint-disable-next-line quotes
    highlightElements = document.querySelectorAll("[id='" + comment.contentpath + "-" + comment.position.replace(/"/gi, '') + "']");
  }
  if (highlightElements) {
    for (let elem = 0; elem < highlightElements.length; elem++) {
      const innerText = highlightElements[elem].textContent;
      if (innerText) {
        highlightElements[elem].replaceWith(highlightElements[elem].textContent!);
      }
    }
  }
}

export function getAdjustedIndex(html: string, targetIndex: number) {
  let htmlIndex = 0;
  let visibleCharsIndex = 0;
  let countChars = true;
  while (visibleCharsIndex < targetIndex) {
    if (html[htmlIndex] === '<') {
      countChars = false;
    }
    if (html[htmlIndex] === '&') {
      countChars = false;
    }
    if (countChars) {
      visibleCharsIndex += 1;
    }
    if (html[htmlIndex] === '>') {
      countChars = true;
    }
    if (html[htmlIndex] === ';') {
      countChars = true;
      visibleCharsIndex += 1;  // html characters display as a single char
    }
    htmlIndex += 1;
  }
  if (html.substring(htmlIndex, htmlIndex + 7) ===  '</span>') {
    htmlIndex += 7;
  }
  return htmlIndex;
}

export function getContentPathParts(contentpath: string) {
  const contentPathParts = contentpath.split('.');
  if (contentPathParts[2] === 'content') {
    contentPathParts[2] = 'content.' + contentPathParts[3];
    contentPathParts.pop();
  }
  return contentPathParts;
}

export interface CommentProps {
  store: Store;
  comment: Comment;
  isFocused: boolean;
  forceFocus: boolean;
  isVisible: boolean;
  layout: LayoutController;
  user: Author | null;
  strings: TranslatableStrings;
}

export interface CommentState {
  collapseReplies: boolean;
  isShowAll: boolean;
}

// This value dictates how many characters from a comment will be displayed
// before an action from the user is required to display the full comment
const characterLimit = 200;

export default class CommentComponent extends React.Component<CommentProps, CommentState> {
  constructor(props) {
    super(props);
    let collapseReplies = false;
    let isShowAll = true;
    if (props.comment.replies.size > 1) {
      collapseReplies = true;
    }
    if (this.props.comment.text.length > characterLimit) {
      isShowAll = false;
    }
    this.state = { collapseReplies, isShowAll };
  }

  renderReplies({ hideNewReply = false } = {}): React.ReactFragment {
    const { comment, isFocused, store, user, strings } = this.props;

    if (!comment.remoteId) {
      // Hide replies UI if the comment itself isn't saved yet
      return <></>;
    }

    const onChangeNewReply = (value: string) => {
      store.dispatch(
        updateComment(comment.localId, {
          newReply: value,
        })
      );
    };

    const sendReply = async (e: React.FormEvent) => {
      e.preventDefault();

      const replyId = getNextReplyId();
      const reply = newCommentReply(replyId, user, Date.now(), {
        text: comment.newReply,
        mode: 'default',
      });
      store.dispatch(addReply(comment.localId, reply));

      store.dispatch(
        updateComment(comment.localId, {
          newReply: '',
        })
      );
      const settings = store.getState().settings;
      if (settings.apiEnabled) {
        if (comment.remoteId) {
          const requestBody = getRequestBody(comment.newReply, settings.authUserId);
          makeRequest(comment.remoteId,
            'comment',
            'POST',
            'add_reply',
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
    };

    const onClickCancelReply = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          newReply: '',
        })
      );

      store.dispatch(setFocusedComment(null));

      // Stop the event bubbling so that the comment isn't immediately refocused
      e.stopPropagation();
    };

    const replies: React.ReactNode[] = [];
    let replyBeingEdited = false;
    for (const reply of comment.replies.values()) {
      if (reply.mode === 'saving' || reply.mode === 'editing') {
        replyBeingEdited = true;
      }

      if (!reply.deleted) {
        replies.push(
          <CommentReplyComponent
            key={reply.localId}
            store={store}
            user={user}
            comment={comment}
            reply={reply}
            strings={strings}
            isFocused={isFocused}
          />
        );
      }
    }

    // Hide new reply if a reply is being edited as well
    const newReplyHidden = hideNewReply || replyBeingEdited;

    const charLimit = 5000;

    let replyForm = <></>;
    if (!newReplyHidden && (isFocused || comment.newReply)) {
      replyForm = (
        <form onSubmit={sendReply}>
          <TextArea
            className="comment__reply-input"
            placeholder="Type your reply"
            value={comment.newReply}
            onChange={onChangeNewReply}
          />
          <p className="comment__reply-character-limit">
            Characters remaining: {charLimit - comment.newReply.length}
          </p>
          <div className="comment__reply-actions">
            <button
              disabled={comment.newReply.length === 0 || comment.newReply.length > charLimit}
              type="submit"
              className="comment__button comment__button--primary"
            >
              {strings.SAVE}
            </button>
            <button
              type="button"
              disabled={comment.newReply.length === 0}
              onClick={onClickCancelReply}
              className="comment__button comment__button--cancel"
            >
              {strings.CANCEL}
            </button>
          </div>
        </form>
      );
    } else if (replies.length === 0) {
      // If there is no form, or replies, don't add any elements to the dom
      // This is in case there is a warning after the comment, some special styling
      // is added if that element is that last child so we can't have any hidden elements here.
      return <></>;
    }

    if (this.state.collapseReplies && replies.length > 1) {
      return (
        <>
          <ul className="comment__replies">
            <button
              type="button"
              onClick={() => this.setState({ collapseReplies: false })}
              className="comment__replies-collapse show-replies"
            >
              Show {replies.length - 1} more replies
            </button>
            {replies[replies.length - 1]}
          </ul>
          {replyForm}
        </>
      );
    }

    if (!this.state.collapseReplies && replies.length > 1) {
      return (
        <>
          <ul className="comment__replies">
            {replies.slice(0, -1)}
            <button
              type="button"
              onClick={() => this.setState({ collapseReplies: true })}
              className="comment__replies-collapse hide-replies"
            >
              Hide replies
            </button>
            {replies[replies.length - 1]}
          </ul>
          {replyForm}
        </>
      );
    }

    return (
      <>
        <ul className="comment__replies">{replies}</ul>
        {replyForm}
      </>
    );
  }

  renderResolvedInfo(): React.ReactFragment {
    const { comment, store } = this.props;
    const date = comment.resolvedDate;
    const shareType = store.getState().settings.shareType;
    const shareUrl = store.getState().settings.shareUrl;

    if (!comment.resolved) {
      return <></>;
    }

    return (
      <>
        <div className="comment__resolved-info">
          <p>
            Comment resolved in <a href={shareUrl}>{shareType}</a>
            <span className="resolved-date">{dateFormat(date, 'HH:MM mmmm d')}</span>
          </p>
        </div>
      </>
    );
  }

  renderCreating(): React.ReactFragment {
    const { comment, store, strings, isFocused } = this.props;

    const onChangeText = (value: string) => {
      store.dispatch(
        updateComment(comment.localId, {
          newText: value,
        })
      );
    };

    const onSave = async (e: React.FormEvent) => {
      e.preventDefault();
      await saveComment(comment, store);
    };

    const onCancel = (e: React.MouseEvent) => {
      e.preventDefault();
      removeHighlightContent(comment);
      store.dispatch(deleteComment(comment.localId));
    };

    const descriptionId = `comment-description-${comment.localId}`;

    return (
      <>
        <div className="comment__original">
          <CommentMenu
            commentItem={comment}
            store={store}
            strings={strings}
            focused={isFocused}
          />
          <p className="comment__highlighted_text nhsuk-u-font-size-16">{comment.highlightedText}</p>
        </div>
        <form onSubmit={onSave}>
          <TextArea
            focusTarget={isFocused}
            className="comment__input"
            value={comment.newText}
            onChange={onChangeText}
            placeholder="Type your comment"
            additionalAttributes={{
              'aria-describedby': descriptionId
            }}
          />
          <div className="comment__actions">
            <button
              disabled={comment.newText.length === 0}
              type="submit"
              className="comment__button comment__button--primary"
            >
              {strings.SAVE}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="comment__button"
            >
              {strings.CANCEL}
            </button>
          </div>
        </form>
      </>
    );
  }

  renderEditing(): React.ReactFragment {
    const { comment, store, strings, isFocused } = this.props;

    const onChangeText = (value: string) => {
      store.dispatch(
        updateComment(comment.localId, {
          newText: value,
        })
      );
    };

    const onSave = async (e: React.FormEvent) => {
      e.preventDefault();

      if (comment.newText.length <= characterLimit) {
        this.setState({ isShowAll: true });
      } else {
        this.setState({ isShowAll: false });
      }

      await saveComment(comment, store);
    };

    const onCancel = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          mode: 'default',
          newText: comment.text,
        })
      );
    };

    const descriptionId = `comment-description-${comment.localId}`;

    return (
      <>
        <div className="comment__original">
          <p className="comment__highlighted_text nhsuk-u-font-size-16">{comment.highlightedText}</p>
          <CommentFooter
            descriptionId={descriptionId}
            commentItem={comment}
          />
          <form onSubmit={onSave}>
            <TextArea
              focusTarget={isFocused}
              className="comment__input nhsuk-input"
              value={comment.newText}
              additionalAttributes={{
                'aria-describedby': descriptionId
              }}
              onChange={onChangeText}
            />
            <div className="comment__actions">
              <button
                disabled={comment.newText.length === 0}
                type="submit"
                className="comment__button comment__button--primary"
              >
                {strings.SAVE}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="comment__button"
              >
                {strings.CANCEL}
              </button>
            </div>
          </form>
        </div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderSaving(): React.ReactFragment {
    const { comment, store, strings, isFocused } = this.props;

    return (
      <>
        <CommentMenu
          commentItem={comment}
          store={store}
          strings={strings}
          focused={isFocused}
        />
        <p className="comment__text">{comment.text}</p>
        <CommentFooter
          commentItem={comment}
        />
        <div className="comment__progress">{strings.SAVING}</div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderSaveError(): React.ReactFragment {
    const { comment, store, strings, isFocused } = this.props;

    const onClickRetry = async (e: React.MouseEvent) => {
      e.preventDefault();

      await saveComment(comment, store);
    };

    return (
      <>
        <div className="comment__original">
          <CommentMenu
            commentItem={comment}
            store={store}
            strings={strings}
            focused={isFocused}
          />
          <p className="comment__highlighted_text nhsuk-u-font-size-16">{comment.highlightedText}</p>
          <p className="comment__text">{comment.text}</p>
          <CommentFooter commentItem={comment} />
          {this.renderReplies({ hideNewReply: true })}
          <div className="comment__error">
            {strings.SAVE_ERROR}
            <button
              type="button"
              className="comment__button"
              onClick={onClickRetry}
            >
              {strings.RETRY}
            </button>
          </div>
        </div>
      </>
    );
  }

  renderDeleteConfirm(): React.ReactFragment {
    const { comment, store, strings, isFocused } = this.props;

    const onClickDelete = async (e: React.MouseEvent) => {
      e.preventDefault();
      removeHighlightContent(comment);
      await doDeleteComment(comment, store);
    };

    const onClickCancel = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          mode: 'default',
        })
      );
    };

    return (
      <>
        <div className="comment__original">
          <CommentMenu
            commentItem={comment}
            store={store}
            strings={strings}
            focused={isFocused}
          />
          <p className="comment__highlighted_text nhsuk-u-font-size-16">{comment.highlightedText}</p>
          <p className="comment__text">{comment.text}</p>
          <CommentFooter commentItem={comment} />
          <div className="comment__confirm-delete">
            {strings.CONFIRM_DELETE_COMMENT}
            <button
              type="button"
              className="comment__button"
              onClick={onClickCancel}
            >
              {strings.CANCEL}
            </button>
            <button
              type="button"
              className="comment__button comment__button--primary"
              onClick={onClickDelete}
            >
              {strings.DELETE}
            </button>
          </div>
        </div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderDeleting(): React.ReactFragment {
    const { comment, store, strings, isFocused } = this.props;

    return (
      <>
        <div className="comment__original">
          <CommentMenu
            commentItem={comment}
            store={store}
            strings={strings}
            focused={isFocused}
          />
          <p className="comment__highlighted_text nhsuk-u-font-size-16">{comment.highlightedText}</p>
          <p className="comment__text">{comment.text}</p>
          <CommentFooter commentItem={comment} />
          <div className="comment__progress">{strings.DELETING}</div>
        </div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderDeleteError(): React.ReactFragment {
    const { comment, store, strings, isFocused } = this.props;

    const onClickRetry = async (e: React.MouseEvent) => {
      e.preventDefault();

      await doDeleteComment(comment, store);
    };

    const onClickCancel = async (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          mode: 'default',
        })
      );
    };

    return (
      <>
        <div className="comment__original">
          <CommentMenu
            commentItem={comment}
            store={store}
            strings={strings}
            focused={isFocused}
          />
          <p className="comment__highlighted_text nhsuk-u-font-size-16">{comment.highlightedText}</p>
          <p className="comment__text">{comment.text}</p>
          <CommentFooter commentItem={comment} />
        </div>
        {this.renderReplies({ hideNewReply: true })}
        <div className="comment__error">
          {strings.DELETE_ERROR}
          <button
            type="button"
            className="comment__button"
            onClick={onClickCancel}
          >
            {strings.CANCEL}
          </button>
          <button
            type="button"
            className="comment__button"
            onClick={onClickRetry}
          >
            {strings.RETRY}
          </button>
        </div>
      </>
    );
  }

  renderDefault(): React.ReactFragment {
    const { comment, store, strings, isFocused } = this.props;
    const limitedComment = comment.text.substring(0, characterLimit);

    // Show edit/delete buttons if this comment was authored by the current user
    let onEdit;
    let onDelete;
    if (isAuthorTheExternalUser(comment.author, this.props.user) ||
      isAuthorTheCurrentUser(comment.author, store.getState().settings.authUserId) ||
      isAuthorTheCurrentGuestUser(comment.author)) {
      onEdit = () => {
        store.dispatch(
          updateComment(comment.localId, {
            mode: 'editing',
            newText: comment.text,
          })
        );
      };

      onDelete = () => {
        store.dispatch(
          updateComment(comment.localId, {
            mode: 'delete_confirm',
          })
        );
      };
    }

    let resolveMethod;
    let reopenMethod;
    const status = getStatus();
    if (status === 'Approved') {
      onEdit = null;
      onDelete = null;
    } else {
      resolveMethod = doResolveComment;
      reopenMethod = doReopenComment;
    }

    if (this.state.isShowAll) {
      return (
        <>
          <div className="comment__original">
            <CommentMenu
              commentItem={comment}
              store={store}
              strings={strings}
              onResolve={resolveMethod}
              onReopen={reopenMethod}
              onEdit={onEdit}
              onDelete={onDelete}
              focused={isFocused}
            />
            <p className="comment__highlighted_text nhsuk-u-font-size-16">{comment.highlightedText}</p>
            <p className="comment__text">{comment.text}</p>
            <CommentFooter commentItem={comment} />
          </div>
          {this.renderReplies()}
          {this.renderResolvedInfo()}
        </>
      );
    }

    return (
      <>
        <div className="comment__original">
          <CommentMenu
            commentItem={comment}
            store={store}
            strings={strings}
            onResolve={resolveMethod}
            onReopen={reopenMethod}
            onEdit={onEdit}
            onDelete={onDelete}
            focused={isFocused}
          />
          <p className="comment__highlighted_text nhsuk-u-font-size-16">{comment.highlightedText}</p>
          <p className="comment__text">
            {limitedComment}
            <a className="comment__text-show-all" onClick={() => this.setState({ isShowAll: true })}>...</a>
          </p>
          <CommentFooter commentItem={comment} />
        </div>
        {this.renderReplies()}
        {this.renderResolvedInfo()}
      </>
    );
  }

  render() {
    let inner: React.ReactFragment;

    switch (this.props.comment.mode) {
    case 'creating':
      inner = this.renderCreating();
      break;
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

    const onClick = () => {
      const status = getStatus();
      if (status !== 'Approved') {
        this.props.store.dispatch(
          setFocusedComment(this.props.comment.localId,
            { updatePinnedComment: false, forceFocus: this.props.isFocused && this.props.forceFocus }
          )
        );
        highlightContent(this.props.comment, 'click');
      }
    };

    const onDoubleClick = () => {
      const status = getStatus();
      if (status !== 'Approved') {
        this.props.store.dispatch(
          setFocusedComment(this.props.comment.localId, { updatePinnedComment: true, forceFocus: true })
        );
      }
    };

    const onMouseEnter = () => {
      highlightContent(this.props.comment, 'hover');
    };

    const onMouseLeave = () => {
      unHighlightContent(this.props.comment);
    };

    // const top = this.props.layout.getCommentPosition(
    //   this.props.comment.localId
    // );

    return (
      <FocusTrap
        focusTrapOptions={{
          preventScroll: true,
          clickOutsideDeactivates: true,
          onDeactivate: () => {
            this.props.store.dispatch(
              setFocusedComment(null, { updatePinnedComment: true, forceFocus: false })
            );
          },
          initialFocus: '[data-focus-target="true"]',
        } as any} // For some reason, the types for FocusTrap props don't yet include preventScroll.
        active={this.props.isFocused && this.props.forceFocus}
      >
        <li
          tabIndex={-1}
          data-focus-target={this.props.isFocused && !['creating', 'editing'].includes(this.props.comment.mode)}
          key={this.props.comment.localId}
          className={
            `comment comment--mode-${this.props.comment.mode} ${this.props.isFocused ? 'comment--focused' : ''}`
          }
          // style={{
          //   position: 'absolute',
          //   top: `${top}px`,
          //   display: this.props.isVisible ? 'block' : 'none',
          // }}
          data-comment-id={this.props.comment.localId}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {inner}
        </li>
      </FocusTrap>
    );
  }

  componentDidMount() {
    const element = ReactDOM.findDOMNode(this);

    if (element instanceof HTMLElement) {
      this.props.layout.setCommentElement(this.props.comment.localId, element);

      if (this.props.isVisible) {
        this.props.layout.setCommentHeight(
          this.props.comment.localId,
          element.offsetHeight
        );
      }
    }
    this.highlightContent();
  }

  getHighlightNode(contentPathParts: string[], parentNode: any) {
    const node = parentNode.querySelector('[data-contentpath="' + contentPathParts[0] + '"]');
    if (contentPathParts.length === 1) {
      return node;
    }
    contentPathParts.shift();
    return this.getHighlightNode(contentPathParts, node);
  }

  parseContentPositions(contentPositionsJson) {
    const posDict = {};
    for (const position of contentPositionsJson) {
      if (position.key in posDict) {
        if (position.start < posDict[position.key].start) {
          posDict[position.key].start = position.start;
        }
        if (position.end > posDict[position.key].start) {
          posDict[position.key].end = position.end;
        }
      } else {
        posDict[position.key] = { start: position.start, end: position.end };
      }
    }
    return posDict;
  }

  highlightBlocknode(highlightNode, resolved: boolean) {
    if (resolved) {
      const highlightSpan = document.getElementById(this.props.comment.contentpath
        + '-' + this.props.comment.position.replace(/"/gi, ''));
      if (highlightSpan) {
        highlightSpan.classList.remove('highlight-comment');
      }
      return;
    }
    const positions = this.parseContentPositions(JSON.parse(this.props.comment.position));
    // eslint-disable-next-line no-restricted-syntax
    for (const key in positions) {
      if (Object.prototype.hasOwnProperty.call(positions, key)) {
        const blockNode = highlightNode.querySelector('[data-block-key="' + key + '"]');
        const start = getAdjustedIndex(blockNode.innerHTML, positions[key].start);
        const end = getAdjustedIndex(blockNode.innerHTML, positions[key].end);
        const highlighted = blockNode.innerHTML.slice(0, start)
          + '<span class="highlight-comment" id="'
          + this.props.comment.contentpath
          + '-'
          + this.props.comment.position.replace(/"/gi, '') + '">'
          + blockNode.innerHTML.slice(start, end)
          + '</span>'
          + blockNode.innerHTML.slice(end, blockNode.innerHTML.length);
        blockNode.innerHTML = highlighted;
      }
    }
  }

  highlightContent() {
    const contentPathParts = getContentPathParts(this.props.comment.contentpath);
    const highlightNode = this.getHighlightNode(contentPathParts, document);
    if (this.props.comment.resolved) {
      if (this.props.comment.position && this.props.comment.position.length > 0) {
        this.highlightBlocknode(highlightNode, true);
      } else if (highlightNode) {
        highlightNode.classList.remove('highlight-comment');
      }
      return;
    }

    if (highlightNode) {
      if (this.props.comment.position && this.props.comment.position.length > 0) {
        this.highlightBlocknode(highlightNode, false);
      } else {
        highlightNode.innerHTML = '<span class= "highlight-comment" id="'
          + this.props.comment.contentpath
          + '-">'
          + highlightNode.innerHTML
          + '</span>';
      }
    }
  }

  componentWillUnmount() {
    this.props.layout.setCommentElement(this.props.comment.localId, null);
  }

  componentDidUpdate() {
    const element = ReactDOM.findDOMNode(this);

    // Keep height up to date so that other comments will be moved out of the way
    if (this.props.isVisible && element instanceof HTMLElement) {
      this.props.layout.setCommentHeight(
        this.props.comment.localId,
        element.offsetHeight
      );
    }
  }
}
