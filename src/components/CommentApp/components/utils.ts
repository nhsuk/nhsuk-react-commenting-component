
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
  const request = new Request(
    apiUrl + '/workflow-api/' + asset + '/' + remoteId + '/' + action + '/',
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

export function getGuestUserDetails() {
  const guestData = document.getElementById('guest-data');
  if (!guestData) {
    return '{}';
  }
  return guestData.innerHTML;
}

export function getRequestBody(newText: string) {
  const guestJson = JSON.parse(getGuestUserDetails());
  guestJson.newText = newText;
  return JSON.stringify(guestJson);
}

export function isAuthorTheCurrentUser(author: any, user: any) {
  if (!author) {
    return true;
  }
  if (!user) {
    return false;
  }
  if (user.type === 'external') {
    if (user.id === author.id) {
      return true;
    }
  }
  if (user.type === 'wagtail') {
    if (user.id === author.userId) {
      return true;
    }
  }
  return false;
}