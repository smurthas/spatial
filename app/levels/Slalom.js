import ego from '../actors/Ego';

import Pose from '../sim/Pose';
import Vector from '../sim/Vector';
import Velocity from '../sim/Velocity';

const defaultCode = `
const PIDPathFollower = require('pid-path-follower');

const pathFollower = new PIDPathFollower();

const convertConesToPath = (cones, offset = 2) => cones.map(({ x, y, passOn }) => ({
  position: { x: x + (passOn === 'left' ? -offset : offset), y, z: 0 },
  orientation: { roll: 0, pitch: 0, yaw: 1.57 },
}));

function tick(ego, { state: { pose }, cones, color, timestamp }) {
  // if over the stop box, well, stop
  if (color === 'white') {
    ego.setControls({ theta: 0, b: 5 });
    return;
  }

  const path = convertConesToPath(cones);
  const last = path.slice(-1)[0];
  path.push({
    position: { x: last.position.x, y: last.position.y + 50, z: 0 },
    orientation: { roll: 0, pitch: 0, yaw: 1.57 },
  });

  pathFollower.setPose({
    timestamp,
    pose,
  });
  pathFollower.setPath(path);
  ego.setControls(pathFollower.computeControls());
}
`.trim();


const BOX_START_Y = 250;
const BOX_STOP_Y = 350;

const isInBox = y => y > BOX_START_Y && y < BOX_STOP_Y;

const coneFuzz = (scale = 15) => (Math.random() - 0.5) * scale;

export default class Slalom {
  constructor(options={}) {
    const { startX=50, startY=50, cones=6, dy=20 } = options;
    const x = startX;
    let y = startY;
    let left;
    this.cones = ' '.repeat(cones).split('').map(() => {
      y += dy + coneFuzz(dy);
      left = !left;
      return { x, y, passOn: left ? 'left' : 'right' };
    });

    this.map = {
      areas: [
        {
          type: 'rect',
          name: 'Stop Box',
          fillColor: '#aaa',
          x: 320,
          y: (BOX_START_Y + BOX_STOP_Y) / 2,
          length: 640,
          width: (BOX_STOP_Y - BOX_START_Y),
        },
        ...this.cones.map((cone, i) => ({
          type: 'circle',
          name: `Cone ${i}`,
          fillColor: cone.passOn === 'left' ? '#d22' : '#22d',
          x: cone.x,
          y: cone.y,
          radius: 1,
        })),
        ...this.cones.map((cone, i) => ({
          type: 'circle',
          name: `Cone Center ${i}`,
          fillColor: '#eee',
          x: cone.x,
          y: cone.y,
          radius: 0.3,
        })),
      ],
    };

    this.actors = [
      ego({
        state: {
          pose: new Pose({
            position: { x: 50, y: 50 },
            orientation: { yaw: Math.PI / 2 },
          }),
          velocity: new Velocity(),
        },
      }),
    ];

    this.conesPassed = {};
    this.timeout = 60;
  }

  info() {
    return {
      name: 'Slalom',
      description: 'Drive to the white box and then stop the vehicle. Stay left of red cones and right of the blue ones. The vehicle is equipped with a light sensor which will result in sensors.color === \'white\' when it is over the white  box.',
      defaultCode,
      ego: {
        asset: 'car02',
        physics: {
          name: 'bicycle',
        },
        name: 'ego',
      },
      display: [
        {
          type: 'points',
          from: '/ego/pose',
          fillColor: 'rgb(200, 50, 50)',
          radius: 0.35,
        },
      ],
      timeout: 45,
      defaultScale: 8,
    };
  }

  reset() {
    // TODO: calculate this differently so the level object isn't stateful
    this.conesPassed = {};
  }

  getSensors({ pose }) {
    return {
      cones: this.cones,
      color: isInBox(pose.y) ? 'white' : 'black',
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

    const timedout = tPrev > this.timeout; // TODO: make non magic
    const inBox = y > BOX_START_Y && y < BOX_STOP_Y;
    const stopped = Math.abs(v) < 0.05;
    const stoppedInBox = inBox && stopped;
    const passedAllCones = conesPassedCount === this.cones.length;

    let fail = timedout || (stoppedInBox && !passedAllCones);
    if (fail) {
      if (!stoppedInBox) {
        fail = `drive around the cones and stop in the box in under ${this.timeout} seconds`;
      } else if (!passedAllCones) {
        fail = 'make sure to drive left of the red cones and right of the blue ones!';
      }
    }
    return {
      fail,
      pass: !timedout && stoppedInBox && passedAllCones,
    };
  }
}

