const Pose = require('../Pose');
const Vector = require('../Vector');
const Rotator = require('../Rotator');

const step = ({ lf, lr }, { theta, a, b }, pose, velocity, dt) => {
  const { position, orientation } = pose;
  const { linear, angular } = velocity;
  const speed = Math.sqrt(linear.x*linear.x + linear.y*linear.y);

  const x = position.x + linear.x*dt;
  const y = position.y + linear.y*dt;
  const yawrate = speed/lf*theta;
  const yaw = orientation.yaw + yawrate*dt;
  const dSpeed = Math.max((a - b) * dt, -1.0 * speed);
  const newSpeed = speed + dSpeed;
  const dxdt = Math.cos(yaw)*newSpeed;
  const dydt = Math.sin(yaw)*newSpeed;

  return {
    pose: new Pose({
      position: { ...position, x, y },
      orientation: { ...orientation, yaw },
    }),
    velocity: {
      linear: new Vector({ ...linear, x: dxdt, y: dydt }),
      angular: new Rotator({ ...angular, yaw: yawrate }),
    },
  };
};

class BicycleModel {
  constructor(options) {

    const { position, orientation } = options.pose || {};
    const { linear, angular } = options.velocity || {};
    this.pose = {
      position: {
        x: 0, y: 0, z: 0,
        ...position,
      }, orientation: {
        roll: 0, pitch: 0, yaw: 0,
        ...orientation,
      },
    };
    this.velocity = {
      linear: {
        x: 0, y: 0, z: 0,
        ...linear,
      },
      angular: {
        roll: 0, pitch: 0, yaw: 0,
        ...angular,
      },
    };

    this.lf = options.lf;
    this.lr = options.lr;
  }

  step({ dt }, { theta=0, a=0, b=0 }) {
    const { lf, lr, pose, velocity } = this;

    const update = step({ lf, lr }, { theta, a, b }, pose, velocity, dt);
    this.pose = update.pose;
    this.velocity = update.velocity;
  }
}

module.exports = BicycleModel;
