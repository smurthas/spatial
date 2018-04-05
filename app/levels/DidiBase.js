import didi from '../actors/Didi';
import wall from '../actors/Wall';
import bed01 from '../actors/Bed01';
import sofa01 from '../actors/Sofa01';
import sideTable01 from '../actors/SideTable01';
import housePlant01 from '../actors/HousePlant01';


export default class DidiBase {
  constructor(options = {}) {
    const {
      originX = 0,
      originY = 0,
      startX = 0,
      startY = 0,
      length = 3.75,
      width = 4.125,
    } = options;
    this.startX = startX;
    this.startY = startY;
    this.originX = originX;
    this.originY = originY;
    this.length = length;
    this.width = width;

    this.bottom = originY - 0.2;
    this.top = this.bottom + this.width;
    this.left = originX - 0.2;
    this.right = this.left + this.length;
    this.midX = (this.left + this.right) / 2;
    this.midY = (this.top + this.bottom) / 2;

    this.map = {
      areas: [
        {
          type: 'rect',
          name: 'baseboard',
          fillColor: 'white',
          x: this.midX,
          y: this.midY,
          width: this.width + 0.02,
          length: this.length + 0.02,
        },
        {
          type: 'rect',
          name: 'floor',
          asset: 'carpetBeige01',
          x: this.midX,
          y: this.midY,
          width,
          length,
        },
      ],
    };

    this.actors = [
      didi({
        state: {
          pose: {
            position: { x: this.startX, y: this.startY },
            orientation: { yaw: Math.PI / 2 },
          },
        },
        primaryCollider: true,
      }),
      wall({
        name: 'top-wall',
        fillColor: 'grey',
        width: 0.1,
        length: this.length + 0.2,
        state: {
          pose: {
            position: {
              x: this.midX,
              y: this.top + 0.05,
            },
          },
        },
      }),
      wall({
        name: 'left-wall',
        fillColor: 'grey',
        width: this.width + 0.2,
        length: 0.1,
        state: {
          pose: {
            position: {
              x: this.left - 0.05,
              y: this.midY,
            },
          },
        },
      }),
      wall({
        name: 'bottom-wall',
        fillColor: 'grey',
        width: 0.1,
        length: this.length + 0.2,
        state: {
          pose: {
            position: {
              x: this.midX,
              y: this.bottom - 0.05,
            },
          },
        },
      }),
      wall({
        name: 'left-wall',
        fillColor: 'grey',
        width: this.width + 0.2,
        length: 0.1,
        state: {
          pose: {
            position: {
              x: this.right + 0.05,
              y: this.midY,
            },
          },
        },
      }),
      bed01({
        name: 'bed',
        state: {
          pose: {
            position: {
              x: this.midX,
              y: this.bottom + 0.95,
            },
            orientation: {
              yaw: Math.PI,
            },
          },
        },
      }),
      sofa01({
        name: 'sofa',
        state: {
          pose: {
            position: {
              x: this.originX + 2.5,
              y: this.originY + 3.42,
            },
          },
        },
      }),
      sideTable01({
        name: 'sideTable',
        state: {
          pose: {
            position: {
              x: this.originX + 1.1,
              y: this.originY + 3.42,
            },
          },
        },
      }),
      housePlant01({
        name: 'housePlant',
        state: {
          pose: {
            position: {
              x: this.originX + 1.12,
              y: this.originY + 3.5,
            },
          },
        },
      }),
    ];
  }

  reset() { }

  getSensors() {
    return {};
  }

  info() {
    return {
      ego: {
        asset: 'diffDrive',
        physics: {
          name: 'differentialDrive',
          trackWidth: 0.235,
        },
        name: 'didi',
      },
      collisionIsFailure: false,
      center: {
        x: this.midX,
        y: this.midY,
      },
      display: [
        {
          type: 'points',
          from: '/didi/pose',
          fillColor: 'rgb(200, 50, 50)',
          radius: 0.03,
        },
      ],
      defaultScale: 120,
    };
  }
}

