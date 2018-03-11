const Vector = require('./Vector');
const Rotator = require('./Rotator');

class Velocity {
  constructor(other) {
    const { linear, angular } = other || {};
    this.linear = new Vector(linear || {});
    this.angular = new Rotator(angular || {});
  }

  plus(other) {
    return new Velocity({
      linear: other.linear.plus(this.linear),
      angular: other.angular.plus(this.angular),
    });
  }

  minus(other) {
    return this.plus(other.negative());
  }

  scale(scalar) {
    return new Velocity({
      linear: this.linear.scale(scalar),
      angular: this.angular.scale(scalar),
    });
  }

  negative() {
    return this.scale(-1.0);
  }
}

module.exports = Velocity;
