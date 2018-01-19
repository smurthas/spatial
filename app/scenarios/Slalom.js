
const defaultCode = `const PIDPathFollower = this.require('pid-path-follower');

function onInit(topics) {
  const pathFollower = new PIDPathFollower({
    publishControlsTopic: '/ego/controls',
  }, topics);

  topics.on('/ego/pose', pose => pathFollower.on('pose', pose));
  topics.on('/ego/path', path => pathFollower.on('path', path));
}

function onSensors(publish, { vehicle, cones, color }) {
  // if over the stop box, well, stop
  if (color === 'white') {
    publish('/ego/path', []);
    publish('/ego/controls', { theta: 0, b: 5 });
    return;
  }

  const path = cones.map(({ x, y, passOn }) => {
    return {
      position: { x: x + (passOn === 'left' ? -5 : 5), y, z: 0 },
      orientation: { roll: 0, pitch: 0, yaw: 1.57 },
    };
  });
  const last = path.slice(-1)[0];
  path.push({
    position: { x: last.position.x, y: last.position.y + 50, z: 0 },
    orientation: { roll: 0, pitch: 0, yaw: 1.57 },
  });
  publish('/ego/path', path);
}`;


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

    this.conesPassed = {};
    this.timeout = 60;
  }

  static info() {
    return {
      name: 'Slalom',
      description: 'Drive to the white box and then stop the vehicle. Stay left of red cones and right of the blue ones. The vehicle is equipped with a light sensor which will result in sensors.color === \'white\' when it is over the white  box.',
      defaultCode,
    };
  }

  reset() {
    this.conesPassed = {};
  }

  getSensors(state) {
    return {
      cones: this.cones,
      color: isInBox(state.vehicle.y) ? 'white' : 'black',
    };
  }

  checkGoal(state) {
    if (!this.previousState) {
      this.previousState = state;
    }
    const { vehicle, t_prev } = state;
    const { x, y } = vehicle;

    const { poses } = state;
    const dt = t_prev - this.previousState.t_prev;
    const v = poses.length < 2 ? 0 :
      poses.slice(-1)[0].position.minus(poses.slice(-2)[0].position).magnitude() / dt;

    this.cones.forEach((cone, i) => {
      if (this.previousState.vehicle.y < cone.y && state.vehicle.y > cone.y) {
        // passed this cone
        if ((cone.passOn === 'left' && x < cone.x) ||
            (cone.passOn === 'right' && x > cone.x)) {
          this.conesPassed[i] = true;
        }
      }
    });

    this.previousState = state;

    const conesPassedCount = Object.keys(this.conesPassed).length;

    const timedout = t_prev > this.timeout; // TODO: make non magic
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

