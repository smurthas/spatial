import DidiBase from './DidiBase';

const defaultCode =`
const TURN_LEFT_UNTIL_X = 0.7;

// When right speed > left, Didi turns left
const TURN_LEFT = {
  wheelSpeeds: { left: 0.2, right: 1.0 }
};

// When left and right speed are equal, Didi goes straight
const GO_STRAIGHT = {
  wheelSpeeds: { left: 1.0, right: 1.0 }
};

// called every 0.05 seconds of game time
function tick({ didi, timestamp }) {
  // At first, turn left. Once Didi has turned enough, go straight.
  if (didi.pose.position.x > TURN_LEFT_UNTIL_X) {
    didi.setControls(TURN_LEFT);
  } else {
    didi.setControls(GO_STRAIGHT);
  }
}
`.trim();

export default class DidiGoesHome extends DidiBase {
  constructor(options = {}) {
    super({
      ...options,
      startX: 1,
      startY: 2,
    });
    this.endX = this.originX;
    this.endY = this.originY;

    this.map.areas.push({
      type: 'img',
      name: 'baseboard',
      asset: 'diffDriveCharger',
      x: this.endX,
      y: this.endY - 0.043,
      heading: Math.PI,
    });
  }

  checkGoal({ pose: { x, y, yaw } }) {
    const dx = Math.abs(x - this.endX);
    const dy = Math.abs(y - this.endY);
    const dyaw = Math.abs(yaw - (3/2*Math.PI));
    const inBox = dx < 0.2 && dy < 0.2;
    const pointedAtCharger = dyaw < 0.2;
    if (inBox && pointedAtCharger) {
      return { pass: 'you did it!', fail: false };
    }
    return { pass: false, fail: false };
  }

  info() {
    return {
      ...super.info(),
      name: 'Didi Heads Home',
      description: 'Program Didi to drive back to the charger in the bottom left corner of the bedroom!\n\nThe `tick` function will get called every time the game clock advances. Within the `tick` function, you can control Didi by setting the left and right wheel speeds by calling `didi.setControls`. Didi has two wheels that can be controlled independently, so setting them to different speeds will cause Didi to turn in one direction or the other:\n\n```\nleft < right: ↺\nleft > right: ↻\nleft = right: ↑\n```\n\nYou could use `timestamp` or `didi.pose` values to decide whether to turn or go straight.',
      defaultCode,
      display: [
        {
          type: 'points',
          from: '/didi/pose',
          fillColor: 'rgb(200, 50, 50)',
          radius: 0.03,
        },
      ],
      timeout: 30,
    };
  }
}

