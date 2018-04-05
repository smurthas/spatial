const setCollisionPolysM = (asset) => {
  const { scale, collisionPolys, width, height } = asset;
  if (!collisionPolys) {
    return;
  }

  // eslint-disable-next-line no-param-reassign
  asset.collisionPolysM = collisionPolys.map(poly => poly.map(({ x, y }) => ({
    x: (x - (width / 2)) / scale,
    y: ((height / 2) - y) / scale,
  })));
};


export {
  setCollisionPolysM,
};
