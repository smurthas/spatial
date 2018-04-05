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

const FlickeringSpan = styled.span`
  animation: ${props => props.flicker} steps(1) ${props => props.duration}s infinite;
`;

const FlickeringText = ({ children, frames }) => {
  const totalDuration = frames.slice(0, -1).reduce((acc, f) => acc + f.duration, 0);
  let prevPct = 0;
  const fs = frames.map(({ opacity, duration }) => {
    const r = `${prevPct}% { opacity: ${opacity}; }`;
    prevPct += duration / totalDuration * 100;
    return r;
  });
  const timesteps = fs.join('\n');
  const flicker = keyframes`${timesteps}`;
  return (
    <FlickeringSpan flicker={flicker} duration={totalDuration} >{children}</FlickeringSpan>
  );
};

FlickeringText.propTypes = {
  children: PropTypes.string.isRequired,
  frames: PropTypes.array.isRequired,
};

class TitlePage extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function

  componentWillMount() {
    // start game on Enter/Return key
    document.addEventListener('keydown', e => e.keyCode === 13 && this.startGame());
  }

  startGame() {
    this.props.router.push('/_/0/0');
  }

  render() {
    return (
      <div>
        <div style={{ height: '100%', textAlign: 'center', fontSize: 72, paddingTop: 200 }}>
          <FlickeringText
            frames={[
              { opacity: 1, duration: 4 },
              { opacity: 0.2, duration: 2 },
              { opacity: 1, duration: 1.9 },
              { opacity: 0, duration: 0.07 },
              { opacity: 1, duration: 0.2 },
              { opacity: 0, duration: 0.05 },
              { opacity: 1, duration: 1.5 },
              { opacity: 0.7, duration: 0.15 },
              { opacity: 0.3, duration: 0.05 },
              { opacity: 1, duration: 3 },
              { opacity: 1, duration: 0 },
            ]}
          >S</FlickeringText>
          PATIA
          <FlickeringText
            frames={[
              { opacity: 1, duration: 1 },
              { opacity: 0.2, duration: 0.5 },
              { opacity: 1, duration: 2.9 },
              { opacity: 0, duration: 0.11 },
              { opacity: 1, duration: 0.2 },
              { opacity: 0, duration: 0.07 },
              { opacity: 1, duration: 1.5 },
              { opacity: 0.7, duration: 0.15 },
              { opacity: 0.3, duration: 0.05 },
              { opacity: 1, duration: 5 },
              { opacity: 1, duration: 0 },
            ]}
          >L</FlickeringText>
            [Σλ]
          <div style={{ paddingTop: 10 }}>
            <SpinningImage
              width={100}
              height={100}
              src={assets.diffDrive.src} alt="didi!"
            />
          </div>
        </div>
        <div style={{ marginLeft: -12, height: '100%', textAlign: 'center', paddingTop: 40, fontSize: 24 }}>
          <BlinkingText style={{ fontSize: 16 }}>▶︎</BlinkingText>
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
