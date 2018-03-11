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
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import PropTypes from 'prop-types';
import SplitPane from 'react-split-pane';
import leftPad from 'left-pad';

// import EventEmitter from 'events';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faPlay from '@fortawesome/fontawesome-free-solid/faPlay';
import faPause from '@fortawesome/fontawesome-free-solid/faPause';
import faStepForward from '@fortawesome/fontawesome-free-solid/faStepForward';
import faUndo from '@fortawesome/fontawesome-free-solid/faUndo';
import faRandom from '@fortawesome/fontawesome-free-solid/faRandom';
import faStopWatch from '@fortawesome/fontawesome-free-solid/faStopwatch';
import faCompass from '@fortawesome/fontawesome-free-regular/faCompass';

import styled from 'styled-components';

import {
  reset,
  regen,
  setLevel,
  nextLevel,
  start,
  pause,
  step,
  setCode,
} from './actions';

import WorldView from '../../components/WorldView';
import LevelModal from '../../components/LevelModal';
import { BaseButton } from '../../components/Buttons';
import { PoseField } from '../../components/TextDisplay';
import CodeEditor from '../../components/CodeEditor';

import { computeOGridFromPoses } from '../../sim/utils';
// import createTransform from '../../sim/transform';
// import Pose from '../../sim/Pose';

// import assets from '../../assets';

const DEFAULT_SPLIT_WIDTH = 580;

const lpad = (n, w) => leftPad(n, w, '0');
const pprintTime = elapsed => {
  // TODO: remove the 0.01 if using time more precise than 100 ms
  // Without the 0.01, the msecs round call below often lands on, e.g.
  // 799 instead of 800, so this forces it up
  const et = (Math.round(elapsed * 1000) + 0.01) / 1000;
  const mins = Math.floor(et / 60);
  const secs = Math.floor(et - (mins * 60));
  const msecs = Math.round((et - secs - (mins * 60))*1000);
  return `${lpad(mins, 2)}:${lpad(secs, 2)}.${lpad(msecs, 3)}s`;
};

const PageHeader = styled.div`
  padding: 6px;
  margin: 2px;
  font-size: 16px;
  border-bottom: 1px solid #333;
  flex: 0 1 auto;
  height: 45px;
  overflow: hidden;
`;

const Logo = styled.div`
  display: inline-block;
  vertical-align: middle;
  padding-right: 40px;
  padding-left: 10px;
  font-size: 24px;
`;

const HeaderDivider = styled.span`
  padding-left: 10px;
  padding-right: 10px;
`;

const ControlButton = ({ disabled=false, onClick, icon, text }) => (
  <BaseButton
    style={{ margin: '0px 14px', textAlign: 'left' }}
    disabled={disabled}
    value={text}
    onClick={onClick}
  >
    <FontAwesomeIcon icon={icon} /> {text}
  </BaseButton>
);

ControlButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.object.isRequired,
  text: PropTypes.string.isRequired,
};


/*
const ogridRects = (ogrid, fillColor) => {
  const { width: cols, resolution, origin, data } = ogrid;
  const { x: originX, y: originY } = origin.position || origin;
  return data.map((v, idx) => {
    const c = idx % cols;
    const r = Math.floor(idx / cols);
    const x = originX + ((c + 0.5) * resolution);
    const y = originY + ((r + 0.5) * resolution);
    return {
      type: 'rect',
      fillColor: `rgba(${fillColor}, ${v / 255.0})`,
      x,
      y,
      width: resolution*0.95,
      length: resolution*0.95,
    };
  });
};
*/

class HomePage extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  constructor() {
    super();
    this.setSplitWidth = this.setSplitWidth.bind(this);
    this.showLevelInfo = this.showLevelInfo.bind(this);
    this.hideLevelInfo = this.hideLevelInfo.bind(this);
    this.hidePassFailModal = this.hidePassFailModal.bind(this);

    this.state = {
      splitWidth: DEFAULT_SPLIT_WIDTH,
      showLevelInfo: true,
      showPassFailModal: false,
    };
  }

  componentWillMount() {
    this.props.onSetLevel({ world: 0, level: 0 });
  }

  componentWillReceiveProps(nextProps) {
    const { passed, failed } = this.props.level;
    const alreadyPassedOrFailed = passed || failed;
    const nowPassedOrFailed = nextProps.level.passed || nextProps.level.failed;
    const justPassedOrFailed = !alreadyPassedOrFailed && nowPassedOrFailed;
    if (justPassedOrFailed) {
      this.setState({
        showPassFailModal: true,
      });
    }
  }

  componentDidUpdate() {
    if (this.props.level.running) {
      // TODO: no settimeout to make testing better?
      setTimeout(() => this.props.onStep(), 1);
    }
  }

  setSplitWidth(splitWidth) {
    this.setState({ splitWidth });
  }

  objectsFromVehicle() {
    const {
      map = {},
      poses = [],
      info = {},
      actorsStates = [],
      actors = [],
    } = this.props.level;

    const levelMarkers = (info.display || []).map(levelDisplay => {
      const { type } = levelDisplay;
      if (type === 'points') {
        // TODO: support `from` field
        const { fillColor = 'rgba(200, 50, 50)', radius = 0.35 } = levelDisplay;
        return poses.map(({ x, y }, i) => ({
          type: 'circle',
          name: `Pose Point ${i}`,
          fillColor,
          x,
          y,
          radius,
        }));
      } else if (type === 'accogrid') {
        // TODO: support `from` field
        const { grid, fillColor } = levelDisplay;
        const { cols, resolution, origin } = grid;
        const ogrid = computeOGridFromPoses({ poses, ...grid });
        return ogrid.map((v, idx) => {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          const x = origin.x + ((c + 0.5) * resolution);
          const y = origin.y + ((r + 0.5) * resolution);
          return {
            type: 'rect',
            fillColor: v ? fillColor : 'rgba(0,0,0,0)',
            x,
            y,
            width: resolution,
            length: resolution,
          };
        });
      }

      return [];
    });

    const drawnActors = actors.map((actor, i) => ({
      ...actor.draw,
      x: actorsStates[i].pose.position.x,
      y: actorsStates[i].pose.position.y,
      heading: actorsStates[i].pose.orientation && actorsStates[i].pose.orientation.yaw,
    }));

    /*
    const actorBBoxes = actors.map(({ draw, asset }, i) => ({
      x: actorsStates[i].pose.position.x,
      y: actorsStates[i].pose.position.y,
      heading: actorsStates[i].pose.orientation && actorsStates[i].pose.orientation.yaw || 0,
      collisionPolysM: asset.collisionPolysM,
      fillColor: 'rgba(192, 92, 92, 0.9)',
      type: 'poly',
    }));
    */
    const { obstacles = [] } = map;
    /*
     * const obsBBoxes = obstacles.map(obs => ({
      ...obs,
      fillColor: 'rgba(192, 92, 92, 0.9)',
      type: 'poly',
    }));
    */

    return [
      ...map.areas,
      ...(this.state.path || []).map(({ position }, i) => ({
        type: 'circle',
        name: `Path Point ${i}`,
        fillColor: '#2d2',
        x: position.x,
        y: position.y,
        radius: 0.5,
      })),
      ...([].concat(...levelMarkers)), // flatten since each is an array
      ...(obstacles || []),
      ...drawnActors,
      //...actorBBoxes,
      // ...(obsBBoxes || []),
      /*{
        type: 'img',
        name: 'Ego',
        asset,
        x: vehicle.x,
        y: vehicle.y,
        heading: vehicle.yaw,
      },
      {
        type: 'poly',
        name: 'ego-col',
        asset,
        fillColor: 'rgba(92, 92, 192, 0.9)',
        x: vehicle.x,
        y: vehicle.y,
        heading: vehicle.yaw,
      },*/
    ];
  }

  showLevelInfo() {
    this.setState({ showLevelInfo: true });
  }

  hideLevelInfo() {
    this.setState({ showLevelInfo: false });
  }

  hidePassFailModal() {
    this.setState({ showPassFailModal: false });
    if (this.props.level.passed) {
      this.props.onNextLevel();
    }
  }

  render() {
    const { running, pose, passed, failed, tPrev, code, syntaxError } = this.props.level;
    const { x, y, yaw } = pose;
    const done = !!(passed || failed);
    const playPauseIcon = running ? faPause : faPlay;
    const playPauseText = running ? 'Pause' : 'Start';

    const { name, description, defaultScale, center = { x, y } } = this.props.level.info;
    const time = pprintTime(tPrev);
    const startPause = () => running ? this.props.onPause() : this.props.onStart();

    const cantRun = !!(done || syntaxError);
    return (
      <div style={{ height: '100%' }}>
        <LevelModal
          show={this.state.showLevelInfo}
          name={name}
          description={description}
          onDone={this.hideLevelInfo}
        />
        <LevelModal
          show={this.state.showPassFailModal}
          name={passed? 'Level Completed!' : 'Failed, Try Again!'}
          description={passed || failed || ''}
          onDone={this.hidePassFailModal}
        />
        <PageHeader>
          <Logo>[∂λ]</Logo>
          {/* '∞Ω' */}
          <ControlButton
            disabled={cantRun}
            onClick={startPause}
            icon={playPauseIcon}
            text={playPauseText}
          />
          <ControlButton
            onClick={() => this.props.onStep()}
            disabled={cantRun}
            icon={faStepForward}
            text="Step"
          />
          <ControlButton onClick={() => this.props.onReset()} icon={faUndo} text="Reset" />
          <ControlButton onClick={() => this.props.onRegen()} icon={faRandom} text="Regenerate" />
          <HeaderDivider>|</HeaderDivider>
          <FontAwesomeIcon style={{ marginLeft: 4, marginRight: 10 }} icon={faStopWatch} />
          <span id="sim-time">{time}</span>
          <HeaderDivider>|</HeaderDivider>
          <FontAwesomeIcon style={{ marginLeft: 4, marginRight: 10 }} icon={faCompass} />
          <PoseField id="sim-pose" x={x} y={y} yaw={yaw} />
        </PageHeader>

        <SplitPane
          style={{ height: 'calc(100% - 60px)', overflowY: 'hidden' }}
          split="vertical"
          defaultSize={DEFAULT_SPLIT_WIDTH}
          onChange={this.setSplitWidth}
        >
          <WorldView
            objects={this.objectsFromVehicle(pose, this.props.level.actorsStates)}
            center={center}
            defaultScale={defaultScale}
            width={this.state.splitWidth}
            height={540}
          />
          <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
            <div style={{ flex: '0 1 auto', padding: 10 }}>
              <span style={{ fontWeight: 'bold' }}>{name}</span>
              <BaseButton onClick={this.showLevelInfo}> show info </BaseButton>
            </div>
            <div style={{ marginLeft: 5, flex: '1 1 auto', height: '100%', overflowY: 'scroll' }}>
              <CodeEditor
                code={code}
                onCodeChange={value => this.props.onSetCode(value)}
                syntaxError={this.props.level.syntaxError}
              />
            </div>
          </div>
        </SplitPane>
      </div>
    );
  }
}

HomePage.propTypes = {
  onReset: PropTypes.func.isRequired,
  onRegen: PropTypes.func.isRequired,
  onSetLevel: PropTypes.func.isRequired,
  onNextLevel: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onStep: PropTypes.func.isRequired,
  onSetCode: PropTypes.func.isRequired,
  level: PropTypes.object.isRequired,
};

const mapStateToProps = createSelector(
  (() => (state) => state.get('level').toJS())(),
  (level) => ({ level })
);

function mapDispatchToProps(dispatch) {
  return {
    onReset: () => dispatch(reset()),
    onRegen: () => dispatch(regen()),
    onSetLevel: ({ world, level }) => dispatch(setLevel({ world, level })),
    onNextLevel: () => dispatch(nextLevel()),
    onStart: () => dispatch(start()),
    onPause: () => dispatch(pause()),
    onStep: () => dispatch(step()),
    onSetCode: (code) => dispatch(setCode(code)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
export {
  HomePage,
};
