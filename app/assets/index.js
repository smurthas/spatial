
// map tiles
import asphaltTexture from './asphalt.png';
import bushAreaTexture from './bushArea.png';
import grassTexture from './grass.png';
import gridTexture from './grid.png';
import plantTexture from './plant.png';
import tireTexture from './tire.png';
import treeTexture from './tree.png';

// vehicles
import car01Texture from './car01.png';
import car02Texture from './car02.png';
import car03Texture from './car03.png';
import miniTruckTexture from './miniTruck.png';
import miniVanTexture from './miniVan.png';
import taxiTexture from './taxi.png';
import holoRobotTexture from './holoRobot.png';

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

  // vehicles
  car01: { src: car01Texture, height: 256, width: 256, scale: 48 },
  car02: { src: car02Texture, height: 256, width: 256, scale: 48 },
  car03: { src: car03Texture, height: 256, width: 256, scale: 48 },
  miniTruck: { src: miniTruckTexture, height: 256, width: 256, scale: 48 },
  miniVan: { src: miniVanTexture, height: 256, width: 256, scale: 48 },
  taxi: { src: taxiTexture, height: 256, width: 256, scale: 48 },
  holoRobot: { src: holoRobotTexture, height: 486, width: 486, scale: 800 },
  setLoadedCallback: cb => {
    textures.loadedCallback = cb;
    callIfLoaded();
  },
};

Object.keys(textures).forEach(t => {
  if (t === 'setLoadedCallback' || t === 'loadedCallback') {
    return;
  }
  textures[t].img = new Image();
  textures[t].img.onload = () => {
    loaded[t] = true;
    callIfLoaded();
  };
  textures[t].img.src = textures[t].src;
});

export default textures;

