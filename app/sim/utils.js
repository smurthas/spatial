// const createTransform = require('./transform');
// const Pose = require('./Pose');
const Vector = require('./Vector');

module.exports.round = (number, decimals = 0) => {
  const multiplier = 10**decimals;
  return Math.round(number * multiplier) / multiplier;
};

module.exports.computeOGridFromPoses = ({ poses, rows, cols, resolution, origin }) => {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      grid[i] = 0;
    }
  }

  const { x: originX, y: originY } = origin;
  poses.forEach(({ x, y }) => {
    const r = Math.floor((y - originY) / resolution);
    const c = Math.floor((x - originX) / resolution);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      grid[r*cols + c] = 1;
    }
  });

  return grid;
};

/*
const sum = arr => arr.reduce((acc, v) => acc + v, 0);

module.exports.projectOGrid = (source, target) => {
  const targetLength = target.width * target.height;
  const data = new Array(targetLength);
  for (let i = 0; i < targetLength; i++) {
    data[i] = 0;
  }
  const scale = target.resolution / source.resolution;
  const worldToSource = createTransform(source.origin);
  const sourceToTarget = createTransform(worldToSource(target.origin));
  //source.data.forEach((v, idx) => {
  for (let idx = 0; idx < source.data.length; idx++) {
    const v = source.data[idx];
    if (v === 0) {
      continue;
      //return;
    }
    const row = Math.floor(idx / source.width);
    const col = idx % source.width;
    const ySrc = (row + 0.5) * source.resolution;
    const xSrc = (col + 0.5) * source.resolution;
    const srcPose = new Pose({ position: { x: xSrc, y: ySrc } });
    const { x: xTar, y: yTar } = sourceToTarget(srcPose).position;
    const targetRow = Math.floor(yTar / target.resolution);
    const targetCol = Math.floor(xTar / target.resolution);
    const inGrid = targetRow >= 0 && targetRow < target.height &&
                   targetCol >= 0 && targetCol < target.width;
    if (inGrid) {
      const targetIdx = (targetRow * target.width) + targetCol;
      data[targetIdx] += v / scale;
    }
  }
  //);

  return {
    ...target,
    data,
  };
};
*/

const checkCollisionDivides = (bbox1, bbox2) => {
  for (let i = 0; i < bbox1.length; i++) {
    const a = new Vector(bbox1[i].position);
    const b = new Vector(bbox1[(i+1) % bbox1.length].position);
    const heading = Math.atan2(b.y - a.y, b.x - a.x) + (Math.PI/2);
    const v = new Vector({ x: Math.cos(heading), y: Math.sin(heading) });
    const c = new Vector(bbox1[(i+2) % bbox1.length].position);
    const bbox1Sign = v.dot(c.minus(a));
    let divides = true;
    for (let j = 0; j < bbox2.length; j++) {
      const d = new Vector(bbox2[j].position);
      const ad = d.minus(a);
      const sameSign = v.dot(ad) * bbox1Sign > 0;
      divides = divides && !sameSign;
    }
    if (divides) {
      return true;
    }
  }

  return false;
};

const checkPolyCollision = (bbox1, bbox2) =>
  !(checkCollisionDivides(bbox1, bbox2) ||
    checkCollisionDivides(bbox2, bbox1));

module.exports.checkCollision = (polys1, polys2) => {
  for (let i = 0; i < polys1.length; i++) {
    const p1 = polys1[i];
    for (let j = 0; j < polys2.length; j++) {
      const p2 = polys2[j];
      if (checkPolyCollision(p1, p2)) {
        return true;
      }
    }
  }
  return false;
};
