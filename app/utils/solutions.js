import request from 'browser-request';
import sha from 'sha.js-browser';
import uuid from 'uuid';

const store = window.localStorage;

const KEY = 'spatial-uuid';

// value inserted at compile time
const API_URL = process.env.SOLUTION_URL;

let id = uuid();

try {
  const tmpId = store.getItem(KEY);
  if (tmpId && tmpId.length > 10) {
    id = tmpId;
  }
} catch (err) {
  // eslint-disable-line no-empty
}

try {
  store.setItem(KEY, id);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('error saving id to local storage:', err);
}

const postCodeForLevel = ({ prefix, state }) => {
  try {
    if (!API_URL) {
      return;
    }
    const world = state.get('world');
    const level = state.get('level');
    const code = state.get('code');
    const s = sha('sha256').update(code).digest('hex');
    const filename = `${id}/${prefix}/${world}/${level}/${s}.json`;
    request.post({
      url: API_URL,
      json: {
        filename,
        data: {
          uuid: id,
          code,
        },
      },
    }, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Error posting code:', err);
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('caught error posting code: ', err);
  }
};

const publishSolutionForLevel = ({ level, world, code, user = '_', token }, callback) => {
  request.post({
    url: `${API_URL}/${user}/solutions/${world}/${level}`,
    headers: {
      'x-spatial-token': token,
    },
    json: {
      code,
    },
  }, (err, resp, body) => callback(err, body));
};

const getSolutionForLevel = ({ world, level, sha: shaValue, user = '_' }, callback) => {
  request.get({
    url: `${API_URL}/${user}/solutions/${world}/${level}/${shaValue}`,
    json: true,
  }, (err, resp, json) => callback(err, json));
};

export {
  postCodeForLevel,
  getSolutionForLevel,
  publishSolutionForLevel,
};

