import { fromJS } from 'immutable';

import Simulator from '../../sim/sim';
import BicyclePathFollower from '../../sim/controllers/bicycle';
import Worlds from '../../levels';

class SynchronousEmitter {
  constructor() {
    this.listeners = {};
  }

  on(topic, cb) {
    this.listeners[topic] = this.listeners[topic] || [];
    this.listeners[topic].push(cb);
  }

  emit(topic, evt) {
    (this.listeners[topic] || []).forEach(cb => cb(evt));
  }
}

// TODO: make these not hardcoded
const VEHICLE = {
  x: 50,
  y: 50,
  v: 0,
  yaw: Math.PI/2.0,
  L_f: 2.2,
  L_r: 2.2,
  width: 2.3,
};


let robot = {};
let simulator;
let topics;
let levelObject;

const BASE_STATE = fromJS({
  tPrev: 0,
  stepCount: 0,
  running: false,
  passed: false,
  failed: false,
  dt: 0.05,
  pose: { x: VEHICLE.x, y: VEHICLE.y, yaw: VEHICLE.yaw },
  poses: [],
});


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

const evalRobotCode = (code) =>
  evalCode(`${code}; (function() { return { onInit: onInit, onSensors: onSensors } })();`);


const newSimulatorFromState = ({ vehicle }) => {
  topics = new SynchronousEmitter();
  robot.onInit(topics);
  /*
  topics.on('/ego/path', path => {
    this.setState({ path });
  });
  */

  simulator = new Simulator({
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
};


const reset = (state) => {
  // TODO:
  //   reset level (maybe remove?)
  //   new robot from code (e.g. clear any state from eval'd js
  const newState = state.merge(BASE_STATE);
  newSimulatorFromState({ vehicle: VEHICLE });
  return newState;
};

// just set to existing level to generate a new level
const regen = (state) => setLevel(state, state.toJS());

const setLevel = (state, { world, level }) => {
  const Level = Worlds[world].levels[level];
  const { defaultCode } = Level.info();
  levelObject = new Level();
  const map = fromJS(levelObject.map);
  const info = Level.info();
  const withNextLevel = state.set('level', level).set('world', world).set('map', map).set('info', info);
  return setCode(withNextLevel, { code: defaultCode });
};

const nextLevel = (state) => {
  const world = state.get('world');
  const level = state.get('level');
  const w = Worlds[world];
  if (level + 1 < w.levels.length) {
    return setLevel(state, { world, level: level + 1 });
  }

  return setLevel(state, { world: world + 1, level: 0 });
};

const start = (state) => state.set('running', true);
const pause = (state) => state.set('running', false);
const pass = (state, { message }) =>
  pause(state.set('passed', message).set('failed', false));
const fail = (state, { message }) =>
  pause(state.set('passed', false).set('failed', message));

const stepOnce = (state) => {
  const pose = state.get('pose').toJS();
  const stepCount = state.get('stepCount') + 1;
  const next = state.set('stepCount', stepCount);
  const dt = state.get('dt');
  // TODO: s/tPrev/t||timestamp/g
  const tPrev = stepCount * dt;
  const stepStartingState = next.set('tPrev', tPrev);

  const { pass: passMessage=false, fail: failMessage=false } = levelObject.checkGoal(state.toJS()) || {};
  if (passMessage) {
    const message = `Goal completed in ${Math.round(tPrev*10)/10} seconds!`;
    return pass(pause(state), { message });
  } else if (failMessage) {
    const message = `Failed to complete the goal: ${failMessage}`;
    return fail(pause(state), { message });
  }

  const sensors = {
    pose,
    ...levelObject.getSensors({
      pose,
    }),
  };

  const publish = (topic, evt) => topics.emit(topic, evt);
  robot.onSensors(publish, sensors);

  simulator.step(dt);

  // TODO: don't hard code to this actor
  const { position = {}, orientation = {} } = simulator.actors[0].physics.pose;

  const { x, y } = position;
  const { yaw } = orientation;

  const mPose = fromJS({ x, y, yaw });
  const withPose = stepStartingState.set('pose', mPose);
  return withPose.update('poses', (poses = fromJS([])) => poses.push(mPose));

  // TODO: should emit update information here, not in simulator
};

const setCode = (state, { code }) => {
  try {
    robot = evalRobotCode(code);
  } catch (err) {
    console.error('User code parsing err', err); /* eslint no-console: 0 */
  }
  return reset(state.set('code', code));
};

const levelReducerActions = {
  reset,
  regen,
  setLevel: (state, action) => reset(setLevel(state, action)),
  nextLevel,
  start,
  pause,
  step: (state, { times = 2 }) => {
    let finalState = state;
    for (let i = 0; i < times; i++) {
      finalState = stepOnce(finalState);
    }
    return finalState;
  },
  setCode,
};

export default function levelReducer(state = setLevel(BASE_STATE, { world: 1, level: 0 }), action) {
  if (!levelReducerActions[action.type]) {
    return state;
  }

  return levelReducerActions[action.type](state, action);
}

