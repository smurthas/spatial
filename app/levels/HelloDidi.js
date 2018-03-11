import { Howl } from 'howler';

import { computeOGridFromPoses } from '../sim/utils';

import didi from '../actors/Didi';
import wall from '../actors/Wall';
import bed01 from '../actors/Bed01';
import sofa01 from '../actors/Sofa01';

import beep from '../assets/audio/beeps/001.m4a';

const beepSound = new Howl({
  src: [beep],
});

const defaultCode =`
function tick(didi, { state }) {
  if (state.collision) {
    // TODO: maybe do something if Didi bumps into a wall?
  }

  // publish the controls message to wheels
  didi.setControls({
    vLeft: 0.2, // speed of the left wheel
    vRight: 0.185, // speed of the right wheel
  });
}
`.trim();

export default class HelloDidi {
  constructor(options = {}) {
    const {
      startX = 50,
      startY = 50,
      length = 3.75,
      width = 4.125,
      gridResolution = 0.375,
    } = options;
    this.startX = startX;
    this.startY = startY;
    this.length = length;
    this.width = width;
    this.gridResolution = gridResolution;

    this.bottom = this.startY - 0.2;
    this.top = this.bottom + this.width;
    this.left = this.startX - 0.2;
    this.right = this.left + this.length;
    this.midX = (this.left + this.right) / 2;
    this.midY = (this.top + this.bottom) / 2;
    this.grid = {
      rows: this.width / this.gridResolution,
      cols: this.length / this.gridResolution,
      resolution: this.gridResolution,
      origin: { x: this.left, y: this.bottom },
    };

    this.hitCount = 0;

    this.map = {
      areas: [
        {
          type: 'rect',
          name: 'baseboard',
          fillColor: 'white',
          x: this.midX,
          y: this.midY,
          width: this.width + 0.02,
          length: this.length + 0.02,
        },
        {
          type: 'rect',
          name: 'floor',
          asset: 'carpetBeige01',
          x: this.midX,
          y: this.midY,
          width,
          length,
        },
      ],
    };

    this.actors = [
      didi({
        state: {
          pose: {
            position: { x: this.startX, y: this.startY },
            orientation: { yaw: Math.PI / 2 },
          },
        },
      }),
      wall({
        name: 'top-wall',
        fillColor: 'grey',
        width: 0.1,
        length: this.length + 0.2,
        state: {
          pose: {
            position: {
              x: this.midX,
              y: this.top + 0.05,
            },
          },
        },
      }),
      wall({
        name: 'left-wall',
        fillColor: 'grey',
        width: this.width + 0.2,
        length: 0.1,
        state: {
          pose: {
            position: {
              x: this.left - 0.05,
              y: this.midY,
            },
          },
        },
      }),
      wall({
        name: 'bottom-wall',
        fillColor: 'grey',
        width: 0.1,
        length: this.length + 0.2,
        state: {
          pose: {
            position: {
              x: this.midX,
              y: this.bottom - 0.05,
            },
          },
        },
      }),
      wall({
        name: 'left-wall',
        fillColor: 'grey',
        width: this.width + 0.2,
        length: 0.1,
        state: {
          pose: {
            position: {
              x: this.right + 0.05,
              y: this.midY,
            },
          },
        },
      }),
      bed01({
        name: 'bed',
        state: {
          pose: {
            position: {
              x: this.midX,
              y: this.bottom + 0.95,
            },
            orientation: {
              yaw: Math.PI,
            },
          },
        },
      }),
      sofa01({
        name: 'sofa',
        state: {
          pose: {
            position: {
              x: this.startX + 2.5,
              y: this.startY + 3.42,
            },
          },
        },
      }),
    ];
  }

  reset() { }

  getSensors() {
    return {};
  }

  checkGoal({ poses }) {
    const { rows, cols } = this.grid;
    const doneCount = rows * cols * 0.5;
    const ogrid = computeOGridFromPoses({ poses, ...this.grid });
    const hitCount = ogrid.reduce((acc, v) => acc + v, 0);
    if (hitCount !== this.hitCount) {
      // play beep
      beepSound.play();
    }
    this.hitCount = hitCount;
    const progress = hitCount / doneCount;
    if (progress < 1) {
      return { pass: false, fail: false };
    }
    return { pass: 'done!', fail: false };
  }

  info() {
    return {
      name: 'Didi Cleans Up',
      description: 'Drive Didi over at least 75% of the room in less than 5 minutes to to get everything clean!',
      defaultCode,
      ego: {
        asset: 'diffDrive',
        physics: {
          name: 'differentialDrive',
          trackWidth: 0.235,
        },
        name: 'didi',
      },
      collisionIsFailure: false,
      center: {
        x: this.midX,
        y: this.midY,
      },
      display: [
        {
          type: 'accogrid',
          fillColor: 'rgba(92, 192, 92, 0.6)',
          from: '/didi/pose',
          grid: this.grid,
        },
        {
          type: 'points',
          from: '/didi/pose',
          fillColor: 'rgb(200, 50, 50)',
          radius: 0.03,
        },
      ],
      timeout: 300,
      defaultScale: 120,
    };
  }
}

