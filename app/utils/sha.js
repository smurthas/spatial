import shajs from 'sha.js-browser';

const sha = (s) => shajs('sha256').update(s).digest('base64').replace('/', '_');

export default sha;

