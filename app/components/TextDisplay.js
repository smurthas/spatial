import React from 'react';
import PropTypes from 'prop-types';

const pprintValue = (val, len, dec) => {
  const v = `${(Math.round(val / dec) * dec)}`;
  const endIdx = v.indexOf('.') + 3;
  const numberString = endIdx >= 4 ? v.slice(0, endIdx) : v;
  return numberString + (' '.repeat(Math.max(len - numberString.length, 0)));
};

const PoseValue = ({ name, value, len = 7 }) => (
  <span><span style={{ fontWeight: 'bold' }}>{name}:</span>
    <span style={{ width: (len * 10) + 10, paddingLeft: 4, display: 'inline-block' }}>{pprintValue(value, len, 0.01)}</span>
  </span>
);

PoseValue.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  len: PropTypes.number,
};

const Position = ({ x, y }) => (
  <span>
    <PoseValue name="x" value={x} />
    <PoseValue name="y" value={y} />
  </span>
);

Position.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
};

const Pose = ({ x, y, yaw }) => (
  <span>
    <PoseValue name="x" value={x} />
    <PoseValue name="y" value={y} />
    <PoseValue name="yaw" value={yaw} />
  </span>
);

Pose.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  yaw: PropTypes.number.isRequired,
};

export {
  Pose,
  Position,
};

