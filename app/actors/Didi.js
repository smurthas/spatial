import Pose from '../sim/Pose';
import Velocity from '../sim/Velocity';

import assets from '../assets';

const defaultState = () => ({ pose: new Pose(), velocity: new Velocity() });

const didi = ({ name = 'didi', state = defaultState() } = {}) => ({
  name,
  draw: {
    type: 'img',
    asset: 'diffDrive',
  },
  asset: assets.diffDrive,
  physics: {
    name: 'differentialDrive',
    trackWidth: 0.235,
  },
  state,
});

export default didi;
