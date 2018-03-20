/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 *
 * NOTE: while this component should technically be a stateless functional
 * component (SFC), hot reloading does not currently support SFCs. If hot
 * reloading is not a necessity for you then you can refactor it and remove
 * the linting exception.
 */

import React from 'react';

class CompletedPage extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div style={{ height: '100%', textAlign: 'center', fontSize: 24, paddingTop: 200 }}>
        You completed all the challenges, nice!
      </div>
    );
  }
}

export default CompletedPage;
export {
  CompletedPage,
};
