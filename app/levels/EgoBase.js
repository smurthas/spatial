import ego from '../actors/Ego';

import Pose from '../sim/Pose';
import Velocity from '../sim/Velocity';

const LANE_WIDTH = 3.7;
const RIGHT_LANE_X = 0;
const LEFT_LANE_X = RIGHT_LANE_X - LANE_WIDTH;
const DASH_THICKNESS = 0.15;
const DASH_LENGTH = 3;

const finishBox = (finishX, finishY) => Array.from(' '.repeat(30)).map((_, i) => {
  const fillColor = i%2 ? '#fff' : '#000';
  const y = (i % 3) + finishY;
  const x = Math.floor(i / 3) - 4.5 + finishX;
  return {
    type: 'rect',
    name: `Finish Box ${i}`,
    fillColor,
    x,
    y,
    length: 1,
    width: 1,
  };
});

const centerLine = ({ x, totalLength }) => {
  const dashCount = Math.floor(totalLength / DASH_LENGTH);
  return Array.from(' '.repeat(dashCount)).map((_, i) => ({
    type: 'rect',
    name: `Center Line ${i}`,
    fillColor: i % 4 === 0 ? '#fff' : 'rgba(0,0,0,0)',
    x,
    y: -(totalLength/2) + i * DASH_LENGTH,
    length: DASH_THICKNESS,
    width: DASH_LENGTH,
  }));
};

export default class EgoBase {
  constructor(options={}) {
    const {
      startX = -LANE_WIDTH/2,
      startY = 0,
      roadWidth = LANE_WIDTH * 2,
      shoulderWidth = 1.2,
      egoStartPose = {
        position: { x: 0, y: 0 },
        orientation: { yaw: Math.PI / 2 },
      },
    } = options;
    const totalWidth = roadWidth + shoulderWidth * 2;
    const { finishY = startY + 50 } = options;
    const img = (asset, x, y) => ({ type: 'img', asset, x: startX+x, y: startY+y });
    const bushArea = (x, y) => img('bushArea', x, y);
    const tire = (x, y) => img('tire', x, y);
    const tree = (x, y) => img('tree', x, y);
    this.startX = startX;
    this.startY = startY;
    this.finishY = finishY;

    this.map = {
      areas: [
        {
          type: 'rect',
          name: 'Grass',
          asset: 'grass',
          x: this.startX,
          y: this.startY,
          length: 1000,
          width: 1000,
        },
        {
          type: 'rect',
          name: 'Road',
          asset: 'asphalt',
          x: this.startX,
          y: (this.finishY + this.startY) / 2,
          length: totalWidth,
          width: 5 * (this.finishY - startY),
        },

        {
          type: 'rect',
          name: 'leftShoulder',
          fillColor: '#fad201',
          x: this.startX - (roadWidth / 2),
          y: (this.finishY + this.startY) / 2,
          length: DASH_THICKNESS,
          width: 5 * (this.finishY - startY),
        },
        {
          type: 'rect',
          name: 'rightShoulder',
          fillColor: '#fff',
          x: this.startX + (roadWidth / 2),
          y: (this.finishY + this.startY) / 2,
          length: DASH_THICKNESS,
          width: 5 * (this.finishY - startY),
        },
        ...centerLine({ x: this.startX, totalLength: 5 * (this.finishY - startY) }),

        tire(totalWidth / 2 + 1.2, 0),
        tire(totalWidth / 2 + 1.3, 2.5),
        tire(totalWidth / 2 + 1.15, 4.9),

        tree(20, 20),
        tree(14, 31),
        tree(-31, 3),
        tree(-22, 29),
        tree(11, -3),
        tree(-11, 45),
        tree(22, 62),
        tree(18, 76),
        tree(-33, 41),
        tree(-25, 65),
        tree(12, 43),
        tree(-13, 82),
        tree(-21, 104),
        tree(26, 108),

        bushArea(20, -2.7),
        bushArea(21, 0.7),

        bushArea(-15, 2.7),
        bushArea(-15, 4.7),

        bushArea(22, 32.7),
        bushArea(23, 30.7),

        bushArea(-10, 22.7),
        bushArea(-12, 24.7),

        bushArea(24, 52.7),
        bushArea(26, 50.7),

        bushArea(-15, 62.7),
        bushArea(-17, 64.7),

        bushArea(22, 72),
        bushArea(23, 71),

        bushArea(-25, 82.7),
        bushArea(-27, 84.7),
      ],
    };

    this.actors = [
      ego({
        state: {
          pose: new Pose({
            position: egoStartPose.position,
            orientation: egoStartPose.orientation || { yaw: Math.PI / 2 },
          }),
          velocity: new Velocity(),
        },
        primaryCollider: true,
      }),
    ];

    this.timeout = 15;
  }

  info() {
    return {
      ego: {
        asset: 'car02',
        physics: {
          name: 'bicycle',
        },
        name: 'ego',
      },
      display: [
        {
          type: 'points',
          from: '/ego/pose',
          fillColor: 'rgb(200, 50, 50)',
          radius: 0.35,
        },
      ],
      defaultScale: 8,
      userImports: {
        LANE_WIDTH,
        RIGHT_LANE_X,
        LEFT_LANE_X,
      },
    };
  }

  reset() {
  }

  getSensors() {
  }
}

export {
  finishBox,
  LANE_WIDTH,
  RIGHT_LANE_X,
  LEFT_LANE_X,
};
