class PID {
  constructor({ p, i, d }) {
    this.coeffs = { p, i, d };
    this.prevP = null;
    this.iSum = 0;
  }

  value(p, dt = 1) {
    this.iSum += p;

    const compute = this.prevP !== null;
    const dVal = (p - this.prevP) * dt;
    this.prevP = p;

    if (!compute) {
      return 0;
    }

    const pOutput = this.coeffs.p * p;
    const iOutput = this.coeffs.i * this.iSum;
    const dOutput = this.coeffs.d * dVal;

    return pOutput + iOutput + dOutput;
  }
}

module.exports = PID;
