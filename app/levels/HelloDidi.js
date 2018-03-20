import { Howl } from 'howler';

import DidiBase from './DidiBase';

import { computeOGridFromPoses } from '../sim/utils';

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

export default class HelloDidi extends DidiBase {
  constructor(options = {}) {
    super(options);
    const {
      startX = 50,
      startY = 50,
      gridResolution = 0.375,
    } = options;
    this.startX = startX;
    this.startY = startY;
    this.gridResolution = gridResolution;

    this.grid = {
      rows: this.width / this.gridResolution,
      cols: this.length / this.gridResolution,
      resolution: this.gridResolution,
      origin: { x: this.left, y: this.bottom },
    };

    this.hitCount = 0;
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
      ...super.info(),
      name: 'Didi Cleans Up',
      description: 'Drive Didi over at least 75% of the room in less than 5 minutes to to get everything clean!',
      defaultCode,
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
    };
  }
}

