
const KEY = 'spatial-code';
const SUB_KEY = 'values';

const CURRENT_VERSION = '0.0.0';

const getAllCode = () => {
  try {
    const codeStr = window.localStorage.getItem(KEY);
    const all = JSON.parse(codeStr) || {};
    if (all.version === CURRENT_VERSION) {
      return all[SUB_KEY] || [];
    }

    // TODO: migrate?
  } catch (err) {
    // TODO: handle?
  }
  return [];
};

const setAllCode = (allCode) => {
  try {
    const all = {
      version: CURRENT_VERSION,
      [SUB_KEY]: allCode,
    };
    window.localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch (err) {
    // TODO: handle this?
  }
  return false;
};

const getCodeForLevel = ({ world, level }) => {
  const allCode = getAllCode() || [];
  return (allCode[world] && allCode[world][level]) || '';
};

const saveCodeForLevel = ({ world, level, code }) => {
  const allCode = getAllCode();
  allCode[world] = allCode[world] || [];
  allCode[world][level] = code;
  return setAllCode(allCode);
};

export {
  saveCodeForLevel,
  getCodeForLevel,
};
