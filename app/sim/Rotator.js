const TWO_PI = Math.PI * 2.0;

class Rotator {
  constructor({ roll = 0, pitch = 0, yaw = 0 }) {
    this.roll = roll % TWO_PI;
    this.pitch = pitch % TWO_PI;
    this.yaw = yaw % TWO_PI;
  }

  plus(other) {
    return new Rotator({
      roll: this.roll + other.roll,
      pitch: this.pitch + other.pitch,
      yaw: this.yaw + other.yaw,
    })
  }

  minus(other) {
    return this.plus(new Rotator(other).negative());
  }

  scale(scalar) {
    return new Rotator({
      roll: this.roll * scalar,
      pitch: this.pitch * scalar,
      yaw: this.yaw * scalar,
    });
  }

  negative() {
    return this.scale(-1.0);
  }

}

module.exports = Rotator;
