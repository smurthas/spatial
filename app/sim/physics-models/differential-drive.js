const Pose = require('../Pose');
const createTransform = require('../transform');


const step = ({ dt }, { vLeft = 0, vRight = 0, trackWidth, esp = 0.0001 }) => {
  // driving straight (enough)
  if (Math.abs(vLeft - vRight) < esp) {
    return {
      dx: vLeft * dt,
      dy: 0,
      dyaw: 0,
    };
  }

  const vSlow = Math.min(vLeft, vRight);
  const vFast = Math.max(vLeft, vRight);
  const sign = vLeft > vRight ? -1 : 1;
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
    const { dx = 0, dy = 0, dyaw = 0 } = step({ dt }, values);
    const dPose = new Pose({
      position: { x: dx, y: dy },
      orientation: { yaw: dyaw },
    });
    const worldToVehicle = createTransform(pose);
    const worldOriginInVehicleFrame = worldToVehicle(new Pose());
    const vehicleToWorld = createTransform(worldOriginInVehicleFrame);
    const nextPose = new Pose(vehicleToWorld(dPose));
    return {
      pose: nextPose,
    };
  }
}
