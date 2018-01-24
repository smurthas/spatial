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
import SplitPane from 'react-split-pane';
import leftPad from 'left-pad';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/javascript/javascript';

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

import Simulator from '../../sim/sim';
import BicyclePathFollower from '../../sim/controllers/bicycle';

import Scenarios from '../../scenarios';

import WorldView from '../../components/WorldView';
import LevelModal from '../../components/LevelModal';
import { BaseButton } from '../../components/Buttons';
import { Pose } from '../../components/TextDisplay';

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

const ControlButton = styled(BaseButton)`
  margin: 0px 14px;
`;


const modules = {
  'pid-path-follower': BicyclePathFollower,
};

function evalCode(code) {
  const evalThis = {
    require: (mod) => modules[mod],
  };
  function fn() {
    return eval(`console.log("this:", this); ${code}`); /* eslint no-eval: 0 */
  }
  return fn.call(evalThis);
}

const initialVehicle = () => ({
  x: 50,
  y: 50,
  v: 0,
  yaw: Math.PI/2.0,
  L_f: 2.2,
  L_r: 2.2,
  width: 2.3,
});

export default class HomePage extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  constructor() {
    super();
    this.dt = 0.1;
    this.ScenarioType = Scenarios.HelloTopics;
    const { defaultCode: code } = this.ScenarioType.info();

    this.scenario = new this.ScenarioType();
    this.state = {
      splitWidth: DEFAULT_SPLIT_WIDTH,
      code,
      showLevelInfo: false,
      ...this.getBaseState(code),
    };
    this.newSimulatorFromState();
  }

  componentWillUpdate(newProps, newState) {
    const dt = newState.tPrev - this.state.tPrev;
    if (dt > 0) {
      // this.prevUpdate = Date.now();
      // only tick when time steps
      this.tick(newState);
    }
  }

  componentDidUpdate(newProps, newState) {
    if (newState.code !== this.state.code) {
      this.reset();
    }
  }

  getNewRobot(code) {
    return evalCode(`${code}; (function() { return { onInit: onInit, onSensors: onSensors } })();`);
  }

  getBaseState(code) {
    const robot = this.getNewRobot(code);
    return {
      t_0: 0,
      tPrev: 0,
      robot,
      vehicle: initialVehicle(),
      running: false,
      poses: [],
      path: [],
      passed: false,
      failed: false,
    };
  }

  newSimulatorFromState() {
    const { vehicle } = this.state;

    // const topics = new EventEmitter();
    const listeners = {};
    const topics = {
      on: (topic, cb) => {
        listeners[topic] = listeners[topic] || [];
        listeners[topic].push(cb);
      },
      emit: (topic, evt) => {
        (listeners[topic] || []).forEach(cb => cb(evt));
      },
    };
    this.state.robot.onInit(topics);
    topics.on('/ego/path', path => {
      this.setState({ path });
    });

    this.simulator = new Simulator({
      actors: [
        {
          physics: {
            name: 'bicycle',
            lf: vehicle.L_f,
            lr: vehicle.L_r,
            pose: {
              position: { x: vehicle.x, y: vehicle.y },
              orientation: { yaw: vehicle.yaw },
            },
          },
          name: 'ego',
          listen: {
            '/ego/controls': { set: 'controls' },
          },
          controller: {
            // TODO control w code
            type: 'bicycle',
          },
        },
      ],
    }, topics);

    this.publish = (topic, evt) => topics.emit(topic, evt);
    this.subscribe = (topic, cb) => topics.on(topic, cb);
    this.subscribe('/ego/pose', ({ pose }) => {
      const { position, orientation } = pose;
      const prevPoses = this.state.poses;
      this.setState({
        poses: [...prevPoses, pose],
        vehicle: {
          ...this.state.vehicle,
          x: position.x,
          y: position.y,
          yaw: orientation.yaw,
          //v: v_next,
        },
      });
    });
  }

  objectsFromVehicle(vehicle) {
    const carColor = '200, 50, 50';
    const carAsset = 'car02';
    return [
      ...this.scenario.map.areas,
      ...(this.state.path || []).map(({ position }, i) => ({
        type: 'circle',
        name: `Path Point ${i}`,
        fillColor: '#2d2',
        x: position.x,
        y: position.y,
        radius: 0.5,
      })),
      ...(this.state.poses || []).map(({ position }, i) => ({
        type: 'circle',
        name: `Pose Point ${i}`,
        fillColor: `rgba(${carColor}, 0.8)`,
        x: position.x,
        y: position.y,
        radius: 0.35,
      })),
      {
        type: 'img',
        name: 'Ego',
        asset: carAsset,
        x: vehicle.x,
        y: vehicle.y,
        heading: vehicle.yaw,
      },
    ];
  }

  tick(state) {
    const { vehicle } = state;
    const { x, y, yaw } = vehicle;

    const { pass=false, fail=false } = this.scenario.checkGoal(state) || {};
    if (pass) {
      // goal completed!
      // alert(`Goal completed in ${Math.round(tPrev*10)/10} seconds!`); /* eslint no-alert: 0 */
      this.stop();
      this.setState({ passed: true, failed: false });
      return;
    } else if (fail) {
      // goal completed!
      // alert(`Failed to complete the goal: ${fail}`); /* eslint no-alert: 0 */
      this.stop();
      this.setState({ passed: false, failed: true });
      return;
    }

    const sensors = {
      vehicle,
      ...this.scenario.getSensors({
        vehicle: { x, y, yaw },
      }),
    };

    const publish = (topic, evt) => {
      this.publish(topic, evt);
    };
    state.robot.onSensors(publish, sensors);

    this.simulator.step(this.dt);

    setTimeout(() => {
      if (this.state.running) {
        this.step(true);
      }
    }, 10);
  }

  stop() {
    this.setState({ running: false });
  }

  reset() {
    this.scenario.reset();

    this.setState(this.getBaseState(this.state.code));
    setImmediate(() => {
      this.newSimulatorFromState();
    });
  }

  regen() {
    this.scenario = new this.ScenarioType();
    this.reset();
  }

  step(running) {
    this.setState({
      tPrev: this.state.tPrev + this.dt,
      running,
    });
  }

  run() {
    this.setState({
      running: true,
    });
    setTimeout(() => this.step(true), 1);
  }

  updateCode(code) {
    this.setState({ code });
    window.localStorage.setItem('code', code);
  }

  render() {
    const { running, vehicle, passed, failed } = this.state;
    const { x, y, yaw } = vehicle;
    const done = passed || failed;
    const playPause = () => running ? this.stop() : this.run();
    const playPauseIcon = running ? faPause : faPlay;
    const playPauseText = running ? 'Pause' : 'Start';
    const step = () => this.step();
    const reset = () => this.reset();
    const regen = () => this.regen();
    const options = {
      lineNumbers: true,
      mode: 'javascript',
      theme: 'base16-dark',
      viewportMargin: Infinity,
      lineWrapping: true,
    };

    const { name, description } = this.ScenarioType.info();
    const time = pprintTime(this.state.tPrev - this.state.t_0);
    return (
      <div style={{ height: '100%' }}>
        <LevelModal
          show={this.state.showLevelInfo}
          name={name}
          description={description}
          onDone={() => this.setState({ showLevelInfo: false })}
        />
        <PageHeader>
          <Logo>[∂λ]</Logo>
          {/* '∞Ω' */}
          <div style={{ display: 'inline-block', width: 100 }}>
            <ControlButton style={{ textAlign: 'left' }} disabled={done} onClick={playPause}>
              <FontAwesomeIcon icon={playPauseIcon} /> {playPauseText}
            </ControlButton>
          </div>
          <ControlButton onClick={step} value="Step" disabled={done}><FontAwesomeIcon icon={faStepForward} /> Step</ControlButton>
          <ControlButton onClick={reset} value="Reset"><FontAwesomeIcon icon={faUndo} /> Reset</ControlButton>
          <ControlButton onClick={regen}><FontAwesomeIcon icon={faRandom} /> Regenerate</ControlButton>
          <span style={{ paddingLeft: 10, paddingRight: 10 }}>|</span>
          <FontAwesomeIcon style={{ marginLeft: 4, marginRight: 10 }} icon={faStopWatch} />
          <span id="sim-time">{time}</span>
          <span style={{ paddingLeft: 10, paddingRight: 10 }}>|</span>
          <FontAwesomeIcon style={{ marginLeft: 4, marginRight: 10 }} icon={faCompass} />
          <Pose id="ego-pose" x={x} y={y} yaw={yaw} />
        </PageHeader>
        <SplitPane
          style={{ height: 'calc(100% - 60px)', overflowY: 'hidden' }}
          split="vertical"
          defaultSize={DEFAULT_SPLIT_WIDTH}
          onChange={(splitWidth) => this.setState({ splitWidth })}
        >
          <WorldView
            objects={this.objectsFromVehicle(this.state.vehicle)}
            center={{ x, y: y + 25 }}
            width={this.state.splitWidth}
            height={540}
          />
          <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
            <div style={{ flex: '0 1 auto', padding: 10 }}>
              <span style={{ fontWeight: 'bold' }}>{name}</span>
              <BaseButton onClick={() => this.setState({ showLevelInfo: true })}> show info </BaseButton>
            </div>
            <div style={{ marginLeft: 5, flex: '1 1 auto', height: '100%', overflowY: 'scroll' }}>
              <CodeMirror
                value={this.state.code}
                onChange={(code) => this.updateCode(code)}
                options={options}
              />
            </div>
          </div>
        </SplitPane>
      </div>
    );
  }
}
