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
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';

import { BaseButton } from '../../components/Buttons';
import assets from '../../assets';

const rotate360 = keyframes`
  from {
    transform: rotate(360deg);
  }

  to {
    transform: rotate(0deg);
  }
`;

const SpinningImage = styled.img`
  -webkit-animation: ${rotate360} 2s infinite linear;
`;

const blink = keyframes`
  from,
  49.9% {
    opacity: 0;
  }
  50%,
  to {
    opacity: 1;
  }
`;
const BlinkingText = styled.span`
  animation: ${blink} steps(1) 500ms infinite alternate;
`;

class TitlePage extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function

  componentWillMount() {
    document.addEventListener('keydown', () => this.startGame());
  }

  startGame() {
    this.props.router.push('/challenges/0/0');
  }

  render() {
    return (
      <div>
        <div style={{ height: '100%', textAlign: 'center', fontSize: 72, paddingTop: 200 }}>
          SPATIAL [Σλ]
          <div style={{ paddingTop: 10 }}>
            <SpinningImage
              width={100}
              height={100}
              src={assets.diffDrive.src} alt="didi!"
            />
          </div>
        </div>
        <div style={{ marginLeft: -12, height: '100%', textAlign: 'center', paddingTop: 40 }}>
          <BlinkingText style={{ fontSize: 1 }}>▶︎</BlinkingText>
          <BaseButton onClick={() => this.startGame()}>START</BaseButton>
        </div>
      </div>
    );
  }
}

TitlePage.propTypes = {
  router: {
    push: PropTypes.func.isRequired,
  },
};
export default TitlePage;
export {
  TitlePage,
};
