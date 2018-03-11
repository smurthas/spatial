import Pose from '../sim/Pose';

import assets from '../assets';

const actor = ({ name, asset, state = { pose: {} } }) => ({
  name,
  draw: {
    type: 'img',
    asset,
  },
  asset: assets[asset],
  physics: {
    name: 'static',
  },
  state: { pose: new Pose(state.pose) },
});

export default actor;
