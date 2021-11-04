/* eslint-disable react/prop-types */

import dateFormat from 'dateformat';
import React, { FunctionComponent } from 'react';

import { Author } from '../../state/comments';


interface CommentItem {
  author: Author | null;
  date: number;
}

interface CommentFooterProps {
  commentItem: CommentItem;
  descriptionId?: string;
}

export const CommentFooter: FunctionComponent<CommentFooterProps> = ({
  commentItem, descriptionId
}) => {
  const { author, date } = commentItem;

  return (
    <div className="comment-footer">
      <span id={descriptionId}>
        <p className="comment-footer__author comment-footer__date">
          {author ? author.name : ''} | {dateFormat(date, 'HH:MM mmmm d')}
        </p>
      </span>
    </div>
  );
};
