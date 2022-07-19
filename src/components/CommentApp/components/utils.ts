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
    'Subscription-Key': apiKey,
    'Content-Type': 'text/html; charset=UTF-8',
    'Workflow-Cookie': document.cookie,
  };
  const headers = new Headers(headerOptions);
  return {
    method: verb,
    headers,
    mode: 'cors' as RequestMode,
    body: body,
    referrerPolicy: 'origin' as ReferrerPolicy,
  };
}

export async function makeRequest(remoteId: number,
  asset: string,
  verb: string,
  action: string,
  apiUrl: string,
  apiKey: string,
  body?: string) {
  let request = new Request(
    apiUrl + '/workflow-api/' + asset + '/' + remoteId + '/' + action + '/',
    getRequestOptions(verb, apiKey, body),
  );
  if (remoteId === -1) {
    request = new Request(
      apiUrl + '/workflow-api/' + asset + '/' + action + '/',
      getRequestOptions(verb, apiKey, body),
    );
  }
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

export function getUserDetails(authUserId: number | null) {
  if (authUserId) {
    return `{"wagtail_user_id": ${authUserId}}`;
  }
  const guestData = document.getElementById('guest-data');
  if (!guestData) {
    return '{}';
  }
  return guestData.innerHTML;
}

export function getRequestBody(newText: string,
  authUserId: number | null,
  shareId?: string,
  contentPath?: string,
  position?: string,
  highlightedText?: string) {
  const guestJson = JSON.parse(getUserDetails(authUserId));
  guestJson.newText = newText;
  if (shareId) {
    guestJson.shareId = shareId;
  }
  if (contentPath) {
    guestJson.contentPath = contentPath;
  }
  if (position) {
    guestJson.position = position;
  }
  if (highlightedText) {
    guestJson.highlightedText = highlightedText;
  }
  return JSON.stringify(guestJson);
}

export function isAuthorTheExternalUser(author: any, user: any) {
  if (!author) {
    return true;
  }
  if (!user) {
    return false;
  }
  if (user.type !== 'external') {
    return false;
  }
  if (author.id === user.id) {
    return true;
  }
  return false;
}

export function isAuthorTheCurrentUser(author: any, userId: any, user?: any) {
  if (!author) {
    return true;
  }
  if (!userId && !user) {
    return false;
  }
  if (!userId && user && user.userId) {
    if (user.userId === author.userId) {
      return true;
    }
  }
  if (userId === author.userId) {
    return true;
  }
  // If this is a new comment then author.userId will be 0 - but the author must be the current user.
  if (author.userId === 0) {
    return true;
  }
  if (!author.hasOwnProperty('userId')) {
    if (author.id === userId) {
      return true;
    }
  }
  return false;
}

export function isAuthorTheCurrentGuestUser(author: any) {
  if (!author) {
    return true;
  }
  const authUser = document.getElementById('request-user');
  if (authUser) {
    const authUserDetails = JSON.parse(authUser.innerHTML);
    if (authUserDetails.is_authenticated !== 'False') {
      return false;
    }
  }
  const guestUser = document.getElementById('guest-data');
  if (guestUser) {
    const guestUserDetails = JSON.parse(guestUser.innerHTML);
    if (author.firstname === guestUserDetails.first_name &&
      author.lastname === guestUserDetails.last_name) {
      return true;
    }
  }
  return false;
}

export function checkSuccessFalse(response: any) {
  const responseJson = JSON.parse(String(response));
  /* eslint-disable-next-line dot-notation */
  if (responseJson['success'] === 'False') {
    /* eslint-disable-next-line no-console, dot-notation */
    console.error(responseJson['error']);
    return true;
  }
  return false;
}

export function getStatus() {
  let status;
  if (document.querySelectorAll('strong.status')[0]) {
    status = document.querySelectorAll('strong.status')[0].textContent;
  } else {
    status = 'Pending';
  }
  return status;
}

export function getAuthorDetails(elementId) {
  let author = {};
  const userDetails = document.getElementById(elementId);
  if (userDetails) {
    author = JSON.parse(userDetails.innerHTML);
    /* eslint-disable dot-notation */
    if (author['is_authenticated'] === 'False') {
      return { details_found: 'False' };
    }
    if (author['first_name']) {
      author['firstname'] = author['first_name'];
    }
    if (author['last_name']) {
      author['lastname'] = author['last_name'];
    }
    /* eslint-enable dot-notation */
  }
  return { details_found: 'True', author: JSON.stringify(author) };
}

function overlapExists(element1: Element, element2: Element) {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();
  const overlap = !(rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom);
  return overlap;
}

function moveItemDown(element1: HTMLElement, element2: HTMLElement) {
  const element1Top = element1.style.top;
  const element1TopInt = parseInt(element1Top.substring(0, element1Top.length - 2), 10);
  const element1BottomInt = element1TopInt + element1.clientHeight + 10;
  /* eslint-disable-next-line no-param-reassign*/
  element2.style.top = element1BottomInt + 'px';
}

export function arrangeComments() {
  const commentListElems = document.querySelectorAll('ol.comments-list li.comment');
  for (let element1 = 0; element1 < commentListElems.length; element1++) {
    for (let element2 = element1 + 1; element2 < commentListElems.length; element2++) {
      if (overlapExists(commentListElems[element1], commentListElems[element2])) {
        moveItemDown((commentListElems[element1] as HTMLElement), commentListElems[element2] as HTMLElement);
      }
    }
  }
}
