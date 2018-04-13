import EgoBase from './EgoBase';

const defaultCode =`
function tick({ ego }) {
  // TODO: set the acceleration value of the controls
  ego.setControls({
    a: 0.2, // acceleration of the car
    b: 0, // braking of the car
    theta: 0, // steering angle, < 0 is left, > 0 is right
  });
}
`.trim();

export default class HelloTopics extends EgoBase {
  constructor(options={}) {
    super(options);

    this.map.areas = [
      ...this.map.areas,
      ...Array.from(' '.repeat(30)).map((_, i) => {
        const fillColor = i%2 ? '#fff' : '#000';
        const y = (i % 3) + this.finishY;
        const x = Math.floor(i / 3) - 4.5 + this.startX;
        return {
          type: 'rect',
          name: `Finish Box ${i}`,
          fillColor,
          x,
          y,
          length: 1,
          width: 1,
        };
      }),
    ];
  }

  info() {
    return {
      ...super.info(),
      name: 'Hello Ego!',
      description: 'Modify the controls values in the `tick` function to make Ego drive to the finish line in less than *15 seconds*.',
      defaultCode,
      timeout: 15,
    };
  }

  checkGoal({ pose, tPrev = 0 }) {
    const fail = tPrev >= this.timeout &&
        `need to reach the finish line in < ${this.timeout} seconds -- try accelerating faster!`;
    const pass = !fail && pose.y > this.finishY;
    return { pass, fail };
  }
}

