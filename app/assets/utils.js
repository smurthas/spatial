const setCollisionPolysM = (asset) => {
  const { scale, collisionPolys, width, height } = asset;
  if (!collisionPolys) {
    return;
  }
  asset.collisionPolysM = collisionPolys.map(poly => poly.map(({ x, y }) => ({ /* eslint no-param-reassign: 0 */
    x: (x - (width / 2)) / scale,
    y: ((height / 2) - y) / scale,
  })));
};


export {
  setCollisionPolysM,
};
