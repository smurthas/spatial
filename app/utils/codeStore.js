
const store = window.localStorage;

const getAllCode = () => {
  try {
    const codeStr = store.getItem('code');
    return JSON.parse(codeStr) || [];
  } catch (err) {
    return [];
  }
};

const getCodeForLevel = ({ world, level }) => {
  const allCode = getAllCode() || [];
  return (allCode[world] && allCode[world][level]) || '';
};

const saveCodeForLevel = ({ world, level, code }) => {
  const allCode = getAllCode();
  allCode[world] = allCode[world] || [];
  allCode[world][level] = code;
  try {
    store.setItem('code', JSON.stringify(allCode));
  } catch (err) {
    // TODO: handle this?
  }
};

export {
  saveCodeForLevel,
  getCodeForLevel,
};
