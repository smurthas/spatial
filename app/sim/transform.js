
const createTransform = (tf) => {
  const tfyaw = -1.0 * (tf.orientation && tf.orientation.yaw || 0);
  const tfx = tf.position && tf.position.x || 0;
  const tfy = tf.position && tf.position.y || 0;
  return (pose) => {
    const tx = pose.position.x - tfx;
    const ty = pose.position.y - tfy;
    const cos = Math.cos(tfyaw);
    const sin = Math.sin(tfyaw);
    const x =  cos * tx - sin * ty;
    const y =  cos * ty + sin * tx;
    const yaw = pose.orientation.yaw + tfyaw;
    return {
      position: { ...pose.position, x, y },
      orientation: { ...pose.orientation, yaw },
    }
  };
};

module.exports = createTransform;
