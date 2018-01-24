export default class Static {
  constructor(options) {
    const { position, orientation } = options.pose || {};
    this.pose = {
      position: { x: 0, y: 0, z: 0, ...position },
      orientation: { roll: 0, pitch: 0, yaw: 0, ...orientation },
    };
    this.velocity = {
      linear: { x: 0, y: 0, z: 0 },
      angular: { roll: 0, pitch: 0, yaw: 0 },
    };
  }

  step() {
    // pass
  }
}

