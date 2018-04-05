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
    <span className={`sim-pose-${name}`} style={{ width: (len * 10) + 10, paddingLeft: 4, display: 'inline-block' }}>{pprintValue(value, len, 0.01)}</span>
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

const PoseField = ({ x, y, yaw, id }) => (
  <span id={id}>
    <PoseValue name="x" value={x} len={6} />
    <PoseValue name="y" value={y} len={6} />
    <PoseValue name="yaw" value={yaw} len={6} />
  </span>
);

PoseField.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  yaw: PropTypes.number.isRequired,
  id: PropTypes.string,
};

export {
  PoseField,
  Position,
};

