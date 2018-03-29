import request from 'browser-request';
import sha from 'sha.js-browser';
import uuid from 'uuid';

const store = window.localStorage;

const KEY = 'spatial-uuid';

// value inserted at compile time
const url = process.env.SOLUTION_URL;

let id = uuid();

try {
  const tmpId = store.getItem(KEY);
  if (tmpId && tmpId.length > 10) {
    id = tmpId;
  }
} catch (err) {
  /* eslint no-empty: 0 */
}

try {
  store.setItem(KEY, id);
} catch (err) {
  console.error('error saving id to local storage:', err); /* eslint no-console: 0 */
}

const postCodeForLevel = ({ prefix, state }) => {
  try {
    if (!url) {
      return;
    }
    const world = state.get('world');
    const level = state.get('level');
    const code = state.get('code');
    const s = sha('sha256').update(code).digest('hex');
    const filename = `${id}/${prefix}/${world}/${level}/${s}.json`;
    request.post({
      url,
      json: {
        filename,
        data: {
          uuid: id,
          code,
        },
      },
    }, (err) => {
      if (err) {
        console.error('Error posting code:', err); /* eslint no-console: 0 */
      }
    });
  } catch (err) {
    console.error('caught error posting code: ', err); /* eslint no-console: 0 */
  }
};

export {
  postCodeForLevel,
};
