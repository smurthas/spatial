const createTransform = require('../transform');

const PID = require('../PID');
const Pose = require('../Pose');

class BicycleController {
  constructor(options, topics) {
    const { p = -0.05, i = 0.0, d = -1.2, targetSpeed = 9.3, accel = 2 } = options;
    this.targetSpeed = targetSpeed;
    this.accel = accel;
    this.pid = new PID({ p, i, d });
    this.publishControls = topics.emit.bind(topics, options.publishControlsTopic);
  }

  on(type, evt) {
    switch (type) {
      case 'path':
        this.onPath(evt);
        break;
      case 'pose':
        this.onPose(evt);
        break;
      default:
        break;
    }
  }

  getNextTwoWaypoints() {
    const closestPointInfo = this.path.slice(0, this.path.length - 1).reduce((memo, point, i) => {
      const v = this.pose.position.minus(point.position);
      const distance = v.magnitude();
      if (distance < memo.distance) {
        return { distance, i };
      }

      return memo;
    }, { distance: Infinity, i: -1 });

    if (closestPointInfo.i < 0) {
      return null;
    }
    const { i } = closestPointInfo;
    if (i === 0) {
      return this.path.slice(0, 2);
    }

    const prev = new Pose(this.path[i - 1]).position;
    const closest = new Pose(this.path[i]).position;
    const next = new Pose(this.path[i + 1]).position;
    const v0 = prev.minus(closest).normalize();
    const v1 = next.minus(closest).normalize();
    const bisectV = v0.plus(v1).normalize();
    const yaw = Math.atan2(bisectV.y, bisectV.x);

    const tf = createTransform({ position: closest, orientation: { yaw } });
    const poseInBisect = tf(this.pose).position.y;
    const prevInBisect = tf({ position: prev, orientation: { yaw: 0 } }).position.y;
    const offset = poseInBisect / prevInBisect > 0 ? -1 : 0;
    return this.path.slice(i + offset, i + offset + 2);
  }

  computeControls() {
    // convert to vehicle frame
    if (!this.pose || !this.path || this.path.length < 2) {
      return;
    }

    const [prev, next] = this.getNextTwoWaypoints();

    const dy = next.position.y - prev.position.y;
    const dx = next.position.x - prev.position.x;
    const yaw = Math.atan2(dy, dx);
    const tfPrev = createTransform({ ...prev, orientation: { ...prev.orientation, yaw } });
    const poseInPathFrame = tfPrev(this.pose);
    const CTE = poseInPathFrame.position.y;
    let theta = this.pid.value(CTE);
    if (theta > 0.3) {
      theta = 0.3;
    } else if (theta < -0.3) {
      theta = -0.3;
    }

    const speed = this.velocity && this.velocity.linear.magnitude() || 0;
    const a = speed < this.targetSpeed ? this.accel : 0;
    const controls = { theta, a };
    this.publishControls(controls);
  }

  onPath(path) {
    this.path = path;
  }

  onPose({ timestamp, pose }) {
    if (this.pose) {
      const dt = timestamp - this.lastPoseTimestamp;
      this.velocity = {
        linear: new Pose(pose).minus(this.pose).scale(1.0/dt).position,
      };
    }
    this.pose = new Pose(pose);
    this.lastPoseTimestamp = timestamp;
    this.computeControls();
  }
}

module.exports = BicycleController;
