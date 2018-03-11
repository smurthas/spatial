const assert = require('assert');
const EventEmitter = require('events');

const BicyclePathFollower = require('../controllers/bicycle');
const Pose = require('../Pose');
const Velocity = require('../Velocity');

const Simulator = require('../sim');
const tolerant = (obj, esp = 0.001) => {
  const ret = {};
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'number') {
      ret[key] = Math.round(obj[key]/esp) * esp;
    } else {
      ret[key] = tolerant(obj[key]);
    }
  });
  return ret;
};

const deepNearlyEqual = (obj1, obj2, esp) => assert.deepEqual(tolerant(obj1, esp), tolerant(obj2, esp));

const velocityFrom = (velocity) => {
  const { linear, angular } = velocity || {};
  return {
    linear: { x: 0, y: 0, z: 0, ...linear },
    angular: { roll: 0, pitch: 0, yaw: 0, ...angular },
  };
};

const originPose = new Pose();

const zeroVelocity = velocityFrom();

const topics = new EventEmitter();

describe('sim', () => {
  it('should step actors', () => {
    const cone = { position: { x: 4 }, orientation: { pitch: 1 } };
    const conePose = new Pose(cone);

    const coneInitState = { pose: conePose };
    const egoInitState = { pose: originPose, velocity: new Velocity() };

    const actors = [
      {
        physics: {
          name: 'bicycle',
          lf: 2,
          lr: 2,
        },
        name: 'ego',
        listen: {
          '/ego/controls': { set: 'controls' },
        },
        controller: {
          type: 'bicycle',
        },
        state: egoInitState,
      },
      {
        physics: {
          name: 'static',
          pose: cone,
        },
        state: coneInitState,
        name: 'cone',
      },
    ];
    const sim = new Simulator({ actors }, topics);

    let actorsStates = [egoInitState, coneInitState];

    const squarePath = [
      new Pose(),
      new Pose({ position: { x: 1 } }),
      new Pose({ position: { x: 2, y: 0.1 } }),
      new Pose({ position: { x: 3, y: 0.3 } }),
      new Pose({ position: { x: 4, y: 0.5 } }),
    ];

    const controller = new BicyclePathFollower({ accel: 1 });

    topics.on('/ego/pose', evt => controller.on('pose', evt));
    topics.on('/ego/path', evt => controller.on('path', evt));

    controller.setPath(squarePath);
    controller.setPose({ timestamp: 0, pose: actorsStates[0].pose });

    assert.deepEqual(actorsStates[0].pose, originPose);
    assert.deepEqual(actorsStates[0].velocity, zeroVelocity);

    topics.emit('/ego/controls', { theta: 0, a: 1 });
    assert.deepEqual(sim.actors[1].state.pose, conePose);

    actorsStates = sim.step(0.1, actorsStates);
    assert.deepEqual(actorsStates[0].pose, originPose);
    assert.deepEqual(actorsStates[0].velocity, velocityFrom({
      linear: { x: 0.1 },
    }));

    assert.deepEqual(actorsStates[1].pose, conePose);

    controller.setPose({ timestamp: 0.1, pose: actorsStates[0].pose });
    topics.emit('/ego/controls', controller.computeControls());

    actorsStates = sim.step(0.05, actorsStates);
    deepNearlyEqual(actorsStates[0].pose, new Pose({
      position: { x: 0.005 },
    }));
    deepNearlyEqual(actorsStates[0].velocity, velocityFrom({
      linear: { x: 0.15 },
    }));

    assert.deepEqual(actorsStates[1].pose, conePose);

    topics.emit('/ego/controls', { theta: 5.0 / 180.0 * Math.PI, a: 0 });
    actorsStates = sim.step(0.1, actorsStates);
    deepNearlyEqual(actorsStates[0].pose, new Pose({
      position: { x: 0.02 },
      orientation: { yaw: 0.00065449 },
    }), 0.000001);
    deepNearlyEqual(actorsStates[0].velocity, velocityFrom({
      angular: { yaw: 0.0065449 },
      linear: { x: 0.15 },
    }));

    assert.deepEqual(actorsStates[1].pose, conePose);
    for (let i = 0; i < 100; i++) {
      controller.setPose({ timestamp: 0.25 + (i * 0.1), pose: actorsStates[0].pose });
      const controls = controller.computeControls();
      topics.emit('/ego/controls', controls);
      actorsStates = sim.step(0.1, actorsStates);
    }
    deepNearlyEqual(actorsStates[0].pose, {
      position: { x: 50.01008435368484, y: 9.653747880806517, z: 0 },
      orientation: { roll: 0, pitch: 0, yaw: 0.19942110254059842 },
    });
  });
});
