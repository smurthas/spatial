import EgoBase from './EgoBase';

import Vector from '../sim/Vector';

const defaultCode = `
const PIDPathFollower = require('pid-path-follower');

const pathFollower = new PIDPathFollower({
  p: -0.05,
  i: 0,
  d: -0.2,
  targetSpeed: 2, // the speed that the car should accelerate up to
});

function tick({ ego, cones, color, timestamp }) {
  if (color === 'white') {
    // TODO: make Ego stop!
  } else {
    const path = [
      { position: { x: 0, y: 0 } }, // starting point

      // TODO: you'll probably need to insert some additional points here!

      { position: { x: 0, y: 200 } }, // a point 200m ahead of the start
    ];

    // this path follower needs the current pose to compute new controls
    pathFollower.setPose({ timestamp, pose: ego.pose });

    // it also needs the desired path
    pathFollower.setPath(path);

    ego.setControls(pathFollower.computeControls());
  }
}
`.trim();

const coneFuzz = (scale = 15) => (Math.random() - 0.5) * scale;

export default class Slalom extends EgoBase {
  constructor(options = {}) {
    super({
      ...options,
      finishY: (options.startY || 0) + 200,
    });
    const { startX = 0, startY = 0, cones = 6, dy = 20 } = options;
    const x = startX;
    let y = startY;
    let left;
    this.cones = ' '.repeat(cones).split('').map(() => {
      y += dy + coneFuzz(dy);
      left = !left;
      return { x, y, passOn: left ? 'left' : 'right' };
    });

    this.BOX_START_Y = startY + 200;
    this.BOX_STOP_Y = startY + 230;

    this.map.areas = [
      ...this.map.areas,
      {
        type: 'rect',
        name: 'Stop Box',
        fillColor: '#ccc',
        x: startX,
        y: (this.BOX_START_Y + this.BOX_STOP_Y) / 2,
        length: 10,
        width: (this.BOX_STOP_Y - this.BOX_START_Y),
      },
      ...this.cones.map((cone, i) => ({
        type: 'circle',
        name: `Cone ${i}`,
        fillColor: cone.passOn === 'left' ? '#d22' : '#22d',
        x: cone.x,
        y: cone.y,
        radius: 0.6,
      })),
      ...this.cones.map((cone, i) => ({
        type: 'circle',
        name: `Cone Center ${i}`,
        fillColor: '#eee',
        x: cone.x,
        y: cone.y,
        radius: 0.2,
      })),
    ];

    this.conesPassed = {};
  }

  isInBox(y) {
    return y > this.BOX_START_Y && y < this.BOX_STOP_Y;
  }

  info() {
    return {
      ...super.info(),
      name: 'Ego Slaloms',
      description: 'Drive Ego to the white box and then stop. Stay *left of red cones and right of the blue ones*.\n\nEgo is equipped with a light sensor which will set the value of `color` to `\'white\'` when it is over the white box.\n\nYou might find it helpful to the use the `PIDPathFollower` class, which when given a series of points, will calculate controls to follow the path. The values of `p`, `i`, and `d` control how the tightly the vehicle will follow the path. See [wikipedia](https://en.wikipedia.org/wiki/PID_controller) for more info.\n\nAlso note, this level is dynamic, so hitting the **Regenerate** button will place the cones in different locations. Can you write an algorithim that works for many different cone configurations? ',
      defaultCode,
      timeout: 45,
      dynamic: true,
    };
  }

  reset() {
    // TODO: calculate this differently so the level object isn't stateful
    this.conesPassed = {};
  }

  getSensors({ pose }) {
    return {
      cones: this.cones,
      color: this.isInBox(pose.y) ? 'white' : 'black',
    };
  }

  checkGoal(state) {
    if (!this.previousState) {
      this.previousState = state;
    }
    const { pose, tPrev } = state;
    const { x, y } = pose;

    const { poses = [] } = state;
    const dt = tPrev - this.previousState.tPrev;
    const v = poses.length < 2 ? 0 :
      (new Vector(poses.slice(-1)[0])).minus(new Vector(poses.slice(-2)[0])).magnitude() / dt;

    this.cones.forEach((cone, i) => {
      if (this.previousState.pose.y < cone.y && state.pose.y > cone.y) {
        // passed this cone
        if ((cone.passOn === 'left' && x < cone.x) ||
            (cone.passOn === 'right' && x > cone.x)) {
          this.conesPassed[i] = true;
        }
      }
    });

    this.previousState = state;

    const conesPassedCount = Object.keys(this.conesPassed).length;

    const inBox = y > this.BOX_START_Y && y < this.BOX_STOP_Y;
    const stopped = Math.abs(v) < 0.05;
    const stoppedInBox = inBox && stopped;
    const passedAllCones = conesPassedCount === this.cones.length;

    let fail = stoppedInBox && !passedAllCones;
    if (fail) {
      if (!stoppedInBox) {
        fail = `drive around the cones and stop in the box in under ${this.timeout} seconds`;
      } else if (!passedAllCones) {
        fail = 'make sure to drive left of the red cones and right of the blue ones!';
      }
    }
    return {
      fail,
      pass: stoppedInBox && passedAllCones,
    };
  }
}

