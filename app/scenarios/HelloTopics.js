
const defaultCode =`
// onInit will be called when the simulation starts (i.e. when you
// hit Play). The topics object has two functions:

// topics.on(string: topic, function: callback):
//     subscribes to a topic and calls the callback
//     function when a message is published
//
// topics.emit(string: topic, object: message):
//     publishes a message on a topic
function onInit(topics) {
  // first, we subscribe to the /ego/pose topic, which will call our
  // callback function whenever the car moves (the car is called "ego"
  // by convention and pose is its combined position and orientation)
  topics.on('/ego/pose', pose => {
    // TODO: set the acceleration value of the control message
    const controls = {
      // the forward acceleration of the vehicle
      // Set this to > 0 to move the vehicle forward
      // A value > 3 is equivalent to flooring it!
      a: 0.2,

      // the braking acceleration of the vehicle
      // Set this to > 0 to slow the vehicle down
      b: 0,

      // the angle of the steering wheel
      // > 0: turn left
      // < 0: turn right
      // = 0: drive straight
      theta: 0,
    };

    // this actually publishes the message that we constructed above
    // again, the topic name is a convention based on the car being called "ego"
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
          x: startX, y: boxY,
          length: 64, width: boxWidth,
        },
      ],
    };

    this.timeout = 15;
  }

  static info() {
    return {
      name: 'Hello Topics!',
      description: 'Drive the car to the white box by publishing a control message.',
      defaultCode,
    };
  }

  reset() {
  }

  getSensors(state) {
    return {
      color: 'black',
    };
  }

  checkGoal({ vehicle, t_prev=0 }) {
    const fail = t_prev >= this.timeout &&
        `need to reach the box in < ${this.timeout} seconds -- try accelerating faster!`;
    const pass = !fail && vehicle.y > this.boxYStart;
    return { pass, fail };
  }
}

