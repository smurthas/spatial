const store = window.localStorage;

const KEY = 'SPATIAL-USER';
const DEFAULT_USER = '_';

const setUser = ({ user = DEFAULT_USER, token }) => {
  store.setItem(KEY, JSON.stringify({ user, token }));
};

const getUserAndToken = () => {
  try {
    return JSON.parse(store.getItem(KEY)) || { user: DEFAULT_USER };
  } catch (e) {
    return {};
  }
};

const getUser = () => getUserAndToken().user;

const getToken = () => getUserAndToken().token;

export {
  getUser,
  setUser,
  getToken,
  getUserAndToken,
};

