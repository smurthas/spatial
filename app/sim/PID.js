class PID {
  constructor({ p, i, d }) {
    this.coeffs = { p, i, d };
    this.prev_p = null;
    this.i_sum = 0;
  }

  value(p, dt = 1) {
    this.i_sum += p;

    const compute = this.prev_p !== null;
    const d_val = (p - this.prev_p) * dt;
    this.prev_p = p;

    if (!compute) {
      return 0;
    }

    const p_output = this.coeffs.p * p;
    const i_output = this.coeffs.i * this.i_sum;
    const d_output = this.coeffs.d * d_val;

    return p_output + i_output + d_output;
  }
};

module.exports = PID;
