
class Transform {
  constructor(tf) {
    const tfyaw = -1.0 * (tf.orientation && tf.orientation.yaw || 0);
    const tfx = tf.position && tf.position.x || 0;
    const tfy = tf.position && tf.position.y || 0;
    const cos = Math.cos(tfyaw);
    const sin = Math.sin(tfyaw);
    this.tf = (pose) => {
      const tx = pose.position.x - tfx;
      const ty = pose.position.y - tfy;
      const x = cos * tx - sin * ty;
      const y = cos * ty + sin * tx;
      const yaw = pose.orientation.yaw + tfyaw;
      return {
        position: { ...pose.position, x, y },
        orientation: { ...pose.orientation, yaw },
      };
    };
  }

  transform(pose) {
    return this.tf(pose);
  }

  inverse() {
    throw new Error('Not implemented!');
  }
}

export default Transform;
