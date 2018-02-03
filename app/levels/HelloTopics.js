
const defaultCode =`
// onInit will be called when you hit Play.
// The topics object is used to send and receive messages.
function onInit(topics) {
  // first, list to the /ego/pose topic, which will be
  // sent whenever the car moves. (the car is called "ego"
  // and pose its combined position and orientation)
  topics.on('/ego/pose', ({ timestamp, pose }) => {
    // TODO: set the acceleration value of the control message
    const controls = {
      a: 0.2, // acceleration of the car
      b: 0, // braking of the car
      theta: 0, // steering angle, < 0 is left, > 0 is right
    };

    // publish the controls message to the car
    topics.emit('/ego/controls', controls);
  });
}

// Not used for now, but we'll need it later
function onSensors() {}
`.trim();

export default class HelloTopics {
  constructor(options={}) {
    const { startX=50, startY=50 } = options;
    this.finishY = startY + 50;
    const img = (asset, x, y) => ({ type: 'img', asset, x: startX+x, y: startY+y });
    const bushArea = (x, y) => img('bushArea', x, y);
    const tire = (x, y) => img('tire', x, y);
    const tree = (x, y) => img('tree', x, y);
    this.map = {
      areas: [
        {
          type: 'rect',
          name: 'Grass',
          asset: 'grass',
          x: startX,
          y: startY,
          length: 1000,
          width: 1000,
        },
        {
          type: 'rect',
          name: 'Road',
          asset: 'asphalt',
          x: startX,
          y: (this.finishY + startY) / 2,
          length: 10,
          width: 5 * (this.finishY - startY),
        },

        tire(6, 0),
        tire(6.1, 2.5),
        tire(6, 4.9),

        tree(20, 20),
        tree(14, 31),
        tree(-31, 3),
        tree(-22, 29),
        tree(11, -3),
        tree(-11, 45),
        tree(22, 62),
        tree(18, 76),
        tree(-33, 41),
        tree(-25, 65),
        tree(12, 43),
        tree(-13, 82),
        tree(-21, 104),
        tree(26, 108),

        bushArea(20, -2.7),
        bushArea(21, 0.7),

        bushArea(-15, 2.7),
        bushArea(-15, 4.7),

        bushArea(22, 32.7),
        bushArea(23, 30.7),

        bushArea(-10, 22.7),
        bushArea(-12, 24.7),

        bushArea(24, 52.7),
        bushArea(26, 50.7),

        bushArea(-15, 62.7),
        bushArea(-17, 64.7),

        bushArea(22, 72),
        bushArea(23, 71),

        bushArea(-25, 82.7),
        bushArea(-27, 84.7),

        {
          type: 'img',
          name: 'Grid',
          asset: 'grid',
          heading: Math.PI / 2,
          x: startX,
          y: startY + 2.7,
        },
        ...Array.from(' '.repeat(30)).map((_, i) => {
          const fillColor = i%2 ? '#fff' : '#000';
          const y = (i % 3) + this.finishY;
          const x = Math.floor(i / 3) - 4.5 + startX;
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
      ],
    };

    this.timeout = 15;
  }

  static info() {
    return {
      name: 'Hello Topics!',
      description: 'Modify the `controls` message in the `onInit` function to make the car drive into the white box.',
      defaultCode,
    };
  }

  reset() {
  }

  getSensors() {
    return {
      color: 'black',
    };
  }

  checkGoal({ pose, tPrev=0 }) {
    const fail = tPrev >= this.timeout &&
        `need to reach the box in < ${this.timeout} seconds -- try accelerating faster!`;
    const pass = !fail && pose.y > this.finishY;
    return { pass, fail };
  }
}

