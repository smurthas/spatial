import { fromJS } from 'immutable';
import { parseScript } from 'esprima';

import Simulator from '../../sim/sim';
import BicyclePathFollower from '../../sim/controllers/bicycle';
import DiffDriveSafetryController from '../../sim/controllers/diffDriveSafety';
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
  'diff-drive-safety-controller': DiffDriveSafetryController,
};

function evalCode(code) {
  const localRequire = (mod) => modules[mod];
  const evalThis = {
    require: localRequire,
  };
  const wrappedCode = `
${code};
const robot = {};
try {
  robot.onInit = onInit;
} catch(err) {}
try {
  robot.tick = tick;
} catch(err) {}
return robot;
`;
  const fn = new Function('require', wrappedCode); /* eslint no-new-func: 0 */
  return fn.call(evalThis, localRequire);
}

const newSimulatorFromState = () => {
  topics = new SynchronousEmitter();
  const { onInit = () => undefined } = robot;
  try {
    onInit(topics);
  } catch (err) {
    console.error('Error executing onInit', err); /* eslint no-console: 0 */
  }

  simulator = new Simulator({
    actors: levelObject.actors,
  }, topics);
};


const reset = (state) => {
  // TODO:
  //   reset level (maybe remove?)
  //   new robot from code (e.g. clear any state from eval'd js
  const actorsStates = fromJS((levelObject.actors || []).map(a => a.state));
  const newState = state.merge(BASE_STATE)
                        .set('actorsStates', actorsStates);
  newSimulatorFromState();
  return newState;
};

// just set to existing level to generate a new level
const regen = (state) => setLevel(state, state.toJS());

const setLevel = (state, { world, level }) => {
  const Level = Worlds[world].levels[level];
  levelObject = new Level();
  const info = levelObject.info();
  const { defaultCode } = info;
  const map = fromJS(levelObject.map);
  const withNextLevel = state.set('level', level)
                             .set('world', world)
                             .set('map', map)
                             .set('actors', levelObject.actors)
                             .set('info', info);
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
  const egoState = state.get('actorsStates').toJS()[0];
  const stepCount = state.get('stepCount') + 1;
  const next = state.set('stepCount', stepCount);
  const dt = state.get('dt');
  const actorsNames = state.get('actors').map(({ name }) => name);
  // TODO: s/tPrev/t||timestamp/g
  const tPrev = stepCount * dt;
  if (tPrev > state.get('info').timeout) {
    return fail(pause(state), { message: 'Time is up!' });
  }
  const stepStartingState = next.set('tPrev', tPrev);

  const { pass: passMessage=false, fail: failMessage=false } = levelObject.checkGoal(state.toJS()) || {};
  if (passMessage) {
    const message = `Goal completed in ${Math.round(tPrev*10)/10} seconds!`;
    return pass(pause(state), { message });
  } else if (failMessage) {
    const message = `Failed to complete the goal: ${failMessage}`;
    return fail(pause(state), { message });
  }

  const tickInput = {
    state: egoState,
    ...levelObject.getSensors({
      pose,
    }),
    timestamp: tPrev,
  };

  const publish = (topic, evt) => topics.emit(topic, evt);
  const { tick = () => undefined } = robot;
  const ego = {
    setControls: ctrls => topics.emit(`/${actorsNames[0]}/controls`, ctrls),
  };
  tick(ego, tickInput, publish);

  const actorsStates = stepStartingState.get('actorsStates').toJS();
  const newActorsStates = simulator.step(dt, actorsStates);

  const afterStepState = stepStartingState.set('actorsStates', fromJS(newActorsStates));

  // TODO: don't hard code to this actor
  const newPose = newActorsStates[0].pose;
  const { position = {}, orientation = {} } = newPose;
  newActorsStates.forEach((newActorsState, i) => {
    if (newActorsState.collision) {
      publish(`/${actorsNames[i]}/collision`, {});
    }
  });

  const { x, y } = position;
  const { yaw } = orientation;

  const mPose = fromJS({ x, y, yaw });
  const withPose = afterStepState.set('pose', mPose);
  return withPose.update('poses', (poses = fromJS([])) => poses.push(mPose));

  // TODO: should emit update information here, not in simulator
};

const setCode = (state, { code }) => {
  const withCode = state.set('code', code);
  let parsed = false;
  try {
    parseScript(code);
    parsed = true;
  } catch (parseErr) {
    console.error('User code parsing err', parseErr); /* eslint no-console: 0 */
    console.log(code.split('\n')[parseErr.lineNumber - 1]);
    return reset(withCode.set('syntaxError', parseErr));
  }

  if (parsed) {
    try {
      robot = evalCode(code);
    } catch (err) {
      console.error('User code runtime err', err); /* eslint no-console: 0 */
    }
  }
  return reset(withCode.delete('syntaxError'));
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

