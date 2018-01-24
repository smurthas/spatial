const assert = require('assert');
const EventEmitter = require('events');

const BicyclePathFollower = require('../controllers/bicycle');
const Pose = require('../Pose');

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
    const sim = new Simulator({
      actors: [
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
        },
        {
          physics: {
            name: 'static',
            pose: cone,
          },
          name: 'cone',
        },
      ],
    }, topics);

    const squarePath = [
      new Pose(),
      new Pose({ position: { x: 1 } }),
      new Pose({ position: { x: 2, y: 0.1 } }),
      new Pose({ position: { x: 3, y: 0.3 } }),
      new Pose({ position: { x: 4, y: 0.5 } }),
    ];

    const controller = new BicyclePathFollower({
      publishControlsTopic: '/ego/controls',
      accel: 1,
    }, topics);

    topics.on('/ego/pose', evt => controller.on('pose', evt));
    topics.on('/ego/path', evt => controller.on('path', evt));

    topics.emit('/ego/path', squarePath);

    assert.deepEqual(sim.actors[0].physics.pose, originPose);
    assert.deepEqual(sim.actors[0].physics.velocity, zeroVelocity);

    topics.emit('/ego/controls', { theta: 0, a: 1 });
    assert.deepEqual(sim.actors[1].physics.pose, conePose);
    assert.deepEqual(sim.actors[1].physics.velocity, zeroVelocity);

    sim.step(0.1);
    assert.deepEqual(sim.actors[0].physics.pose, originPose);
    assert.deepEqual(sim.actors[0].physics.velocity, velocityFrom({
      linear: { x: 0.1 },
    }));

    assert.deepEqual(sim.actors[1].physics.pose, conePose);
    assert.deepEqual(sim.actors[1].physics.velocity, zeroVelocity);

    sim.step(0.05);
    deepNearlyEqual(sim.actors[0].physics.pose, new Pose({
      position: { x: 0.005 },
    }));
    deepNearlyEqual(sim.actors[0].physics.velocity, velocityFrom({
      linear: { x: 0.15 },
    }));

    assert.deepEqual(sim.actors[1].physics.pose, conePose);
    assert.deepEqual(sim.actors[1].physics.velocity, zeroVelocity);

    topics.emit('/ego/controls', { theta: 5.0 / 180.0 * Math.PI, a: 0 });
    sim.step(0.1);
    deepNearlyEqual(sim.actors[0].physics.pose, new Pose({
      position: { x: 0.02 },
      orientation: { yaw: 0.00065449 },
    }), 0.000001);
    deepNearlyEqual(sim.actors[0].physics.velocity, velocityFrom({
      angular: { yaw: 0.0065449 },
      linear: { x: 0.15 },
    }));

    assert.deepEqual(sim.actors[1].physics.pose, conePose);
    assert.deepEqual(sim.actors[1].physics.velocity, zeroVelocity);
    for (let i = 0; i < 100; i++) {
      sim.step(0.1);
    }
  });
});
