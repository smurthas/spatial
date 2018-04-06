import Transform from './transform';

const { checkCollision } = require('./utils');
const Pose = require('./Pose');

const BicycleModel = require('./physics-models/bicycle').default;
const StaticModel = require('./physics-models/static').default;
const DifferentialDriveModel = require('./physics-models/differential-drive').default;

const physicsModels = {
  bicycle: BicycleModel,
  static: StaticModel,
  differentialDrive: DifferentialDriveModel,
};

const loadPhysicsModel = name => physicsModels[name];

const checkCollisions = (primary, others) => {
  const { collisionPolys: egoCollisionPolysM, pose } = primary;
  if (!egoCollisionPolysM || egoCollisionPolysM.length === 0) {
    return [];
  }

  // TODO: invert?
  const egoToWorld = new Transform((new Transform(pose)).transform(new Pose()));
  const tfPolys = (list, tf) => list.map(poly => {
    if (poly.center) {
      const center = tf.transform(new Pose({ position: poly.center })).position;
      return {
        center,
        radius: poly.radius,
      };
    }
    return poly.map(p => tf.transform(new Pose({ position: p })));
  });
  const egoCollisionPolys = tfPolys(egoCollisionPolysM, egoToWorld);

  return others.map(({
    collisionPolys: obsCollisionPolysM,
    pose: obsPose,
  }) => {
    if (!obsCollisionPolysM || obsCollisionPolysM.length === 0) {
      return false;
    }
    const obsToWorld = new Transform((new Transform(obsPose)).transform(new Pose()));
    const obsCollisionPolys = tfPolys(obsCollisionPolysM, obsToWorld);
    return checkCollision(egoCollisionPolys, obsCollisionPolys);
  });
};


class Actor {
  constructor({ name, physics, state, asset, primaryCollider }, topics) {
    const Physics = loadPhysicsModel(physics.name);
    this.physics = new Physics(physics);
    this.name = name;
    this.state = state;
    this.asset = asset;
    this.primaryCollider = primaryCollider;

    // TODO: not controls, but messages?
    this.controls = {};

    topics.on(`/${name}/controls`, evt => {
      this.controls = {
        ...this.controls,
        ...evt,
      };
    });
  }
}

class Simulator {
  constructor(options, topics) {
    const actors = options.actors || [];
    this.actors = actors.map(actor => new Actor(actor, topics));
    this.topics = topics;

    this.time = options.time || 0;
  }

  // put everything in place
  setup() {
  }

  step(dt, actorsStates) {
    this.time += dt;

    const newStates = this.actors.map((actor, i) => {
      const newState = actor.physics.step({ dt, ...actorsStates[i] }, actor.controls);
      if (!newState || newState === actor.state) {
        return actorsStates[i];
      }

      // TODO: don't if collision
      return newState;
    });

    const collisionActors = newStates.map((state, i) => ({
      pose: state.pose,
      collisionPolys: this.actors[i].asset && this.actors[i].asset.collisionPolysM || [],
    }));

    const collisions = collisionActors.map((collActor, i) => {
      if (!this.actors[i].primaryCollider) {
        return [];
      }
      const others = [...collisionActors.slice(0, i), {}, ...collisionActors.slice(i+1)];
      return checkCollisions(collActor, others);
    });

    const finalStates = collisions.map((actorCollisions, i) => {
      const didCollide = actorCollisions.reduce((acc, v) => v || acc, false);
      if (didCollide) {
        return {
          ...actorsStates[i],
          collision: true,
        };
      }

      return {
        ...newStates[i],
        collision: false,
      };
    });

    this.actors.forEach((actor, i) => {
      const topic = `/${actor.name}/pose`;
      this.topics.emit(topic, {
        timestamp: this.time,
        pose: newStates[i].pose,
      });
    });

    return finalStates;
  }

  teardown() {
  }
}


export default Simulator;
