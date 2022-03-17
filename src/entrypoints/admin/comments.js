import { initCommentApp, defaultStrings } from '../../components/CommentApp/main';
import { STRINGS } from '../../config/wagtailConfig';
const KEYCODE_M = 77;
import {
  newComment
} from '../../components/CommentApp/state/comments';
import { getNextCommentId } from '../../components/CommentApp/utils/sequences';
import {
  addComment,
} from '../../components/CommentApp/actions/comments';

/**
 * Entry point loaded when the comments system is in use.
 */
window.comments = (() => {
  const commentApp = initCommentApp();

  /**
  * Returns true if the provided keyboard event is using the 'add/focus comment' keyboard
  * shortcut
  */
  function isCommentShortcut(e) {
    return (e.ctrlKey || e.metaKey) && e.altKey && e.keyCode === KEYCODE_M;
  }

  function getContentPath(fieldNode) {
    // Return the total contentpath for an element as a string, in the form field.streamfield_uid.block...
    if (fieldNode.closest('data-contentpath-disabled')) {
      return '';
    }
    let element = fieldNode.closest('[data-contentpath]');
    const contentpaths = [];
    while (element !== null) {
      contentpaths.push(element.dataset.contentpath);
      element = element.parentElement.closest('[data-contentpath]');
    }
    contentpaths.reverse();
    return contentpaths.join('.');
  }

  /**
   * Controls the positioning of a field level comment, and the display of the button
   * used to focus and pin the attached comment
   * `getAnchorNode` is called by the comments app to determine which node to
   * float the comment alongside
   */
  class BasicFieldLevelAnnotation {
    /**
    * Create a field-level annotation
    * @param {Element} fieldNode - an element to provide the comment position
    * @param {Element} node - the button to focus/pin the comment
    */
    constructor(fieldNode, node) {
      this.node = node;
      this.fieldNode = fieldNode;
      this.unsubscribe = null;
    }
    /**
    * Subscribes the annotation to update when the state of a particular comment changes,
    * and to focus that comment when clicked
    * @param {number} localId - the localId of the comment to subscribe to
    */
    subscribeToUpdates(localId) {
      const { selectFocused, selectEnabled } = commentApp.selectors;
      const selectComment = commentApp.utils.selectCommentFactory(localId);
      const store = commentApp.store;
      const initialState = store.getState();
      let focused = selectFocused(initialState) === localId;
      let shown = selectEnabled(initialState);
      if (focused) {
        this.onFocus();
      }
      if (shown) {
        this.show();
      }
      this.unsubscribe = store.subscribe(() => {
        const state = store.getState();
        const comment = selectComment(state);
        if (!comment) {
          this.onDelete();
        }
        const nowFocused = (selectFocused(state) === localId);
        if (nowFocused !== focused) {
          if (focused) {
            this.onUnfocus();
          } else {
            this.onFocus();
          }
          focused = nowFocused;
        }
        if (shown !== selectEnabled(state)) {
          if (shown) {
            this.hide();
          } else {
            this.show();
          }
          shown = selectEnabled(state);
        }
      }
      );
      this.setOnClickHandler(localId);
    }
    onDelete() {
      // IE11
      if (!this.node.remove) {
        this.node.parentNode.removeChild(this.node);
      } else {
        this.node.remove();
      }
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    }
    onFocus() {
      this.node.classList.remove('button-secondary');
      this.node.ariaLabel = STRINGS.UNFOCUS_COMMENT;
    }
    onUnfocus() {
      this.node.classList.add('button-secondary');
      this.node.ariaLabel = STRINGS.FOCUS_COMMENT;
      // TODO: ensure comment is focused accessibly when this is clicked,
      // and that screenreader users can return to the annotation point when desired
    }
    show() {
      this.node.classList.remove('u-hidden');
    }
    hide() {
      this.node.classList.add('u-hidden');
    }
    setOnClickHandler(localId) {
      this.node.addEventListener('click', () => {
        commentApp.store.dispatch(
          commentApp.actions.setFocusedComment(localId, { updatePinnedComment: true, forceFocus: true })
        );
      });
    }
    getTab() {
      return this.fieldNode.closest('section[data-tab]')?.getAttribute('data-tab');
    }
    getAnchorNode() {
      return this.fieldNode;
    }
  }

  class FieldLevelCommentWidget {
    constructor({
      fieldNode,
      commentAdditionNode,
      annotationTemplateNode,
    }) {
      this.fieldNode = fieldNode;
      this.contentpath = getContentPath(fieldNode);
      this.commentAdditionNode = commentAdditionNode;
      this.annotationTemplateNode = annotationTemplateNode;
      this.shown = false;
    }
    register() {
      const { selectEnabled } = commentApp.selectors;
      const initialState = commentApp.store.getState();
      let currentlyEnabled = selectEnabled(initialState);
      const selectCommentsForContentPath = commentApp.utils.selectCommentsForContentPathFactory(
        this.contentpath
      );
      let currentComments = selectCommentsForContentPath(initialState);
      this.updateVisibility(currentComments.length === 0 && currentlyEnabled);
      const unsubscribeWidget = commentApp.store.subscribe(() => {
        const state = commentApp.store.getState();
        const newComments = selectCommentsForContentPath(state);
        const newEnabled = selectEnabled(state);
        const commentsChanged = (currentComments !== newComments);
        const enabledChanged = (currentlyEnabled !== newEnabled);
        if (commentsChanged) {
          // Add annotations for any new comments
          currentComments = newComments;
          currentComments.filter((comment) => comment.annotation === null).forEach((comment) => {
            const annotation = this.getAnnotationForComment(comment);
            commentApp.updateAnnotation(
              annotation,
              comment.localId
            );
            annotation.subscribeToUpdates(comment.localId);
          });
        }
        if (enabledChanged || commentsChanged) {
          // If comments have been enabled or disabled, or the comments have changed
          // check whether to show the widget (if comments are enabled and there are no existing comments)
          currentlyEnabled = newEnabled;
          this.updateVisibility(currentComments.length === 0 && currentlyEnabled);
        }
      });
      initialState.comments.comments.forEach((comment) => {
        // Add annotations for any comments already in the store
        if (comment.contentpath === this.contentpath) {
          const annotation = this.getAnnotationForComment(comment);
          commentApp.updateAnnotation(annotation, comment.localId);
          annotation.subscribeToUpdates(comment.localId);
        }
      });
      const addCommentHandler = () => {
        const annotation = this.getAnnotationForComment();
        const localId = commentApp.makeComment(annotation, this.contentpath);
        annotation.subscribeToUpdates(localId);
      };
      this.commentAdditionNode.addEventListener('click', () => {
        // Make the widget button clickable to add a comment
        addCommentHandler();
      });
      this.fieldNode.addEventListener('keyup', (e) => {
        if (currentlyEnabled && isCommentShortcut(e)) {
          if (currentComments.length === 0) {
            addCommentHandler();
          } else {
            commentApp.store.dispatch(
              commentApp.actions.setFocusedComment(
                currentComments[0].localId,
                { updatePinnedComment: true, forceFocus: true }
              )
            );
          }
        }
      });
      return unsubscribeWidget; // TODO: listen for widget deletion and use this
    }
    updateVisibility(newShown) {
      if (newShown === this.shown) {
        return;
      }
      this.shown = newShown;

      if (!this.shown) {
        this.commentAdditionNode.classList.add('u-hidden');
      } else {
        this.commentAdditionNode.classList.remove('u-hidden');
      }
    }
    getAnnotationForComment() {
      const annotationNode = this.annotationTemplateNode.cloneNode(true);
      annotationNode.id = '';
      annotationNode.classList.remove('u-hidden');
      this.commentAdditionNode.insertAdjacentElement('afterend', annotationNode);
      return new BasicFieldLevelAnnotation(this.fieldNode, annotationNode, commentApp);
    }
  }

  function initAddCommentButton(buttonElement) {
    const widget = new FieldLevelCommentWidget({
      fieldNode: buttonElement.closest('[data-contentpath]'),
      commentAdditionNode: buttonElement,
      annotationTemplateNode: document.querySelector('#comment-icon'),
    });
    if (widget.contentpath) {
      widget.register();
    }
  }

  function initCommentsInterface(commentsElement, commentsOutputElement, commentData, componentStyle = null) {
    if (commentData && Object.keys(commentData).length > 0 && commentData.comments) {
      let shareUrl = commentData.shareUrl;
      if (!commentData.shareUrl) {
        shareUrl = window.location.href.replace(/(https?:\/\/.*)\/(d+)\//g, '$1\\${comment.share_id}\\');
      }
      commentApp.renderApp(
        commentsElement,
        commentsOutputElement,
        commentData.userId,
        commentData.userType,
        commentData.comments,
        new Map(Object.entries(commentData.authors)),
        defaultStrings,
        componentStyle,
        commentData.shareType,
        shareUrl,
      );
      commentApp.setVisible(true);
    }
  }

  async function readAllData(responseReader) {
    let commentData = '';
    while (true) {
      const { done, value } = await responseReader.read();
      commentData += new TextDecoder().decode(value);
      if (done) {
        break;
      }
    }
    return commentData;
  }

  function initCommentsInterfaceFromApi(commentsElement,
    commentsOutputElement,
    apiUrl,
    apiCommentsEntrypoint,
    apiKey,
    mode = 'cors',
    headerOptions = {},
    componentStyle = null) {
    const headers = new Headers(headerOptions);
    const guestDataSpan = document.getElementById('guest-data');
    let guestData = '{}';
    if (guestDataSpan) {
      guestData = guestDataSpan.innerHTML;
    }
    let authUserId = null;
    const authUser = document.getElementById('request-user');
    if (authUser) {
      authUserId = JSON.parse(authUser.innerHTML).id;
    }

    const requestOptions = {
      method: 'POST',
      headers,
      mode,
      body: guestData,
      referrerPolicy: 'origin',
    };
    const request = new Request(
      apiUrl + apiCommentsEntrypoint,
      requestOptions,
    );
    commentApp.setApiEnabled(true);
    commentApp.setApiUrl(apiUrl);
    commentApp.setApiKey(apiKey);
    commentApp.setAuthUserId(authUserId);

    fetch(request)
      .then(response => {
        const responseReader = response.body.getReader();
        readAllData(responseReader).then(commentData => {
          initCommentsInterface(commentsElement, commentsOutputElement, JSON.parse(commentData), componentStyle);
        });
      });
  }

  function addNewComment(contentText, contentPath, contentPosition) {
    const commentId = getNextCommentId();
    let author = {};
    const authUser = document.getElementById('request-user');
    if (authUser) {
      author = JSON.parse(authUser.innerHTML);
    }
    if (author.first_name) {
      author.firstname = author.first_name;
    }
    if (author.last_name) {
      author.lastname = author.last_name;
    }
    const addCommentOptions = {
      mode: 'creating',
      highlightedText: contentText,
    };
    commentApp.store.dispatch(
      addComment(
        newComment(contentPath, contentPosition, commentId, null, author, Date.now(), addCommentOptions)
      )
    );
  }

  return {
    commentApp,
    getContentPath,
    isCommentShortcut,
    initAddCommentButton,
    initCommentsInterface,
    initCommentsInterfaceFromApi,
    addNewComment,
  };
})();
