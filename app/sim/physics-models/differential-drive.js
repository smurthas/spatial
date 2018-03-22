import Transform from '../transform';
const Pose = require('../Pose');


const step = ({ dt }, { wheelSpeeds: { left = 0, right = 0 } = {}, trackWidth, esp = 0.0001 }) => {
  // driving straight (enough)
  if (Math.abs(left - right) < esp) {
    return {
      dx: left * dt,
      dy: 0,
      dyaw: 0,
    };
  }

  const vSlow = Math.min(left, right);
  const vFast = Math.max(left, right);
  const sign = left > right ? -1 : 1;
  const rBase = trackWidth / (vFast / vSlow - 1);
  const rPose = rBase + (trackWidth / 2);

  // turning in place
  if (Math.abs(rPose) < esp) {
    const arcLen = vFast * dt;
    const alpha = arcLen / (trackWidth / 2);
    const dyaw = alpha * sign;
    return { dx: 0, dy: 0, dyaw };
  }

  // driving in an arc
  const arcLen = (vFast + vSlow) / 2 * dt;
  const alpha = arcLen / rPose;
  const dyaw = alpha * sign;

  const dx = Math.sin(alpha) * rPose;
  const dy = (1 - Math.cos(alpha)) * rPose * sign;
  return { dx, dy, dyaw };
};

export default class DifferentialDriveModel {
  constructor(options) {
    this.trackWidth = options.trackWidth;
  }

  step({ dt, pose }, controls) {
    const values = {
      pose,
      trackWidth: this.trackWidth,
      ...controls,
    };
    const { dx, dy, dyaw } = step({ dt }, values);
    const dPose = new Pose({
      position: { x: dx, y: dy },
      orientation: { yaw: dyaw },
    });
    const worldToVehicle = new Transform(pose);
    const worldOriginInVehicleFrame = worldToVehicle.transform(new Pose());
    const vehicleToWorld = new Transform(worldOriginInVehicleFrame);
    const nextPose = new Pose(vehicleToWorld.transform(dPose));
    return {
      pose: nextPose,
    };
  }
}
