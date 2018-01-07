class Vector {
  constructor({ x = 0, y = 0, z = 0 }) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  plus(other) {
    return new Vector({
      x: other.x + this.x,
      y: other.y + this.y,
      z: other.z + this.z,
    });
  }

  minus(other) {
    return this.plus(new Vector(other).negative());
  }

  scale(scalar) {
    return new Vector({
      x: this.x * scalar,
      y: this.y * scalar,
      z: this.z * scalar,
    });
  }

  negative() {
    return this.scale(-1.0);
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    return this.scale(1.0/ this.magnitude());
  }

  dot(other) {
    const vo = new Vector(other);
    return vo.x*this.x + vo.y*this.y + vo.z*this.z;
  }
}

module.exports = Vector;
