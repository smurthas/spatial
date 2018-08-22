import EgoBase, {
  finishBox,
  LEFT_LANE_X,
  RIGHT_LANE_X,
  LANE_WIDTH,
} from './EgoBase';

import laneFollower from '../actors/LaneFollowingCar';

import Pose from '../sim/Pose';
import Velocity from '../sim/Velocity';

const defaultCode = `
const { RIGHT_LANE_PATH, LEFT_LANE_PATH, LANE_WIDTH } = require('level');
const PIDPathFollower = require('pid-path-follower');

const pathFollower = new PIDPathFollower({
  p: -0.08, // how much the car turns based on how far away from the path it is
  i: 0,
  d: -1.0, // how much the turns relative to how quickly it is approaching the path
});

function tick({ ego, timestamp }) {
  // this path follower needs the current pose to compute new controls
  pathFollower.setPose({ timestamp, pose: ego.pose });

  // it also needs the desired path
  pathFollower.setPath(LEFT_LANE_PATH);

  // set the speed that the car will accelerate up to
  pathFollower.setTargetSpeed(5);

  // This will compute (and set) controls to guide Ego to follow the path
  ego.setControls(pathFollower.computeControls());
}`.trim();

const constructLaneFollowers = (followers) => followers.map(({ lane, asset }, i) => laneFollower({
  name: `laneFollower_${i}`,
  state: {
    pose: new Pose({
      position: { x: (i%2)* LEFT_LANE_X, y: 10 + i * 20 },
      orientation: { yaw: Math.PI / 2 },
    }),
    velocity: new Velocity(),
    lane,
  },
  targetSpeed: 4 + (i%2),
  asset,
}));

const UP = Math.PI / 2;
const LEFT_LANE_PATH = [
  new Pose({ position: { x: LEFT_LANE_X, y: 0 }, orientation: { yaw: UP } }),
  new Pose({ position: { x: LEFT_LANE_X, y: 250 }, orientation: { yaw: UP } }),
];
const RIGHT_LANE_PATH = [
  new Pose({ position: { x: RIGHT_LANE_X, y: 0 }, orientation: { yaw: UP } }),
  new Pose({ position: { x: RIGHT_LANE_X, y: 250 }, orientation: { yaw: UP } }),
];

export default class HighwayDriving extends EgoBase {
  constructor(options = {}) {
    super({
      ...options,
      finishY: (options.startY || 0) + 200,
    });

    this.followers = constructLaneFollowers([
      {
        lane: RIGHT_LANE_PATH,
        asset: 'taxi',
      },
      {
        lane: LEFT_LANE_PATH,
        asset: 'miniTruck',
      },
      {
        lane: RIGHT_LANE_PATH,
        asset: 'miniVan',
      },
    ]);

    this.actors = [
      ...this.actors,
      ...this.followers,
    ];
    this.map.areas = [
      ...this.map.areas,
      ...finishBox(this.startX, 302.5),
    ];
  }

  info() {
    const superInfo = super.info();
    return {
      ...superInfo,
      name: 'Ego Takes To The Highway!',
      description: 'Drive along the highway, don\'t hit any cars! You might find it helpful to the use the `PIDPathFollower` class, which when given a series of points, will calculate controls to follow the path. The values of `p`, `i`, and `d` control how tightly the vehicle will follow the path. See [wikipedia](https://en.wikipedia.org/wiki/PID_controller) for more info.',
      defaultCode,
      timeout: 52,
      collisionIsFailure: true,
      userImports: {
        ...superInfo.userImports,
        LEFT_LANE_PATH,
        RIGHT_LANE_PATH,
      },
    };
  }

  reset() {
  }

  checkGoal({ pose: { x, y } } = {}) {
    const offLeft = x < (LEFT_LANE_X - (LANE_WIDTH/3));
    const offRight = x > (RIGHT_LANE_X + (LANE_WIDTH/3));
    if (offLeft || offRight) {
      return { fail: 'Keep Ego on the road!' };
    }
    return y > 300 && { pass: 'Nice!' };
  }

}
