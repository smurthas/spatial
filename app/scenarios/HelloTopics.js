
const defaultCode =`
// onInit will be called when you hit Play.
// The topics object is used to send and receive messages.
function onInit(topics) {
  // first, list to the /ego/pose topic, which will be
  // sent whenever the car moves. (the car is called "ego"
  // and pose its combined position and orientation)
  topics.on('/ego/pose', pose => {
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
    const boxWidth = 50;
    const boxY = startY + 50;
    this.boxYStart = boxY - (boxWidth / 2);
    this.map = {
      areas: [
        {
          type: 'rect',
          name: 'Stop Box',
          fillColor: '#eee',
          x: startX,
          y: boxY,
          length: 64,
          width: boxWidth,
        },
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

  checkGoal({ vehicle, tPrev=0 }) {
    const fail = tPrev >= this.timeout &&
        `need to reach the box in < ${this.timeout} seconds -- try accelerating faster!`;
    const pass = !fail && vehicle.y > this.boxYStart;
    return { pass, fail };
  }
}

