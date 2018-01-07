const assert = require('assert');

const Pose = require('./Pose');
const createTransform = require('./transform');

const assertNearlyEqual = (a, b, eps = 0.000001) => {
  assert.equal(Math.round(a / eps) * eps, Math.round(b / eps) * eps);
};

describe('tf', () => {
  describe('2D', () => {
    it('should translate', () => {
      const tf = createTransform({ position: { x: 1 } });
      const { x, y, z } = tf(new Pose()).position;
      assert.equal(x, -1);
      assert.equal(y, 0);
      assert.equal(z, 0);
    });

    it('should rotate', () => {
      const tf = createTransform({ orientation: { yaw: Math.PI/4.0 } });
      const { x, y, z } = tf(new Pose({ position: { x: 1 }})).position;
      assertNearlyEqual(x, Math.sqrt(2)/2.0);
      assertNearlyEqual(y, -1.0 * Math.sqrt(2)/2.0);
      assertNearlyEqual(z, 0);
    });

    it('should rotate and translate', () => {
      const tf = createTransform({ position: { x: 1 }, orientation: { yaw: Math.PI/4.0 } });
      const { x, y, z } = tf(new Pose({ position: { x: 2, y: 1 }})).position;
      assertNearlyEqual(x, Math.sqrt(2));
      assertNearlyEqual(y, 0);
      assertNearlyEqual(z, 0);
    });
  });
});
