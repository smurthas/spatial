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
import Markdown from 'react-markdown';
import leftPad from 'left-pad';
import copy from 'clipboard-copy';
import debounce from 'lodash/debounce';

// import EventEmitter from 'events';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faPlay from '@fortawesome/fontawesome-free-solid/faPlay';
import faPause from '@fortawesome/fontawesome-free-solid/faPause';
import faStepForward from '@fortawesome/fontawesome-free-solid/faStepForward';
import faUndo from '@fortawesome/fontawesome-free-solid/faUndo';
import faRandom from '@fortawesome/fontawesome-free-solid/faRandom';
import faStopWatch from '@fortawesome/fontawesome-free-solid/faStopwatch';
import faCompass from '@fortawesome/fontawesome-free-regular/faCompass';
import faBan from '@fortawesome/fontawesome-free-solid/faBan';
import faLink from '@fortawesome/fontawesome-free-solid/faLink';
import faMinusSquare from '@fortawesome/fontawesome-free-regular/faMinusSquare';
import faPlusSquare from '@fortawesome/fontawesome-free-regular/faPlusSquare';
import faWindowClose from '@fortawesome/fontawesome-free-regular/faWindowClose';

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
  resetCodeToDefault,
} from './actions';

import WorldView from '../../components/WorldView';
import { BaseButton } from '../../components/Buttons';
import { FlashMessage } from '../../components/Flash';
import { PoseField } from '../../components/TextDisplay';
import CodeEditor from '../../components/CodeEditor';
import GithubCorner from '../../components/GithubCorner';

import { computeOGridFromPoses } from '../../sim/utils';

import { publishSolutionForLevel, getSolutionForLevel } from '../../utils/solutions';
import { getUserAndToken } from '../../utils/user';
import sha from '../../utils/sha';

const GAME_URL = process.env.SPATIAL_GAME_URL;

const DEFAULT_SPLIT_WIDTH = 545;

const lpad = (n, w) => leftPad(n, w, '0');
const pprintTime = elapsed => {
  // TODO: remove the 0.01 if using time more precise than 100 ms
  // Without the 0.01, the msecs round call below often lands on, e.g.
  // 799 instead of 800, so this forces it up
  const et = (Math.round(elapsed * 1000) + 0.01) / 1000;
  const mins = Math.floor(et / 60);
  const secs = Math.floor(et - (mins * 60));
  const msecs = Math.round((et - secs - (mins * 60))*100);
  return `${lpad(mins, 2)}:${lpad(secs, 2)}.${lpad(msecs, 2)}s`;
};

const PageHeader = styled.div`
  padding: 6px;
  padding-top: 4px;
  margin: 2px;
  font-size: 16px;
  border-bottom: 1px solid #333;
  flex: 0 1 auto;
  height: 45px;
  overflow: hidden;
  user-select: none;
`;

const Logo = styled.div`
  display: inline-block;
  vertical-align: -0.04em;
  padding-right: 20px;
  padding-left: 10px;
  font-size: 24px;
`;

const HeaderDivider = styled.span`
  padding-left: 10px;
  padding-right: 10px;
  vertical-align: 0.1em;
`;

const ControlButton = ({ disabled=false, onClick, icon, text, style = {} }) => (
  <BaseButton
    style={{ margin: '0px 14px', textAlign: 'left', ...style }}
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
  text: PropTypes.string,
  style: PropTypes.object,
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
    this.promptResetCode = this.promptResetCode.bind(this);
    this.shareSolution = this.shareSolution.bind(this);
    this.hideLevelInfo = this.hideLevelInfo.bind(this);
    this.showSyntaxError = debounce(() => {
      this.setState({
        showSyntaxError: true,
      });
    }, 500);

    this.state = {
      splitWidth: DEFAULT_SPLIT_WIDTH,
      showLevelInfo: true,
      showActorBoundingBoxes: false, // no UI to change right now, just for debug
      showSyntaxError: true,
    };
  }

  componentWillMount() {
    const { world, level, codeUUID, user } = this.props.params;
    if (codeUUID) {
      this.setState({ editorDisabled: true });
      getSolutionForLevel({ world, level, user, sha: codeUUID }, (err1, r) => {
        this.setState({ editorDisabled: false });
        if (err1 || !r.code) {
          // TODO: 404 or alert or just redirect to non-sha url?
          this.props.onSetLevel({ world, level, code: '// Error loading code...' });
        } else {
          this.props.onSetLevel({ world, level, code: r.code });
        }
      });
    } else {
      this.props.onSetLevel({ world, level });
    }
  }

  componentDidMount() {
    window.requestAnimationFrame(() => {
      this.stepIfRunning();
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.level.syntaxError) {
      this.showSyntaxError();
    } else {
      this.showSyntaxError.cancel();
      this.setState({
        showSyntaxError: false,
      });
    }
  }


  setCodeHeaderFlash({ message = null, level = null } = {}) {
    this.setState({
      codeFlashMessage: message,
      codeFlashLevel: level,
    });
  }

  setSplitWidth(splitWidth) {
    this.setState({ splitWidth });
  }

  getActorBoundingBoxPolys() {
    if (!this.state.showActorBoundingBoxes) {
      return [];
    }

    const { actorsStates = [], actors = [] } = this.props.level;
    return actors.map(({ draw, asset }, i) => ({
      x: actorsStates[i].pose.position.x,
      y: actorsStates[i].pose.position.y,
      heading: actorsStates[i].pose.orientation && actorsStates[i].pose.orientation.yaw || 0,
      collisionPolysM: asset.collisionPolysM,
      fillColor: 'rgba(62, 222, 62, 0.8)',
      type: 'poly',
    }));
  }

  stepIfRunning() {
    if (this.props.level.running) {
      this.props.onStep();
    }
    window.requestAnimationFrame(() => this.stepIfRunning());
  }


  objectsFromVehicle() {
    const {
      map = {},
      poses = [],
      info = {},
      actorsStates = [],
      actors = [],
      robotDisplay = [],
    } = this.props.level;

    const levelMarkers = [...robotDisplay, ...(info.display || [])].map(levelDisplay => {
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
      } else if (type === 'ogrid') {
        const items = [];
        const { grid, fillColor: constFillColor, fillColors } = levelDisplay;
        const { rows, cols, resolution, origin } = grid;
        for (let r = -(rows - 1)/2; r < (rows - 1)/2; r++) {
          for (let c = -(cols - 1)/2; c < (cols - 1)/2; c++) {
            const x = origin.x + (c * resolution);
            const y = origin.y + (r * resolution);
            const v = grid.getCell(r, c);
            const fillColor = (constFillColor ? (v && constFillColor || null) : fillColors(v)) || 'rgba(0,0,0,0)';
            items.push({
              type: 'rect',
              fillColor,
              x,
              y,
              width: resolution,
              length: resolution,
            });
          }
        }

        return items;
      }

      return [];
    });

    const drawnActors = actors.map((actor, i) => ({
      ...actor.draw,
      x: actorsStates[i].pose.position.x,
      y: actorsStates[i].pose.position.y,
      heading: actorsStates[i].pose.orientation && actorsStates[i].pose.orientation.yaw,
    }));

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
      ...drawnActors,
      ...this.getActorBoundingBoxPolys(),
    ];
  }

  promptResetCode() {
    // eslint-disable-next-line no-alert
    const confirmed = confirm('Reset code to level default?');
    if (confirmed) {
      const { level, world } = this.props.level;
      this.props.router.push(`/_/${world}/${level}`);
      this.props.onResetCodeToDefault();
    }
  }

  shareSolution() {
    const { level, world, code } = this.props.level;
    // TODO:
    const { user, token } = getUserAndToken();
    const sliceTo = user === '_' ? 12 : 6;
    const shaValue = sha(code).slice(0, sliceTo);
    const path = `/${user}/${world}/${level}/${shaValue}`;
    const url = `${GAME_URL}${path}`;
    copy(url);
    publishSolutionForLevel({ world, level, code, user, token }, (err, { sha: shaFromServer } = {}) => {
      if (err) {
        // TODO: show error?
        this.setCodeHeaderFlash({ message: 'Failed to publish solution :(', level: 'error' });
      } else if (shaFromServer !== shaValue) {
        // TODO: hmm, waaat??
        this.setCodeHeaderFlash({ message: 'Failed to publish solution :(', level: 'error' });
      } else {
        this.props.router.push(path);
        this.setCodeHeaderFlash({ message: `Copied ${url} to clipboard`, level: 'ok' });
      }
      setTimeout(() => this.setCodeHeaderFlash(), 10000);
    });
  }

  showLevelInfo() {
    this.setState({ showLevelInfo: true });
  }

  hideLevelInfo() {
    this.setState({ showLevelInfo: false });
  }

  render() {
    const { running, pose, passed, failed, tPrev, code, syntaxError } = this.props.level;
    const { x, y, yaw } = pose;
    const done = !!(passed || failed);
    const playPauseIcon = running ? faPause : faPlay;
    const playPauseText = running ? 'Pause' : 'Start';

    const {
      name, defaultScale, center = {}, dynamic, timeout, defaultCode, description,
    } = this.props.level.info;

    const isDefaultCode = code.trim() === defaultCode.trim();

    const centerConst = !isNaN(center.x);
    const centerXY = (centerConst && center) || ({ x, y });

    const time = pprintTime(tPrev);
    const startPause = () => running ? this.props.onPause() : this.props.onStart();

    const cantRun = !!(done || syntaxError);

    const worldFlashLevel = (failed && 'error') || (passed && 'ok') || '';
    const timedout = failed && (tPrev >= timeout);

    const codeEditorFlashLevel = this.state.showSyntaxError && syntaxError && 'error';
    const codeEditorFlashMessage = this.state.showSyntaxError && syntaxError && syntaxError.description;

    return (
      <div style={{ height: '100%' }}>
        <GithubCorner href="https://github.com/smurthas/spatial" />

        <PageHeader>
          <Logo>[Σλ]</Logo>
          {/* ' ∂ ∞Ω' */}
          <FontAwesomeIcon
            style={{ marginLeft: 4, marginRight: 10, color: timedout ? '#C71F24' : '' }}
            icon={faStopWatch}
          />
          <span style={{ color: timedout ? '#C71F24' : '' }} id="sim-time" >{time}</span>
          <HeaderDivider>|</HeaderDivider>
          <FontAwesomeIcon style={{ marginLeft: 4, marginRight: 10 }} icon={faCompass} />
          <PoseField id="sim-pose" x={x} y={y} yaw={yaw} />
          <HeaderDivider>|</HeaderDivider>
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
          <ControlButton
            onClick={() => this.props.onReset()}
            disabled={tPrev === 0}
            icon={faUndo}
            text="Reset"
          />
          <ControlButton
            onClick={() => this.props.onRegen()}
            disabled={!dynamic}
            icon={faRandom}
            text="Regenerate"
          />
        </PageHeader>

        <SplitPane
          style={{ height: 'calc(100% - 60px)', overflowY: 'hidden' }}
          split="vertical"
          defaultSize={DEFAULT_SPLIT_WIDTH}
          onChange={this.setSplitWidth}
        >
          <WorldView
            objects={this.objectsFromVehicle(pose, this.props.level.actorsStates)}
            center={centerXY}
            defaultScale={defaultScale}
            width={this.state.splitWidth}
            height={540}
            flashLevel={worldFlashLevel}
            flashMessage={passed || failed || ''}
            flashButtonMessage={passed ? 'next level' : null}
            onFlashButton={() => this.props.onNextLevel()}
          />

          <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
            <div style={{ flex: '0 1 auto', padding: 10, userSelect: 'none', fontSize: 14 }}>
              <ControlButton
                style={{ float: 'right' }}
                onClick={this.shareSolution}
                text="Publish"
                icon={faLink}
              />
              <ControlButton
                style={{ float: 'right' }}
                onClick={this.promptResetCode}
                icon={faBan}
                text="Reset Code"
                disabled={isDefaultCode}
              />
              <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{name}</span>
              <ControlButton
                style={{ display: this.state.showLevelInfo ? 'none' : 'inline-block' }}
                onClick={this.showLevelInfo}
                icon={faPlusSquare}
                text="show level info"
              />

              <FlashMessage
                style={{ paddingRight: 15, textAlign: 'right' }}
                level={this.state.codeFlashMessage && this.state.codeFlashLevel || ''}
              >
                {this.state.codeFlashMessage}
                <ControlButton
                  onClick={() => this.setCodeHeaderFlash()}
                  icon={faWindowClose}
                />
              </FlashMessage>
            </div>
            <div style={{ paddingLeft: 10, paddingRight: 10, display: this.state.showLevelInfo ? 'block' : 'none' }}>
              <Markdown className="modalMarkdown" source={description} />
              <ControlButton
                style={{ float: 'right' }}
                onClick={this.hideLevelInfo}
                icon={faMinusSquare}
                text="hide level info"
              />
            </div>

            <div style={{ marginLeft: 5, flex: '1 1 auto', height: '100%', overflowY: 'scroll' }}>
              <CodeEditor
                code={code}
                disabled={this.state.editorDisabled}
                onCodeChange={value => {
                  if (this.props.params.codeUUID) {
                    const { level, world } = this.props.level;
                    this.props.router.push(`/_/${world}/${level}`);
                  }
                  this.props.onSetCode(value);
                }}
                syntaxError={this.props.level.syntaxError}
              />
            </div>

            <FlashMessage
              level={codeEditorFlashMessage && codeEditorFlashLevel || ''}
            >
              {codeEditorFlashMessage}
            </FlashMessage>
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
  onResetCodeToDefault: PropTypes.func.isRequired,
  level: PropTypes.object.isRequired,
  params: PropTypes.shape({
    world: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    codeUUID: PropTypes.string,
    user: PropTypes.string,
  }),
  router: PropTypes.object.isRequired,
};

const mapStateToProps = createSelector(
  (() => (state) => state.get('level').toJS())(),
  (level) => ({ level })
);

function mapDispatchToProps(dispatch) {
  return {
    onReset: () => dispatch(reset()),
    onRegen: () => dispatch(regen()),
    onSetLevel: (a) => dispatch(setLevel(a)),
    onNextLevel: () => dispatch(nextLevel()),
    onStart: () => dispatch(start()),
    onPause: () => dispatch(pause()),
    onStep: () => dispatch(step()),
    onSetCode: (code) => dispatch(setCode(code)),
    onResetCodeToDefault: () => dispatch(resetCodeToDefault()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
export {
  HomePage,
};
