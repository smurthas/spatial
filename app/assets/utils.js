const setCollisionPolysM = (asset) => {
  const { scale, collisionPolys, width, height } = asset;
  if (!collisionPolys) {
    return;
  }

  // eslint-disable-next-line no-param-reassign
  asset.collisionPolysM = collisionPolys.map(poly => {
    if (poly.center) {
      return {
        center: {
          x: (poly.center.x - (width / 2)) / scale,
          y: ((height / 2) - poly.center.y) / scale,
        },
        radius: poly.radius / scale,
      };
    }

    return poly.map(({ x, y }) => ({
      x: (x - (width / 2)) / scale,
      y: ((height / 2) - y) / scale,
    }));
  });
};


export {
  setCollisionPolysM,
};
