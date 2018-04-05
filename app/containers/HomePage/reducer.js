import { fromJS } from 'immutable';
import { parseScript } from 'esprima';

import Simulator from '../../sim/sim';
import BicyclePathFollower from '../../sim/controllers/bicycle';
import DiffDriveSafetryController from '../../sim/controllers/diffDriveSafety';
import Transform from '../../sim/transform';
import Worlds from '../../levels';

import { saveCodeForLevel, getCodeForLevel } from '../../utils/codeStore';
import { postCodeForLevel } from '../../utils/solutions';

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
  pose: { x: 0, y: 0, yaw: 0 }, // TODO: real Pose
  poses: [],
});


const modules = {
  'pid-path-follower': BicyclePathFollower,
  'diff-drive-safety-controller': DiffDriveSafetryController,
  transform: Transform,
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
  // eslint-disable-next-line no-new-func
  const fn = new Function('require', wrappedCode);
  return fn.call(evalThis, localRequire);
}

const newSimulatorFromState = () => {
  topics = new SynchronousEmitter();
  const { onInit = () => undefined } = robot;
  try {
    onInit(topics);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error executing onInit', err);
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

const setLevel = (state, { world: rawWorld, level: rawLevel, code }) => {
  const world = parseInt(rawWorld, 10);
  const level = parseInt(rawLevel, 10);
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

  const userCode = getCodeForLevel({ world, level });
  return setCode(withNextLevel, { code: code || userCode || defaultCode });
};

const nextLevel = (state) => {
  const world = state.get('world');
  const level = state.get('level');
  const w = Worlds[world];
  if (level + 1 < w.levels.length) {
    // next level in world
    window.location = `/_/${world}/${level + 1}`;
  } else if (world + 1 < Worlds.length) {
    // next world
    window.location = `/_/${world + 1}/0`;
  } else {
    // completed all
    window.location = '/completed-all';
  }

  return state;
};

const start = (state) => {
  setTimeout(() => postCodeForLevel({ prefix: 'start', state }), 1);
  return state.set('running', true);
};
const pause = (state) => state.set('running', false);
const pass = (state, { message }) => {
  setTimeout(() => postCodeForLevel({ prefix: 'pass', state }), 1);
  return pause(state.set('passed', message).set('failed', false));
};
const fail = (state, { message }) => {
  setTimeout(() => postCodeForLevel({ prefix: 'fail', state }), 1);
  return pause(state.set('passed', false).set('failed', message));
};


const stepOnce = (state) => {
  const pose = state.get('pose').toJS();
  const {
    timeout = 60,
    ego: { actorsIndex = 0, name: egoName },
  } = state.get('info');
  const egoState = state.get('actorsStates').toJS()[actorsIndex];
  const stepCount = state.get('stepCount') + 1;
  const next = state.set('stepCount', stepCount);
  const dt = state.get('dt');
  const actorsNames = state.get('actors').map(({ name }) => name);
  // TODO: s/tPrev/t||timestamp/g
  const tPrev = stepCount * dt;
  if (tPrev > timeout) {
    return fail(pause(state), { message: 'Time is up!' });
  }
  const stepStartingState = next.set('tPrev', tPrev);

  const { pass: passMessage=false, fail: failMessage=false } = levelObject.checkGoal(stepStartingState.toJS()) || {};
  if (passMessage) {
    const message = `Goal completed in ${Math.round(tPrev*100)/100} seconds!`;
    return pass(pause(stepStartingState), { message });
  } else if (failMessage) {
    const message = `Failed to complete the goal: ${failMessage}`;
    return fail(pause(stepStartingState), { message });
  }

  const tickInput = {
    ...levelObject.getSensors({
      pose,
    }),
    timestamp: tPrev,
  };

  const publish = (topic, evt) => topics.emit(topic, evt);
  const { tick = () => undefined } = robot;
  const ego = {
    setControls: ctrls => topics.emit(`/${actorsNames[actorsIndex]}/controls`, ctrls),
    ...egoState,
  };
  const input = {
    ...tickInput,
    [egoName]: ego,
  };
  tick(input, publish);

  const actorsStates = stepStartingState.get('actorsStates').toJS();
  const newActorsStates = simulator.step(dt, actorsStates);

  const afterStepState = stepStartingState.set('actorsStates', fromJS(newActorsStates));

  // TODO: don't hard code to this actor
  const newPose = newActorsStates[actorsIndex].pose;
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
    // eslint-disable-next-line no-console
    console.error('User code parsing err', parseErr);
    // eslint-disable-next-line no-console
    console.log(code.split('\n')[parseErr.lineNumber - 1]);
    return reset(withCode.set('syntaxError', parseErr));
  }

  if (parsed) {
    try {
      robot = evalCode(code);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('User code runtime err', err);
    }
  }

  const world = state.get('world');
  const level = state.get('level');
  saveCodeForLevel({ world, level, code });

  return reset(withCode.delete('syntaxError'));
};

const resetCodeToDefault = (state) => setCode(state, { code: state.get('info').defaultCode });

const levelReducerActions = {
  reset,
  regen,
  setLevel: (state, action) => reset(setLevel(state, action)),
  nextLevel,
  start,
  pause,
  resetCodeToDefault,
  step: (state, { times = 2 }) => {
    let finalState = state;
    for (let i = 0; i < times; i++) {
      finalState = stepOnce(finalState);
    }
    return finalState;
  },
  setCode,
};

export default function levelReducer(state = setLevel(BASE_STATE, { world: 0, level: 0 }), action) {
  if (!levelReducerActions[action.type]) {
    return state;
  }

  return levelReducerActions[action.type](state, action);
}

