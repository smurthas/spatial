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

import * as robot from '../myrobot';

import * as DriveToBox from '../../scenarios/DriveToBox';
import Slalom from '../../scenarios/Slalom';

import WorldView from '../../components/WorldView';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/javascript/javascript';

const defaultCode = `function doStep(sensors) {
  return {
    accel: 1,
    brake: 0,
    steer_angle: 0,
  };
}`;

const initialVehicle = () => {
  return {
    x: 50, y: 50,
    v: 0, yaw: Math.PI/2.0,
    L_f: 2.2, L_r: 2.2,
    width: 2.5,
  };
}

export default class HomePage extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  constructor() {
    super();
    const vehicle = initialVehicle();

    this.scenarioType = Slalom;
    // this.scenarioType = DriveToBox;
    const { name, description } = this.scenarioType.info();
    const code = window.localStorage.getItem(`${name}:code`) || defaultCode;

    this.scenario = new this.scenarioType();
    this.state = {
      code,
      vehicle,
    };
  }

  objectsFromVehicle(vehicle) {
    return [
      ...this.scenario.map.areas,
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
    //console.error('state', state);
    const {
      t_0, t_prev,
      vehicle,
    } = state;

    let {
      x, y, v, yaw,
      L_r, L_f, width,
    } = vehicle;

    const now = Date.now();
    const t = (now - t_0) / 1000.0;
    const dt = (now - t_prev) / 1000.0;

    if (t > (this.scenario.timeout || 60)) {
      // timeout
      alert('Times up!');
      this.stop();
      return;
    }

    if (this.scenario.checkGoal(state)) {
      // goal completed!
      alert(`Goal completed in ${Math.round(t*10)/10} seconds!`);
      this.stop();
      return;
    }

    const sensors = {
      vehicle,
      ...this.scenario.getSensors({
        vehicle: { v, x, y, yaw },
      }),
    };

    const controls = state.robot.doStep(sensors);

    const {
      steer_angle, accel, brake
    } = controls;

    const x_dot = v * Math.cos(yaw);
    const y_dot = v * Math.sin(yaw);
    const yaw_dot = v / L_r * steer_angle;
    const v_dot = (v < 0 ? 0 : (accel || 0) - (brake || 0)) * 5.0;

    // physics
    const x_next = x + x_dot * dt;
    const y_next = y + y_dot * dt;
    const yaw_next = (yaw + yaw_dot * dt) % (2.0*Math.PI);
    const dv = v_dot * dt;
    const v_next = Math.max(0, v + dv);

    setTimeout(() => {
      this.setState({
        t_prev: now,
        vehicle: {
          ...vehicle,
          x: x_next,
          y: y_next,
          yaw: yaw_next,
          v: v_next,
        },
      });
    }, 50);
  }

  stop() {
    this.setState({ running: false });
  }

  reset() {
    this.scenario.reset();
    this.setState({
      vehicle: initialVehicle(),
      running: false,
    });
  }

  regen() {
    this.scenario = new this.scenarioType();
    this.reset();
  }

  run() {
    const doStep = eval(this.state.code + '; doStep');
    const t_0 = Date.now();
    const { vehicle } = this.state;

    let t_prev = Date.now();

    this.setState({
      t_0,
      t_prev,
      running: true,
      robot: { doStep },
    });
  }

  componentWillUpdate(newProps, newState) {
    if (newState.running) {
      this.tick(newState);
    }
  }

  updateCode(code) {
    this.setState({ code });
    window.localStorage.setItem('code', code);
  }

  render() {
    const run = () => this.run();
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
