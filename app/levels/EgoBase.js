import ego from '../actors/Ego';

import Pose from '../sim/Pose';
import Velocity from '../sim/Velocity';

export default class EgoBase {
  constructor(options={}) {
    const { startX = 0, startY = 0 } = options;
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
          length: 10,
          width: 5 * (this.finishY - startY),
        },

        tire(6, 0),
        tire(6.1, 2.5),
        tire(6, 4.9),

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

        {
          type: 'img',
          name: 'Grid',
          asset: 'grid',
          heading: Math.PI / 2,
          x: this.startX,
          y: this.startY + 2.7,
        },
      ],
    };

    this.actors = [
      ego({
        state: {
          pose: new Pose({
            position: { x: 0, y: 0 },
            orientation: { yaw: Math.PI / 2 },
          }),
          velocity: new Velocity(),
        },
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
    };
  }

  reset() {
  }

  getSensors() {
  }
}

