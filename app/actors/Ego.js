import Pose from '../sim/Pose';
import Velocity from '../sim/Velocity';

import assets from '../assets';

const defaultState = () => ({ pose: new Pose(), velocity: new Velocity() });

const ego = ({ name = 'ego', state = defaultState() } = {}) => ({
  name,
  draw: {
    type: 'img',
    asset: 'car02',
  },
  asset: assets.car02,
  physics: {
    name: 'bicycle',
    lf: 2.7,
    lr: 2.7,
  },
  state,
});

export default ego;
