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
import { FormattedMessage } from 'react-intl';
import messages from './messages';

import Simulator from '../../sim/sim';
import BicyclePathFollower from '../../sim/controllers/bicycle';
import EventEmitter from 'events';

import * as robot from '../myrobot';

import * as DriveToBox from '../../scenarios/DriveToBox';
import Slalom from '../../scenarios/Slalom';

import WorldView from '../../components/WorldView';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/javascript/javascript';


const modules = {
  'pid-path-follower': BicyclePathFollower
};

function evalCode(code) {
  const evalThis = {
    require: (mod) => {
      return modules[mod];
    },
  };
  const fn = function() {
    return eval('console.log("this:", this); ' + code);
  }
  return fn.call(evalThis);
}

const defaultCode = `
const PIDPathFollower = this.require('pid-path-follower');

function onInit(topics) {
  const pathFollower = new PIDPathFollower({
    publishControlsTopic: '/ego/controls',
  }, topics);

  topics.on('/ego/pose', pose => pathFollower.on('pose', pose));
  topics.on('/ego/path', path => pathFollower.on('path', path));
}

function onSensors(publish, { vehicle, cones, color }) {
  // if over the stop box, well, stop
  if (color === 'black') {
    publish('/ego/path', []);
    publish('/ego/controls', { theta: 0, b: 5 });
    return;
  }

  const path = cones.map(({ x, y, passOn }) => {
    return {
      position: { x: x + (passOn === 'left' ? -5 : 5), y, z: 0 },
      orientation: { roll: 0, pitch: 0, yaw: 1.57 },
    };
  });
  publish('/ego/path', path);
}`;

const initialVehicle = () => {
  return {
    x: 50, y: 50,
    v: 0, yaw: Math.PI/2.0,
    L_f: 2.2, L_r: 2.2,
    width: 2.5,
  };
}

let local = 0;

export default class HomePage extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  constructor() {
    super();
    this.dt = 0.1;
    this.scenarioType = Slalom;
    // this.scenarioType = DriveToBox;
    const { name, description } = this.scenarioType.info();
    const code = window.localStorage.getItem(`${name}:code`) || defaultCode;

    this.scenario = new this.scenarioType();
    this.state = {
      code,
      vehicle: initialVehicle(),
      poses: [],
    };
    setImmediate(() => this.reset());
  }

  newSimulatorFromState() {
    const { vehicle } = this.state;

    //const topics = new EventEmitter();
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
          }
        },
      ]
    }, topics);

    this.publish = (topic, evt) => topics.emit(topic, evt);
    this.subscribe = (topic, cb) => topics.on(topic, cb);
    this.subscribe('/ego/pose', ({ timestamp, pose }) => {
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
    return [
      ...this.scenario.map.areas,
      ...(this.state.path || []).map(({ position }, i) => ({
        type: 'circle',
        name: `Path Point ${i}`,
        fillColor: '#2d2',
        x: position.x, y: position.y,
        radius: 0.5,
      })),
      ...(this.state.poses || []).map(({ position }, i) => ({
        type: 'circle',
        name: `Pose Point ${i}`,
        fillColor: 'rgba(192, 96, 96, 0.6)',
        x: position.x, y: position.y,
        radius: 0.5,
      })),
      {
        type: 'rect',
        fillColor: '#bb6666',
        x: vehicle.x, y: vehicle.y,
        length: vehicle.L_f + vehicle.L_r,
        width: vehicle.width,
        heading: vehicle.yaw,
      },
    ];
  }

  tick(state) {
    console.error('tick', state);
    const {
      t_0, t_prev,
      vehicle,
    } = state;

    let {
      x, y, yaw,
      L_r, L_f, width,
    } = vehicle;

    if (this.scenario.checkGoal(state)) {
      // goal completed!
      alert(`Goal completed in ${Math.round(t_prev*10)/10} seconds!`);
      this.stop();
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
    const start = Date.now();
    state.robot.onSensors(publish, sensors);
    const etRobo = Date.now() - start;

    this.simulator.step(this.dt);
    const etSim = Date.now() - start - etRobo;

    if (this.state.running) {
      setTimeout(() => {
        this.step();
      }, 10);
    }
  }

  stop() {
    this.setState({ running: false });
  }

  getNewRobot() {
    return evalCode(this.state.code + '; (function() { return { onInit: onInit, onSensors: onSensors } })();');
  }

  reset() {
    this.scenario.reset();
    const robot = this.getNewRobot();
    const { vehicle } = this.state;

    this.setState({
      t_0: 0,
      t_prev: 0,
      robot,
      vehicle: initialVehicle(),
      running: false,
      poses: [],
      path: [],
    });
    setImmediate(() => {
      this.newSimulatorFromState();
    });
  }

  regen() {
    this.scenario = new this.scenarioType();
    this.reset();
  }

  step() {
    this.setState({
      t_prev: this.state.t_prev + this.dt,
    });
  }

  run() {
    this.setState({
      running: true,
    });
    setTimeout(() => this.step(), 1);
  }

  componentWillUpdate(newProps, newState) {
    const dt = newState.t_prev - this.state.t_prev;
    if (dt > 0) {
      //this.prevUpdate = Date.now();
      // only tick when time steps
      setTimeout(() => {
        this.tick(newState);
      }, 10);
    }
  }

  updateCode(code) {
    this.setState({ code });
    window.localStorage.setItem('code', code);
  }

  render() {
    const run = () => this.run();
    const step = () => this.step();
    const options = {
      lineNumbers: true,
      mode: 'javascript',
    };

    const { name, description } = this.scenarioType.info();

    return (
      <div>
        <div>{name}</div>
        <div style={{display: 'flex'}}>
          <div style={{width: 640, flex: '1 0 1'}}>{description}</div>
          <div style={{flex: '1 0 1'}}>
            <button style={{border: '1px solid black', borderRadius: 3}}
                    onClick={run} value="Run!">Run!</button>
            <button style={{border: '1px solid black', borderRadius: 3}}
                    onClick={() => this.stop()} value="Stop!">Stop!</button>
            <button style={{border: '1px solid black', borderRadius: 3}}
                    onClick={step} value="Step">Step</button>
            <button style={{border: '1px solid black', borderRadius: 3}}
                    onClick={() => this.reset()} >Reset</button>
            <button style={{border: '1px solid black', borderRadius: 3}}
                    onClick={() => this.regen()} >Regen</button>
          </div>
        </div>
        <div style={{display: 'flex'}}>
          <WorldView
            objects={this.objectsFromVehicle(this.state.vehicle)}
            center={this.state.vehicle}
            width={640}
            height={580}
            />
          <div style={{flex: '1 1 auto'}}>
            <CodeMirror
              style={{height:580}}
              value={this.state.code}
              onChange={(code) => this.updateCode(code)}
              options={options} />
          </div>
        </div>
      </div>
    );
  }
}
