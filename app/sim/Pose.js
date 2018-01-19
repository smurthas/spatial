const Vector = require('./Vector');
const Rotator = require('./Rotator');

class Pose {
  constructor(other) {
    const { position, orientation } = other || {};
    this.position = new Vector(position || {});
    this.orientation = new Rotator(orientation || {});
  }

  plus(other) {
    return new Pose({
      position: other.position.plus(this.position),
      orientation: other.orientation.plus(this.orientation),
    });
  }

  minus(other) {
    return this.plus(other.negative());
  }

  scale(scalar) {
    return new Pose({
      position: this.position.scale(scalar),
      orientation: this.orientation.scale(scalar),
    });
  }

  negative() {
    return this.scale(-1.0);
  }
}

module.exports = Pose;
