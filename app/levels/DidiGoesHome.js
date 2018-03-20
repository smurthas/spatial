import DidiBase from './DidiBase';

const defaultCode =`
function tick(didi, { state }) {
  // publish the controls message to wheels
  didi.setControls({
    vLeft: 0.2, // speed of the left wheel
    vRight: 0.185, // speed of the right wheel
  });
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
      y: this.endY,
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
      description: 'Drive Didi back to the charger!',
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

