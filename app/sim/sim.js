
const physicsModels = {};

const loadPhysicsModel = name => {
  physicsModels[name] = require(__dirname + '/physics-models/' + name);
  return physicsModels[name];
};


class Actor {
  constructor(options, topics) {
    const Physics = loadPhysicsModel(options.physics.name);
    this.physics = new Physics(options.physics);
    this.name = options.name;

    // TODO: not controls, but messages?
    this.controls = {};

    Object.keys(options.listen).forEach(topic => {
      topics.on(topic, evt => {
        this.controls = {
          ...this.controls,
          ...evt,
        };
      });
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

  step(dt) {
    this.time += dt;

    this.actors.forEach(actor => actor.physics.step({ dt }, actor.controls));

    this.actors.forEach(actor => {
      const topic = `/${actor.name}/pose`;
      this.topics.emit(topic, {
        timestamp: this.time,
        pose: actor.physics.pose,
      });
    });
  }

  teardown() {
  }
}


module.exports = Simulator;
