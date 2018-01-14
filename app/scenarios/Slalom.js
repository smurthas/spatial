
const BOX_START_Y = 400;
const BOX_STOP_Y = 450;

const isInBox = y => {
  return y > BOX_START_Y && y < BOX_STOP_Y;
};

const coneFuzz = (scale = 25) => (Math.random() - 0.5) * scale;

export default class Slalom {
  constructor() {
    this.cones = [
      { x: 50, y: 100 + coneFuzz(), passOn: 'left' },
      { x: 50, y: 150 + coneFuzz(), passOn: 'right' },
      { x: 50, y: 200 + coneFuzz(), passOn: 'left' },
      { x: 50, y: 250 + coneFuzz(), passOn: 'right' },
      { x: 50, y: 300 + coneFuzz(), passOn: 'left' },
      { x: 50, y: 350 + coneFuzz(), passOn: 'right' },
    ];

    this.map = {
      areas: [
        {
          type: 'rect',
          name: 'Stop Box',
          fillColor: '#aaa',
          x: 320, y: (BOX_START_Y + BOX_STOP_Y) / 2,
          length: 640, width: (BOX_STOP_Y - BOX_START_Y),
        },
        ...this.cones.map((cone, i) => ({
          type: 'circle',
          name: `Cone ${i}`,
          fillColor: cone.passOn === 'left' ? '#d22' : '#22d',
          x: cone.x, y: cone.y,
          radius: 1,
        })),
        ...this.cones.map((cone, i) => ({
          type: 'circle',
          name: `Cone Center ${i}`,
          fillColor: '#eee',
          x: cone.x, y: cone.y,
          radius: 0.3,
        })),
      ],
    };

    this.conesPassed = {};
  }

  static info() {
    return {
      name: 'Slalom',
      description: 'Drive to the black box and then stop the vehicle. Stay left of red cones and right of the blue ones. The vehicle is equipped with a light sensor which will result in sensors.color === \'white\' when it is over the black box',
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
    const { x, y } = state.vehicle;

    const { poses } = state;
    const dt = state.t_prev - this.previousState.t_prev;
    const v = poses.length < 2 ?  0 :
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

    const stoppedInBox = y > BOX_START_Y && y < BOX_STOP_Y && Math.abs(v) < 0.05;
    const passedAllCones = conesPassedCount === this.cones.length;

    return passedAllCones && stoppedInBox;
  }
}

