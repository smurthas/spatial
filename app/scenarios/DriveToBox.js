
const BOX_START_Y = 400;
const BOX_STOP_Y = 450;

const isInBox = ({ y }) => y > BOX_START_Y && y < BOX_STOP_Y;

export const info = {
  name: 'Stop in the Box',
  description: 'Drive to the black box and then stop the vehicle. The vehicle is equipped with a light sensor which will result in sensors.color === \'black\' when it is over the black box',
};

export const map = {
  areas: [
    {
      type: 'rect',
      name: 'Stop Box',
      fillColor: '#222',
      x: 320,
      y: (BOX_START_Y + BOX_STOP_Y) / 2,
      length: 640,
      width: (BOX_STOP_Y - BOX_START_Y),
      heading: 0,
    },
  ],
};

export const getSensors = (state) => ({
  color: isInBox(state.vehicle) ? 'black' : 'white',
});

export const checkGoal = (state) => {
  const { s, v } = state.vehicle;
  return s > BOX_START_Y && s < BOX_STOP_Y && Math.abs(v) < 0.05;
};

