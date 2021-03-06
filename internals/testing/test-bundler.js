// needed for regenerator-runtime
// (ES7 generator support is required by redux-saga)
import 'babel-polyfill';

const ls = {};
global.window.localStorage = {
  setItem(k, v) { ls[k] = v; },
  getItem(k) { return ls[k]; },
};

/* setup.js */
/*
const { jsdom } = require('jsdom');

global.document = jsdom('');
global.window = document.defaultView;
global.navigator = {
  userAgent: 'node.js',
};

function copyProps(src, target) {
  const props = Object.getOwnPropertyNames(src)
    .filter(prop => typeof target[prop] === 'undefined')
    .reduce((result, prop) => ({
      ...result,
      [prop]: Object.getOwnPropertyDescriptor(src, prop),
    }), {});
  Object.defineProperties(target, props);
}
copyProps(document.defaultView, global);
*/
