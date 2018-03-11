import getImageData from 'get-image-data';

import { setCollisionPolysM } from './utils';

// map tiles
import asphaltTexture from './asphalt.png';
import bushAreaTexture from './bushArea.png';
import grassTexture from './grass.png';
import gridTexture from './grid.png';
import plantTexture from './plant.png';
import tireTexture from './tire.png';
import treeTexture from './tree.png';

// home map tiles
import carpetBeige01Texture from './carpetBeige01.png';

// furniture
import bed01Texture from './furniture/bed01.png';
import sofa01 from './furniture/sofa01.png';

// vehicles
import car01Texture from './car01.png';
import car02Texture from './car02.png';
import car03Texture from './car03.png';
import miniTruckTexture from './miniTruck.png';
import miniVanTexture from './miniVan.png';
import taxiTexture from './taxi.png';
import diffDriveTexture from './diffDrive.png';

const loaded = {};

const callIfLoaded = () => {
  const loadedCount = Object.keys(loaded).length;
  const textureCount = Object.keys(textures).length - 2;
  if (loadedCount === textureCount && textures.loadedCallback) {
    textures.loadedCallback();
  }
};


const textures = {
  // map tiles
  asphalt: { src: asphaltTexture, height: 256, width: 256, scale: 10 },
  bushArea: { src: bushAreaTexture, height: 128, width: 128, scale: 20 },
  grass: { src: grassTexture, height: 256, width: 256, scale: 10 },
  grid: { src: gridTexture, height: 27, width: 6, scale: 7 },
  plant: { src: plantTexture, height: 64, width: 64, scale: 10 },
  tire: { src: tireTexture, height: 64, width: 64, scale: 32 },
  tree: { src: treeTexture, height: 64, width: 64, scale: 12 },

  // home map tiles
  carpetBeige01: { src: carpetBeige01Texture, height: 632, width: 632, scale: 1230 },

  // furniture
  bed01: {
    src: bed01Texture,
    scale: 840,
    collisionPolys: [
      [
        { x: 64, y: 0 },
        { x: 64, y: 400 },
        { x: 2436, y: 400 },
        { x: 2436, y: 0 },
      ],
      [
        { x: 560, y: 400 },
        { x: 560, y: 1535 },
        { x: 1940, y: 1535 },
        { x: 1940, y: 400 },
      ],
    ],
  },
  sofa01: {
    src: sofa01,
    scale: 450,
    collisionPolys: [
      [
        { x: 60, y: 60 },
        { x: 60, y: 480 },
        { x: 940, y: 480 },
        { x: 940, y: 60 },
      ],
    ],
  },

  // vehicles
  car01: { src: car01Texture, height: 256, width: 256, scale: 48 },
  car02: { src: car02Texture, height: 256, width: 256, scale: 48 },
  car03: { src: car03Texture, height: 256, width: 256, scale: 48 },
  miniTruck: { src: miniTruckTexture, height: 256, width: 256, scale: 48 },
  miniVan: { src: miniVanTexture, height: 256, width: 256, scale: 48 },
  taxi: { src: taxiTexture, height: 256, width: 256, scale: 48 },
  diffDrive: {
    src: diffDriveTexture,
    scale: 1230,
    collisionPolys: [
      [
        { x: 243, y: 35 },
        { x: 93, y: 93 },
        { x: 35, y: 243 },
        { x: 93, y: 393 },
        { x: 243, y: 451 },
        { x: 393, y: 393 },
        { x: 451, y: 243 },
        { x: 393, y: 93 },
      ],
    ],
  },
  setLoadedCallback: cb => {
    textures.loadedCallback = cb;
    callIfLoaded();
  },
};

/*
const computeOGridFromImage = (src, resolution, scale, callback) => {
  getImageData(textures[t].src, (err, info) => {
    if (err) {
      return callback(err, info);
    }
    const { width, height, data } = info;
    const channels = Math.round(data.length / width / height);
    if (channels !== 4) {
      return callback('no alpha channel!');
    }
    const grid = {
      origin: { x: 0, y: 0 },
      resolution,
      data: [],
    };
    const pxPerCell = scale * resolution;
    const rows = Math.floor(height / pxPerCell);
    const cols = Math.floor(width / pxPerCell);
    for (let gr = 0; gr < rows; gr++) {
      for (let gc = 0; gc < cols; gc++) {
        const cellStartRow = Math.floor(gr * pxPerCell);
        const cellEndRow = Math.floor((gr+1) * pxPerCell);
        const cellStartCol = Math.floor(gc * pxPerCell);
        const cellEndCol = Math.floor((gc+1) * pxPerCell);
        const cellValues = [];
        for (let pr = cellStartRow; pr < cellEndRow; pr++) {
          for (let pc = cellStartCol; pc < cellEndCol; pc++) {
            const idx = (pr * pc * 4) + 3; // apha channel @ rowXcol
            values.push(data[idx]);
          }
        }
      }
    }
    for (let r = 0; r < height; r += pxPerCell) {
      for (let c = 0; c < width; c += pxPerCell) {
        const values = [];
        const maxRow = Math.min(Math.round(r + pxPerCell), height);
        for (let row = Math.round(r); row < maxRow; row++) {
          const maxCol = Math.min(Math.round(c + pxPerCell), width);
          for (let col = Math.round(c); col < maxCol; col++) {
            const idx = (row * col * 4) + 3; // apha channel @ rowXcol
            values.push(data[idx]);
          }
        }

        const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
        data.push(avg);
      }
    }
  });
};

const gridFromAlpha = ({ width, height, data, scale }) => {
  const grid = [];
  for (let row = height - 1; row >= 0; row--) {
    for (let col = 0; col < width; col++) {
      const idx = (((row * width) + col) * 4) + 3;
      grid.push(data[idx]);
    }
  }
  const origin = {
    position: {
      x: -width/scale/2,
      y: -height/scale/2,
    }
  };
  return { origin, resolution: 1.0 / scale, data: grid, width, height };
};
*/

Object.keys(textures).forEach(t => {
  if (t === 'setLoadedCallback' || t === 'loadedCallback') {
    return;
  }
  textures[t].img = new Image();
  textures[t].img.onload = () => {
    loaded[t] = true;
    const tex = textures[t];
    // TODO: this call fails in tests, patch in place or something!
    getImageData(tex.src, (err, info) => {
      if (err) {
        return; // TODO: surface this, and it fails in tests
      }
      const { width, height } = info;
      tex.height = height;
      tex.width = width;
      setCollisionPolysM(tex);
      /*
      const channels = Math.round(data.length / width / height);
      if (channels !== 4) {
        console.error('no alpha channel, can\'t calculate mask');
      } else {
        textures[t].grid = gridFromAlpha({ width, height, data, scale});
      }
      */
      callIfLoaded();
    });
  };
  textures[t].img.src = textures[t].src;
});

export default textures;
