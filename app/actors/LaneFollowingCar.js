import Pose from '../sim/Pose';
import Velocity from '../sim/Velocity';
import BicyclePathFollower from '../sim/controllers/bicycle';

import assets from '../assets';

const defaultState = () => ({ pose: new Pose(), velocity: new Velocity() });

const laneFollower = ({
  name,
  asset = 'car01',
  state = defaultState(),
  targetSpeed = 5,
} = {}) => ({
  name,
  draw: {
    type: 'img',
    asset,
  },
  tick({ self: { pose, lane, setControls }, timestamp }) {
    if (!this.follower) {
      this.follower = new BicyclePathFollower({
        p: -0.05,
        i: 0,
        d: -0.2,
        targetSpeed,
      });
      this.follower.setPath(lane);
    }
    this.follower.setPose({ timestamp, pose });
    const ctrls = this.follower.computeControls();
    setControls(ctrls);
  },
  asset: assets[asset],
  physics: {
    name: 'bicycle',
    lf: 2.7,
    lr: 2.7,
  },
  state,
});

export default laneFollower;
