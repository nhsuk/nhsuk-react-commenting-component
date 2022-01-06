/* eslint-disable react/prop-types */

import React, { FunctionComponent, useState, useEffect, useRef } from 'react';
import Icon from '../../../Icon/Icon';
import type { Store } from '../../state';
import { TranslatableStrings } from '../../main';
import { IS_IE11 } from '../../../../config/wagtailConfig';

import { Comment, Author } from '../../state/comments';

// Details/Summary components that just become <details>/<summary> tags
// except for IE11 where they become <div> tags to allow us to style them
const Details: React.FunctionComponent<React.ComponentPropsWithoutRef<'details'>> = (
  ({ children, open, ...extraProps }) => {
    if (IS_IE11) {
      return (
        <div className={'details-fallback' + (open ? ' details-fallback--open' : '')} {...extraProps}>
          {children}
        </div>
      );
    }

    return (
      <details open={open} {...extraProps}>
        {children}
      </details>
    );
  }
);

const Summary: React.FunctionComponent<React.ComponentPropsWithoutRef<'summary'>> = ({ children, ...extraProps }) => {
  if (IS_IE11) {
    return (
      <button
        className="details-fallback__summary"
        {...extraProps}
      >
        {children}
      </button>
    );
  }

  return (
    <summary {...extraProps}>
      {children}
    </summary>
  );
};

interface CommentItem {
  author: Author | null;
  date: number;
  resolved?: boolean;
  resolvedByAuthor?: Author;
}

interface CommentMenuProps {
  commentItem: CommentItem;
  store: Store;
  strings: TranslatableStrings;
  onResolve?(commentItem: CommentItem, store: Store): void;
  onReopen?(commentItem: CommentItem, store: Store): void;
  onEdit?(commentItem: CommentItem, store: Store): void;
  onDelete?(commentItem: CommentItem, store: Store): void;
  focused: boolean;
}

export const CommentMenu: FunctionComponent<CommentMenuProps> = ({
  commentItem, store, strings, onResolve, onReopen, onEdit, onDelete, focused
}) => {
  const setUnresolvedCommentsPresent = () => {
    const unresolvedComments: Comment[] = Array.from(store.getState().comments.comments.values())
      .filter(comment => !comment.resolved);
    window.unresolvedCommentsPresent = false;
    if (unresolvedComments.length > 0) {
      window.unresolvedCommentsPresent = true;
    }
  };

  setUnresolvedCommentsPresent();

  const onClickResolve = (e: React.MouseEvent) => {
    e.preventDefault();

    if (onResolve) {
      onResolve(commentItem, store);
      setUnresolvedCommentsPresent();
    }
  };

  const onClickReopen = (e: React.MouseEvent) => {
    e.preventDefault();

    if (onReopen) {
      onReopen(commentItem, store);
      setUnresolvedCommentsPresent();
    }
  };

  const onClickEdit = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (onEdit) {
      onEdit(commentItem, store);
    }
  };

  const onClickDelete = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (onDelete) {
      onDelete(commentItem, store);
      setUnresolvedCommentsPresent();
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (menuOpen && !focused) {
      setMenuOpen(false);
    }
  }, [focused]);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    if (menuOpen) {
      setTimeout(() => menuRef.current?.focus(), 1);
    }
  }, [menuOpen]);

  const handleClickOutside = (e: MouseEvent) => {
    if (menuContainerRef.current && e.target instanceof Node && !menuContainerRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  function renderAuthorMenu(author) {
    if (author.type === 'wagtail') {
      return (
        <ul>
          <li>Author</li>
          <li className="comment-menu__author-name">{author.firstname} {author.lastname}</li>
          <li className="comment-menu__author-type">{author.type}</li>
        </ul>
      );
    }
    return (
      <ul>
        <li>Author</li>
        <li className="comment-menu__author-name">{author.firstname} {author.lastname}</li>
        <li className="comment-menu__author-job-title">{author.jobTitle}</li>
        <li className="comment-menu__author-org">{author.organisation}</li>
      </ul>
    );
  }

  function renderResolvedAuthorMenu(resolvedByAuthor: Author) {
    return (
      <div className="comment-menu__resolved-by-info">
        <ul>
          <li>Resolved By</li>
          <li className="comment-menu__author-name">{resolvedByAuthor.firstname} {resolvedByAuthor.lastname}</li>
          <li className="comment-menu__author-job-title">{resolvedByAuthor.jobTitle}</li>
          <li className="comment-menu__author-org">{resolvedByAuthor.organisation}</li>
        </ul>
      </div>
    );
  }

  function renderCommentMenuButtons() {
    if (commentItem.resolved) {
      return (
        <div className="comment-menu__buttons">
          {onReopen && <button type="button" role="menuitem" onClick={onClickReopen}>{strings.REOPEN}</button>}
        </div>
      );
    }
    return (
      <div className="comment-menu__buttons">
        {onResolve && <button type="button" role="menuitem" onClick={onClickResolve}>{strings.RESOLVE}</button>}
        {onEdit && <button type="button" role="menuitem" onClick={onClickEdit}>{strings.EDIT}</button>}
        {onDelete && <button type="button" role="menuitem" onClick={onClickDelete}>{strings.DELETE}</button>}
      </div>
    );
  }

  return (
    <div className="comment-menu">
      <div className="comment-menu__actions">
        {(onEdit || onDelete || onResolve) &&
          <div className="comment-menu__action comment-menu__action--more" ref={menuContainerRef}>
            <Details open={menuOpen} onClick={toggleMenu}>
              <Summary
                aria-label={strings.MORE_ACTIONS}
                aria-haspopup="menu"
                role="button"
                onClick={toggleMenu}
                aria-expanded={menuOpen}
              >
                <Icon name="ellipsis" />
              </Summary>

              <div className="comment-menu__more-actions" role="menu" ref={menuRef}>
                {renderCommentMenuButtons()}
                <div className="comment-menu__author-info">
                  {commentItem.author && renderAuthorMenu(commentItem.author)}
                </div>
                {commentItem.resolvedByAuthor && renderResolvedAuthorMenu(commentItem.resolvedByAuthor)}
              </div>
            </Details>
          </div>
        }
      </div>
    </div>
  );
};
